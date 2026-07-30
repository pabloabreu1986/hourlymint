import { loadDB, delay } from "@/lib/db";
import { hoyISO } from "@/lib/seed";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import { calcularJornada } from "@/lib/horas";
import type { Fichaje, Obra, Usuario } from "@/lib/types";
import * as sb from "./supabase/dashboard";

export interface FichajeHoyTrabajador {
  trabajador: Usuario;
  /** Fichajes de hoy de este trabajador; el componente calcula la jornada
   * en vivo con `calcularJornada` recalculando cada segundo. */
  fichajesHoy: Fichaje[];
}

export interface DashboardData {
  kpis: {
    trabajadoresActivos: number;
    obrasActivas: number;
    incidenciasPendientes: number;
    materialesPendientes: number;
  };
  resumenObras: Array<{
    obra: Obra;
    encargado: Usuario | null;
    numTrabajadores: number;
  }>;
  tiempoReal: FichajeHoyTrabajador[];
  fichajesHoy: { correctos: number; pendientes: number; total: number };
}

function esDeHoy(iso: string): boolean {
  return iso.slice(0, 10) === hoyISO();
}

export async function getDashboard(): Promise<DashboardData> {
  if (isSupabaseEnabled) return sb.getDashboard();
  const db = loadDB();
  const tid = tenantActivoId();
  const trabajadores = db.usuarios.filter((u) => u.tenantId === tid && u.rol === "trabajador");
  const fichajesHoy = db.fichajes.filter((f) => f.tenantId === tid && esDeHoy(f.timestamp));

  const tiempoReal: FichajeHoyTrabajador[] = trabajadores.map((t) => ({
    trabajador: t,
    fichajesHoy: fichajesHoy
      .filter((f) => f.trabajadorId === t.id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  }));

  const activos = tiempoReal.filter((t) =>
    ["trabajando", "en_extra"].includes(calcularJornada(t.fichajesHoy).estado)
  ).length;
  const correctos = tiempoReal.filter(
    (t) => calcularJornada(t.fichajesHoy).estado !== "sin_fichar"
  ).length;
  const pendientes = trabajadores.length - correctos;

  // Materiales pendientes = suma de líneas en partes borrador del día
  const materiales = db.partes
    .filter((p) => p.tenantId === tid && p.estado === "borrador")
    .reduce((acc, p) => acc + p.materialesPendientes.length, 0);

  const obrasTenant = db.obras.filter((o) => o.tenantId === tid);
  const resumenObras = obrasTenant.map((obra) => ({
    obra,
    encargado: db.usuarios.find((u) => u.id === obra.encargadoId) ?? null,
    numTrabajadores: obra.trabajadorIds.length,
  }));

  const data: DashboardData = {
    kpis: {
      trabajadoresActivos: activos,
      obrasActivas: obrasTenant.filter((o) => o.estado === "en_curso").length,
      incidenciasPendientes: db.incidencias.filter(
        (i) => i.tenantId === tid && i.estado !== "resuelta"
      ).length,
      materialesPendientes: materiales,
    },
    resumenObras,
    tiempoReal,
    fichajesHoy: { correctos, pendientes, total: trabajadores.length },
  };
  return delay(data);
}
