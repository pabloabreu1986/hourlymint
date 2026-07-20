import { loadDB, delay } from "@/lib/db";
import { hoyISO } from "@/lib/seed";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { Fichaje, Obra, Usuario } from "@/lib/types";
import * as sb from "./supabase/dashboard";

export interface FichajeHoyTrabajador {
  trabajador: Usuario;
  estado: "en_obra" | "sin_fichar" | "salido";
  ultima: Fichaje | null;
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
  const trabajadores = db.usuarios.filter((u) => u.rol === "trabajador");
  const fichajesHoy = db.fichajes.filter((f) => esDeHoy(f.timestamp));

  const tiempoReal: FichajeHoyTrabajador[] = trabajadores.map((t) => {
    const suyos = fichajesHoy
      .filter((f) => f.trabajadorId === t.id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const entrada = suyos.find((f) => f.tipo === "entrada") ?? null;
    const salida = suyos.find((f) => f.tipo === "salida") ?? null;
    const ultima = suyos[suyos.length - 1] ?? null;
    const estado = salida ? "salido" : entrada ? "en_obra" : "sin_fichar";
    return { trabajador: t, estado, ultima };
  });

  const activos = tiempoReal.filter((t) => t.estado === "en_obra").length;
  const correctos = tiempoReal.filter((t) => t.estado !== "sin_fichar").length;
  const pendientes = trabajadores.length - correctos;

  // Materiales pendientes = suma de líneas en partes borrador del día
  const materiales = db.partes
    .filter((p) => p.estado === "borrador")
    .reduce((acc, p) => acc + p.materialesPendientes.length, 0);

  const resumenObras = db.obras.map((obra) => ({
    obra,
    encargado: db.usuarios.find((u) => u.id === obra.encargadoId) ?? null,
    numTrabajadores: obra.trabajadorIds.length,
  }));

  const data: DashboardData = {
    kpis: {
      trabajadoresActivos: activos,
      obrasActivas: db.obras.filter((o) => o.estado === "en_curso").length,
      incidenciasPendientes: db.incidencias.filter((i) => i.estado !== "resuelta").length,
      materialesPendientes: materiales,
    },
    resumenObras,
    tiempoReal,
    fichajesHoy: { correctos, pendientes, total: trabajadores.length },
  };
  return delay(data);
}
