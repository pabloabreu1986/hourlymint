import { useEffect, useMemo, useState } from "react";
import { ausenciasApi, fichajesApi, gastosApi, usuariosApi } from "@/services";
import { diasDeAusencia } from "@/services/ausencias";
import { calcularJornada, formatHoras } from "@/lib/horas";
import type { Ausencia, Usuario } from "@/lib/types";
import { Avatar, Cargando } from "@/components/ui";
import { IconDownload, IconReceipt } from "@/components/icons";

/** Resumen mensual de un trabajador para preparar la nómina. */
interface FilaNomina {
  trabajador: Usuario;
  diasTrabajados: number;
  segundosOrdinarios: number;
  segundosExtra: number;
  diasAusencia: number;
  gastosAprobados: number; // €
}

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

/** "YYYY-MM" del mes actual. */
function mesActual(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Primer y último día (YYYY-MM-DD) de un mes "YYYY-MM". */
function rangoDeMes(mes: string): { desde: string; hasta: string } {
  const [y, m] = mes.split("-").map(Number);
  const ultimo = new Date(y, m, 0).getDate();
  return { desde: `${mes}-01`, hasta: `${mes}-${String(ultimo).padStart(2, "0")}` };
}

/** Días de solape de una ausencia con el mes, ambos incluidos. */
function diasAusenciaEnMes(a: Ausencia, desde: string, hasta: string): number {
  const ini = a.fechaInicio > desde ? a.fechaInicio : desde;
  const fin = a.fechaFin < hasta ? a.fechaFin : hasta;
  if (fin < ini) return 0;
  return diasDeAusencia({ fechaInicio: ini, fechaFin: fin });
}

export default function AdminNomina() {
  const [mes, setMes] = useState(mesActual());
  const [filas, setFilas] = useState<FilaNomina[] | null>(null);

  useEffect(() => {
    let cancelado = false;
    setFilas(null);
    (async () => {
      const { desde, hasta } = rangoDeMes(mes);
      const [usuarios, ausencias, gastos] = await Promise.all([
        usuariosApi.listUsuarios(),
        ausenciasApi.listAusencias(),
        gastosApi.listGastos(),
      ]);
      const trabajadores = usuarios.filter((u) => u.rol === "trabajador" && u.activo);
      const resultado: FilaNomina[] = [];
      for (const t of trabajadores) {
        const fichajes = await fichajesApi.fichajesDeTrabajadorEnRango(t.id, desde, hasta);
        // Agrupa por día y suma las jornadas ya calculadas (misma lógica
        // que Horas/Dashboard: horas.ts es la única fuente de verdad).
        const porDia = new Map<string, typeof fichajes>();
        for (const f of fichajes) {
          const dia = f.timestamp.slice(0, 10);
          porDia.set(dia, [...(porDia.get(dia) ?? []), f]);
        }
        let segundosOrdinarios = 0;
        let segundosExtra = 0;
        let diasTrabajados = 0;
        for (const [, delDia] of porDia) {
          const j = calcularJornada(delDia);
          if (j.entrada) diasTrabajados++;
          segundosOrdinarios += j.segundosOrdinarios;
          segundosExtra += j.segundosExtra;
        }
        const diasAusencia = ausencias
          .filter((a) => a.trabajadorId === t.id && a.estado === "aprobada")
          .reduce((acc, a) => acc + diasAusenciaEnMes(a, desde, hasta), 0);
        const gastosAprobados = gastos
          .filter(
            (g) =>
              g.trabajadorId === t.id &&
              (g.estado === "aprobado" || g.estado === "pagado") &&
              g.fecha >= desde &&
              g.fecha <= hasta
          )
          .reduce((acc, g) => acc + g.importe, 0);
        resultado.push({
          trabajador: t,
          diasTrabajados,
          segundosOrdinarios,
          segundosExtra,
          diasAusencia,
          gastosAprobados,
        });
      }
      if (!cancelado) setFilas(resultado);
    })();
    return () => {
      cancelado = true;
    };
  }, [mes]);

  const totales = useMemo(() => {
    if (!filas) return null;
    return {
      ordinarias: filas.reduce((s, f) => s + f.segundosOrdinarios, 0),
      extra: filas.reduce((s, f) => s + f.segundosExtra, 0),
      gastos: filas.reduce((s, f) => s + f.gastosAprobados, 0),
    };
  }, [filas]);

  function exportarCSV() {
    if (!filas) return;
    const cab = [
      "Trabajador",
      "Puesto",
      "Dias trabajados",
      "Horas ordinarias",
      "Horas extra",
      "Dias de ausencia",
      "Gastos aprobados (EUR)",
    ];
    const cuerpo = filas.map((f) =>
      [
        f.trabajador.nombre,
        f.trabajador.puesto ?? "",
        f.diasTrabajados,
        (f.segundosOrdinarios / 3600).toFixed(2),
        (f.segundosExtra / 3600).toFixed(2),
        f.diasAusencia,
        f.gastosAprobados.toFixed(2),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";")
    );
    // BOM para que Excel abra el CSV con acentos correctos.
    const csv = "﻿" + [cab.join(";"), ...cuerpo].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomina_${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="month"
            className="field w-48"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
          <p className="hidden text-sm text-slate-400 sm:block">
            Horas, ausencias y gastos del mes, listos para la gestoría.
          </p>
        </div>
        <button
          onClick={exportarCSV}
          disabled={!filas || filas.length === 0}
          className="btn-primary px-4 py-2.5"
        >
          <IconDownload className="h-5 w-5" /> Exportar CSV
        </button>
      </div>

      {!filas ? (
        <Cargando label="Calculando el mes…" />
      ) : filas.length === 0 ? (
        <div className="card grid place-items-center gap-2 py-14 text-center">
          <IconReceipt className="h-12 w-12 text-slate-300" />
          <p className="font-semibold text-slate-600">Sin trabajadores activos</p>
        </div>
      ) : (
        <>
          {/* Totales del mes */}
          {totales && (
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Kpi titulo="Horas ordinarias" valor={formatHoras(totales.ordinarias)} />
              <Kpi titulo="Horas extra" valor={formatHoras(totales.extra)} acento />
              <Kpi titulo="Gastos a reembolsar" valor={eur(totales.gastos)} />
            </div>
          )}

          {/* Tabla escritorio */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Trabajador</th>
                  <th className="px-4 py-3 text-right">Días trabajados</th>
                  <th className="px-4 py-3 text-right">Horas ordinarias</th>
                  <th className="px-4 py-3 text-right">Horas extra</th>
                  <th className="px-4 py-3 text-right">Días ausencia</th>
                  <th className="px-4 py-3 text-right">Gastos aprobados</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.trabajador.id} className="border-b border-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar nombre={f.trabajador.nombre} color={f.trabajador.color} size={30} />
                        <div>
                          <p className="font-semibold text-forge-dark">{f.trabajador.nombre}</p>
                          <p className="text-xs text-slate-400">{f.trabajador.puesto}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-forge-dark">
                      {f.diasTrabajados}
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatHoras(f.segundosOrdinarios)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-violet-600">
                      {f.segundosExtra > 0 ? formatHoras(f.segundosExtra) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {f.diasAusencia > 0 ? f.diasAusencia : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-forge-dark">
                      {f.gastosAprobados > 0 ? eur(f.gastosAprobados) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas móvil */}
          <div className="space-y-3 md:hidden">
            {filas.map((f) => (
              <div key={f.trabajador.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar nombre={f.trabajador.nombre} color={f.trabajador.color} size={40} />
                  <div>
                    <p className="font-bold text-forge-dark">{f.trabajador.nombre}</p>
                    <p className="text-xs text-slate-400">{f.trabajador.puesto}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <Dato label="Días trabajados" valor={String(f.diasTrabajados)} />
                  <Dato label="H. ordinarias" valor={formatHoras(f.segundosOrdinarios)} />
                  <Dato label="H. extra" valor={f.segundosExtra > 0 ? formatHoras(f.segundosExtra) : "—"} />
                  <Dato label="Ausencias" valor={f.diasAusencia > 0 ? `${f.diasAusencia} días` : "—"} />
                  <Dato label="Gastos" valor={f.gastosAprobados > 0 ? eur(f.gastosAprobados) : "—"} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ titulo, valor, acento }: { titulo: string; valor: string; acento?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className={`mt-1 text-2xl font-extrabold ${acento ? "text-forge-orange" : "text-forge-dark"}`}>
        {valor}
      </p>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-forge-dark">{valor}</span>
    </div>
  );
}
