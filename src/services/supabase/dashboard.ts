import { sb } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import { calcularJornada } from "@/lib/horas";
import type { DashboardData, FichajeHoyTrabajador } from "../dashboard";
import { toUsuario, toFichaje, toObra, check } from "./_map";

function rangoHoy(): [string, string] {
  const ini = new Date();
  ini.setHours(0, 0, 0, 0);
  const fin = new Date(ini);
  fin.setDate(fin.getDate() + 1);
  return [ini.toISOString(), fin.toISOString()];
}

export async function getDashboard(): Promise<DashboardData> {
  const client = sb();
  const [ini, fin] = rangoHoy();
  const tid = tenantActivoId();

  const usuarios = (
    check(await client.from("usuarios").select("*").eq("tenant_id", tid)) ?? []
  ).map(toUsuario);
  const obras = (
    check(await client.from("obras").select("*").eq("tenant_id", tid)) ?? []
  ).map(toObra);
  const fichajes = (
    check(
      await client
        .from("fichajes")
        .select("*")
        .eq("tenant_id", tid)
        .gte("timestamp", ini)
        .lt("timestamp", fin)
    ) ?? []
  ).map(toFichaje);
  const incidencias = check(
    await client.from("incidencias").select("estado").eq("tenant_id", tid)
  );
  const partes = check(
    await client
      .from("partes")
      .select("estado, materiales_pendientes")
      .eq("tenant_id", tid)
      .eq("estado", "borrador")
  );

  const trabajadores = usuarios.filter((u) => u.rol === "trabajador");

  const tiempoReal: FichajeHoyTrabajador[] = trabajadores.map((t) => ({
    trabajador: t,
    fichajesHoy: fichajes
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

  const materiales = (partes ?? []).reduce(
    (acc: number, p: { materiales_pendientes?: unknown[] }) =>
      acc + (p.materiales_pendientes?.length ?? 0),
    0
  );

  const resumenObras = obras.map((obra) => ({
    obra,
    encargado: usuarios.find((u) => u.id === obra.encargadoId) ?? null,
    numTrabajadores: obra.trabajadorIds.length,
  }));

  return {
    kpis: {
      trabajadoresActivos: activos,
      obrasActivas: obras.filter((o) => o.estado === "en_curso").length,
      incidenciasPendientes: (incidencias ?? []).filter(
        (i: { estado: string }) => i.estado !== "resuelta"
      ).length,
      materialesPendientes: materiales,
    },
    resumenObras,
    tiempoReal,
    fichajesHoy: { correctos, pendientes, total: trabajadores.length },
  };
}
