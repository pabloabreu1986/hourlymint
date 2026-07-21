import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi, incidenciasApi, partesApi, obrasApi } from "@/services";
import type { DashboardData } from "@/services/dashboard";
import type { Incidencia, ParteDiario, Obra, Usuario } from "@/lib/types";
import { calcularJornada, formatDuracion, type Jornada } from "@/lib/horas";
import { sb, isSupabaseEnabled } from "@/lib/supabase";
import {
  Avatar,
  Badge,
  Cargando,
  Donut,
  EstadoObraBadge,
  ProgressBar,
} from "@/components/ui";
import { WorkerMap } from "@/components/WorkerMap";
import { fechaHora, hora } from "@/lib/format";
import { IconUsers, IconObras, IconAlert, IconBox } from "@/components/icons";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [partes, setPartes] = useState<ParteDiario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    dashboardApi.getDashboard().then(setData);
    incidenciasApi.listIncidencias().then((i) => setIncidencias(i.slice(0, 3)));
    partesApi.listPartes().then(setPartes);
    obrasApi.listObras().then(setObras);
  }, []);

  // Cronómetros en vivo: recalculan cada segundo con la hora actual.
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // El estado (quién ficha qué) se propaga por Realtime, no por polling:
  // cualquier cambio en `fichajes` vuelve a pedir el dashboard completo.
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    const canal = sb()
      .channel("dashboard-fichajes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fichajes" },
        () => dashboardApi.getDashboard().then(setData)
      )
      .subscribe();
    return () => {
      sb().removeChannel(canal);
    };
  }, []);

  if (!data) return <Cargando />;

  const nombreObra = (id: string) => obras.find((o) => o.id === id)?.nombre ?? "—";

  // Materiales pendientes agregados de partes borrador
  const materiales = partes
    .filter((p) => p.estado === "borrador")
    .flatMap((p) => p.materialesPendientes.map((m) => ({ ...m, obra: nombreObra(p.obraId) })))
    .slice(0, 4);

  const { fichajesHoy } = data;
  const pct = (n: number) =>
    fichajesHoy.total ? Math.round((n / fichajesHoy.total) * 100) : 0;

  const kpis = [
    {
      label: "Trabajadores",
      value: data.kpis.trabajadoresActivos,
      sub: "En activo hoy",
      icon: IconUsers,
      color: "#2E6F8E",
    },
    {
      label: "Obras activas",
      value: data.kpis.obrasActivas,
      sub: "En curso",
      icon: IconObras,
      color: "#5B7A4B",
    },
    {
      label: "Incidencias",
      value: data.kpis.incidenciasPendientes,
      sub: "Pendientes",
      icon: IconAlert,
      color: "#DC2626",
    },
    {
      label: "Materiales pendientes",
      value: data.kpis.materialesPendientes,
      sub: "Por entregar",
      icon: IconBox,
      color: "#BE6B39",
    },
  ];

  const jornadas = data.tiempoReal.map((t) => ({
    trabajador: t.trabajador,
    jornada: calcularJornada(t.fichajesHoy, ahora),
  }));
  const activos = jornadas.filter((j) =>
    ["trabajando", "en_extra"].includes(j.jornada.estado)
  ).length;
  const descansando = jornadas.filter((j) => j.jornada.estado === "descansando").length;

  const mapPins = data.tiempoReal
    .flatMap((t) => t.fichajesHoy)
    .filter((f) => f.gps)
    .reduce((acc: typeof data.tiempoReal[number]["fichajesHoy"], f) => {
      // Última coordenada por trabajador.
      const i = acc.findIndex((x) => x.trabajadorId === f.trabajadorId);
      if (i === -1 || f.timestamp > acc[i].timestamp) {
        if (i !== -1) acc.splice(i, 1);
        acc.push(f);
      }
      return acc;
    }, [])
    .map((f) => {
      const trabajador = data.tiempoReal.find((t) => t.trabajador.id === f.trabajadorId)!.trabajador;
      return { id: trabajador.id, coord: f.gps!, color: trabajador.color, label: trabajador.nombre };
    });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {k.label}
                </p>
                <p className="mt-2 text-3xl font-extrabold text-forge-dark">{k.value}</p>
                <p className="mt-1 text-xs text-slate-400">{k.sub}</p>
              </div>
              <span
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{ background: `${k.color}15`, color: k.color }}
              >
                <k.icon className="h-6 w-6" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Resumen de obras */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-forge-dark">Resumen de obras</h2>
            <Link to="/admin/obras" className="text-sm font-semibold text-forge-orange">
              Ver todas →
            </Link>
          </div>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2 font-semibold">Obra</th>
                  <th className="px-2 py-2 font-semibold">Encargado</th>
                  <th className="px-2 py-2 font-semibold">Trab.</th>
                  <th className="px-2 py-2 font-semibold">Avance</th>
                  <th className="px-2 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.resumenObras.map(({ obra, encargado, numTrabajadores }) => (
                  <tr key={obra.id}>
                    <td className="px-2 py-3 font-semibold text-forge-dark">{obra.nombre}</td>
                    <td className="px-2 py-3 text-slate-500">
                      {encargado?.nombre.split(" ")[0] ?? "—"}
                    </td>
                    <td className="px-2 py-3 text-slate-500">
                      {numTrabajadores}/{numTrabajadores}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={obra.avance} className="w-16" />
                        <span className="text-xs font-semibold text-slate-500">{obra.avance}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <EstadoObraBadge estado={obra.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ahora mismo: cronómetros en vivo por trabajador */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-forge-dark">Ahora mismo</h2>
            <div className="flex gap-3 text-xs font-bold">
              <span className="text-green-600">{activos} activos</span>
              <span className="text-amber-600">{descansando} descansando</span>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
              {jornadas.map(({ trabajador, jornada }) => (
                <FilaAhoraMismo key={trabajador.id} trabajador={trabajador} jornada={jornada} />
              ))}
              {jornadas.length === 0 && (
                <p className="text-sm text-slate-400">Sin trabajadores.</p>
              )}
            </div>
            <WorkerMap pins={mapPins} height={230} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Últimas incidencias */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-forge-dark">Últimas incidencias</h2>
            <Link to="/admin/incidencias" className="text-sm font-semibold text-forge-orange">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3">
            {incidencias.map((i) => (
              <div key={i.id} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
                  <IconAlert className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forge-dark">
                    {nombreObra(i.obraId)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {i.titulo} · {fechaHora(i.fecha)}
                  </p>
                </div>
                {i.estado === "nueva" && <Badge color="orange">NUEVA</Badge>}
              </div>
            ))}
            {incidencias.length === 0 && (
              <p className="text-sm text-slate-400">Sin incidencias.</p>
            )}
          </div>
        </section>

        {/* Materiales pendientes */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-forge-dark">Materiales pendientes</h2>
            <Link to="/admin/materiales" className="text-sm font-semibold text-forge-orange">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {materiales.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-forge-orange">
                  <IconBox className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forge-dark">{m.nombre}</p>
                  <p className="text-xs text-slate-400">{m.obra}</p>
                </div>
                <span className="text-sm font-bold text-forge-dark">
                  {m.cantidad} {m.unidad}
                </span>
              </div>
            ))}
            {materiales.length === 0 && <p className="text-sm text-slate-400">Nada pendiente.</p>}
          </div>
        </section>

        {/* Fichajes hoy */}
        <section className="card p-5">
          <h2 className="mb-4 font-bold text-forge-dark">Fichajes hoy</h2>
          <div className="flex items-center gap-5">
            <Donut
              size={120}
              segments={[
                { value: fichajesHoy.correctos, color: "#16A34A" },
                { value: fichajesHoy.pendientes, color: "#D97706" },
              ]}
              center={
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-forge-dark">{fichajesHoy.total}</p>
                  <p className="text-[10px] uppercase text-slate-400">Total</p>
                </div>
              }
            />
            <div className="space-y-2 text-sm">
              <Leyenda color="#16A34A" label="Correctos" value={`${fichajesHoy.correctos} (${pct(fichajesHoy.correctos)}%)`} />
              <Leyenda color="#D97706" label="Pendientes" value={`${fichajesHoy.pendientes} (${pct(fichajesHoy.pendientes)}%)`} />
              <Leyenda color="#94A3B8" label="Total" value={String(fichajesHoy.total)} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const ESTILO_ESTADO: Record<
  Jornada["estado"],
  { label: string; badge: "green" | "amber" | "violet" | "slate"; fondo: string }
> = {
  sin_fichar: { label: "Sin fichar", badge: "slate", fondo: "" },
  trabajando: { label: "Trabajando", badge: "green", fondo: "bg-green-50/60" },
  descansando: { label: "Descansando", badge: "amber", fondo: "bg-amber-50/60" },
  en_extra: { label: "Horas extra", badge: "violet", fondo: "bg-violet-50/60" },
  cerrado: { label: "Jornada cerrada", badge: "slate", fondo: "" },
};

function segundosDe(jornada: Jornada): number {
  switch (jornada.estado) {
    case "trabajando":
      return jornada.segundosOrdinarios;
    case "descansando":
      return jornada.segundosPausa;
    case "en_extra":
      return jornada.segundosExtra;
    default:
      return 0;
  }
}

function FilaAhoraMismo({ trabajador, jornada }: { trabajador: Usuario; jornada: Jornada }) {
  const info = ESTILO_ESTADO[jornada.estado];
  const conCronometro = ["trabajando", "descansando", "en_extra"].includes(jornada.estado);
  return (
    <div className={`flex items-center gap-2.5 rounded-xl p-2 ${info.fondo}`}>
      <Avatar nombre={trabajador.nombre} color={trabajador.color} size={30} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-forge-dark">{trabajador.nombre}</p>
        <p className="text-xs text-slate-400">
          {jornada.entrada ? `Entrada ${hora(jornada.entrada.timestamp)}` : "—"}
        </p>
      </div>
      <div className="text-right">
        <Badge color={info.badge}>{info.label}</Badge>
        {conCronometro && (
          <p className="mt-1 font-mono text-sm font-bold text-forge-dark">
            {formatDuracion(segundosDe(jornada))}
          </p>
        )}
      </div>
    </div>
  );
}

function Leyenda({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto font-semibold text-forge-dark">{value}</span>
    </div>
  );
}
