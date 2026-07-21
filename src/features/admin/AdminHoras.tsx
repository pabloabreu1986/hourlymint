import { useEffect, useState } from "react";
import { usuariosApi, fichajesApi } from "@/services";
import type { Usuario, Fichaje } from "@/lib/types";
import { calcularJornada, formatHoras } from "@/lib/horas";
import { diaCorto, hora } from "@/lib/format";
import { Avatar, Cargando } from "@/components/ui";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

function inicioSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dow = d.getDay() === 0 ? 7 : d.getDay(); // 1=lunes..7=domingo
  d.setDate(d.getDate() - (dow - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Suma de segundos ordinarios/pausa/extra a partir de los fichajes de varios días. */
function totalesPorDias(fichajes: Fichaje[], dias: string[]) {
  return dias.reduce(
    (acc, iso) => {
      const delDia = fichajes.filter((f) => f.timestamp.slice(0, 10) === iso);
      const j = calcularJornada(delDia);
      return {
        ordinarias: acc.ordinarias + j.segundosOrdinarios,
        pausa: acc.pausa + j.segundosPausa,
        extra: acc.extra + j.segundosExtra,
      };
    },
    { ordinarias: 0, pausa: 0, extra: 0 }
  );
}

export default function AdminHoras() {
  const [trabajadores, setTrabajadores] = useState<Usuario[]>([]);
  const [trabajadorId, setTrabajadorId] = useState<string>("");
  const [refSemana, setRefSemana] = useState(() => new Date());
  const [fichajesSemana, setFichajesSemana] = useState<Fichaje[] | null>(null);
  const [fichajesMes, setFichajesMes] = useState<Fichaje[]>([]);

  useEffect(() => {
    usuariosApi.listTrabajadores().then((ts) => {
      setTrabajadores(ts);
      setTrabajadorId((actual) => actual || ts[0]?.id || "");
    });
  }, []);

  const inicio = inicioSemana(refSemana);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return isoDate(d);
  });
  const desde = dias[0];
  const hasta = dias[6];

  const inicioMes = new Date(refSemana.getFullYear(), refSemana.getMonth(), 1);
  const finMes = new Date(refSemana.getFullYear(), refSemana.getMonth() + 1, 0);
  const desdeMes = isoDate(inicioMes);
  const hastaMes = isoDate(finMes);

  useEffect(() => {
    if (!trabajadorId) return;
    setFichajesSemana(null);
    fichajesApi.fichajesDeTrabajadorEnRango(trabajadorId, desde, hasta).then(setFichajesSemana);
    fichajesApi.fichajesDeTrabajadorEnRango(trabajadorId, desdeMes, hastaMes).then(setFichajesMes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabajadorId, desde, hasta]);

  if (!trabajadores.length) return <Cargando />;

  const trabajador = trabajadores.find((t) => t.id === trabajadorId) ?? null;
  const porDia = dias.map((iso) => {
    const delDia = (fichajesSemana ?? []).filter((f) => f.timestamp.slice(0, 10) === iso);
    return { iso, jornada: calcularJornada(delDia) };
  });
  const totalSemana = totalesPorDias(fichajesSemana ?? [], dias);
  const diasMes = Array.from(new Set(fichajesMes.map((f) => f.timestamp.slice(0, 10))));
  const totalMes = totalesPorDias(fichajesMes, diasMes);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          className="field w-full sm:w-64"
          value={trabajadorId}
          onChange={(e) => setTrabajadorId(e.target.value)}
        >
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setRefSemana((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))}
            className="btn-ghost px-3 py-2"
            aria-label="Semana anterior"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-forge-dark">
            {diaCorto(desde)} – {diaCorto(hasta)}
          </span>
          <button
            onClick={() => setRefSemana((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))}
            className="btn-ghost px-3 py-2"
            aria-label="Semana siguiente"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {trabajador && (
        <div className="mb-5 flex items-center gap-3">
          <Avatar nombre={trabajador.nombre} color={trabajador.color} size={36} />
          <div>
            <p className="font-bold text-forge-dark">{trabajador.nombre}</p>
            <p className="text-xs text-slate-400">{trabajador.puesto}</p>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-semibold">Día</th>
              <th className="px-4 py-3 font-semibold">Entrada</th>
              <th className="px-4 py-3 font-semibold">Salida</th>
              <th className="px-4 py-3 font-semibold">Ordinarias</th>
              <th className="px-4 py-3 font-semibold">Descanso</th>
              <th className="px-4 py-3 font-semibold">Extra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fichajesSemana === null ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <Cargando />
                </td>
              </tr>
            ) : (
              porDia.map(({ iso, jornada }) => (
                <tr key={iso}>
                  <td className="px-4 py-3 font-semibold text-forge-dark">{diaCorto(iso)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {jornada.entrada ? hora(jornada.entrada.timestamp) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {jornada.salida ? (
                      <span>
                        {hora(jornada.salida.timestamp)}
                        {jornada.salidaAutomatica && (
                          <span className="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                            AUTOMÁTICA
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-forge-dark">
                    {formatHoras(jornada.segundosOrdinarios)}
                  </td>
                  <td className="px-4 py-3 text-amber-600">{formatHoras(jornada.segundosPausa)}</td>
                  <td className="px-4 py-3 text-violet-600">{formatHoras(jornada.segundosExtra)}</td>
                </tr>
              ))
            )}
          </tbody>
          {fichajesSemana !== null && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                <td className="px-4 py-3 text-forge-dark" colSpan={3}>
                  Total semana
                </td>
                <td className="px-4 py-3 text-forge-dark">{formatHoras(totalSemana.ordinarias)}</td>
                <td className="px-4 py-3 text-amber-700">{formatHoras(totalSemana.pausa)}</td>
                <td className="px-4 py-3 text-violet-700">{formatHoras(totalSemana.extra)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ordinarias del mes
          </p>
          <p className="mt-2 text-2xl font-extrabold text-forge-dark">
            {formatHoras(totalMes.ordinarias)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Descanso del mes
          </p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{formatHoras(totalMes.pausa)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Extra del mes
          </p>
          <p className="mt-2 text-2xl font-extrabold text-violet-600">
            {formatHoras(totalMes.extra)}
          </p>
        </div>
      </div>
    </div>
  );
}
