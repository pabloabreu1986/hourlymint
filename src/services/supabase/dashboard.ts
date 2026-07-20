import { sb } from "@/lib/supabase";
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

  const usuarios = (check(await client.from("usuarios").select("*")) ?? []).map(toUsuario);
  const obras = (check(await client.from("obras").select("*")) ?? []).map(toObra);
  const fichajes = (
    check(
      await client.from("fichajes").select("*").gte("timestamp", ini).lt("timestamp", fin)
    ) ?? []
  ).map(toFichaje);
  const incidencias = check(await client.from("incidencias").select("estado"));
  const partes = check(
    await client.from("partes").select("estado, materiales_pendientes").eq("estado", "borrador")
  );

  const trabajadores = usuarios.filter((u) => u.rol === "trabajador");

  const tiempoReal: FichajeHoyTrabajador[] = trabajadores.map((t) => {
    const suyos = fichajes
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
