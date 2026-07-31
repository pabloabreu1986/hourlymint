import { useEffect, useMemo, useState } from "react";
import { obrasApi, turnosApi, usuariosApi } from "@/services";
import type { Obra, Turno, Usuario } from "@/lib/types";
import { Avatar, Cargando, Modal, Spinner } from "@/components/ui";
import { diaCorto } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { IconChevronLeft, IconChevronRight, IconTrash } from "@/components/icons";

/** YYYY-MM-DD del lunes de la semana que contiene `base` + offset semanas. */
function lunesDe(base: string, offsetSemanas = 0): string {
  const d = new Date(base + "T00:00:00");
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (dow - 1) + offsetSemanas * 7);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function sumarDias(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export default function AdminTurnos() {
  const [semana, setSemana] = useState(0); // offset de semanas desde hoy
  const [turnos, setTurnos] = useState<Turno[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  // Celda en edición: trabajador + fecha (+ turno existente si lo hay).
  const [editando, setEditando] = useState<{
    trabajador: Usuario;
    fecha: string;
    turno: Turno | null;
  } | null>(null);
  const [obraId, setObraId] = useState<string>("");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("18:00");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  const lunes = lunesDe(hoyISO(), semana);
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)), [lunes]);

  async function cargar() {
    setTurnos(await turnosApi.turnosEnRango(dias[0], dias[6]));
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semana]);
  useEffect(() => {
    usuariosApi.listUsuarios().then(setUsuarios);
    obrasApi.listObras().then(setObras);
  }, []);

  const trabajadores = usuarios.filter((u) => u.rol === "trabajador" && u.activo);
  const obraDe = (id: string | null) => obras.find((o) => o.id === id);

  function abrirCelda(trabajador: Usuario, fecha: string) {
    const turno = turnos?.find((t) => t.trabajadorId === trabajador.id && t.fecha === fecha) ?? null;
    setEditando({ trabajador, fecha, turno });
    setObraId(turno?.obraId ?? obras[0]?.id ?? "");
    setHoraInicio(turno?.horaInicio ?? "09:00");
    setHoraFin(turno?.horaFin ?? "18:00");
    setNota(turno?.nota ?? "");
  }

  async function guardarCelda() {
    if (!editando) return;
    setGuardando(true);
    try {
      await turnosApi.guardarTurno({
        trabajadorId: editando.trabajador.id,
        fecha: editando.fecha,
        obraId: obraId || null,
        horaInicio,
        horaFin,
        nota: nota.trim(),
      });
      setEditando(null);
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function borrarCelda() {
    if (!editando?.turno) return;
    setGuardando(true);
    try {
      await turnosApi.eliminarTurno(editando.turno.id);
      setEditando(null);
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  if (!turnos) return <Cargando />;

  return (
    <div>
      {/* Selector de semana */}
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => setSemana((s) => s - 1)} className="btn-ghost px-3 py-2">
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-bold text-forge-dark">
            {diaCorto(dias[0])} — {diaCorto(dias[6])}
          </p>
          {semana !== 0 && (
            <button
              onClick={() => setSemana(0)}
              className="text-xs font-semibold text-forge-orange hover:underline"
            >
              Volver a esta semana
            </button>
          )}
        </div>
        <button onClick={() => setSemana((s) => s + 1)} className="btn-ghost px-3 py-2">
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Planificador: tabla en escritorio, tarjetas por día en móvil */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Trabajador</th>
              {dias.map((d) => (
                <th key={d} className={`px-2 py-3 text-center ${d === hoyISO() ? "text-forge-orange" : ""}`}>
                  {diaCorto(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trabajadores.map((t) => (
              <tr key={t.id} className="border-b border-slate-50">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar nombre={t.nombre} color={t.color} size={30} />
                    <span className="font-semibold text-forge-dark">{t.nombre}</span>
                  </div>
                </td>
                {dias.map((d) => {
                  const turno = turnos.find((x) => x.trabajadorId === t.id && x.fecha === d);
                  const obra = obraDe(turno?.obraId ?? null);
                  return (
                    <td key={d} className="px-1.5 py-2 text-center">
                      <button
                        onClick={() => abrirCelda(t, d)}
                        className={`w-full rounded-lg px-1.5 py-2 text-xs font-semibold transition ${
                          turno
                            ? "text-white"
                            : "border border-dashed border-slate-200 text-slate-300 hover:border-forge-orange hover:text-forge-orange"
                        }`}
                        style={turno ? { background: obra?.color ?? "#3B4756" } : undefined}
                        title={turno ? `${obra?.nombre ?? "Sin obra"} · ${turno.horaInicio}–${turno.horaFin}` : "Asignar turno"}
                      >
                        {turno ? (
                          <>
                            <span className="block truncate">{obra?.nombre ?? "Sin obra"}</span>
                            <span className="block font-normal opacity-80">
                              {turno.horaInicio}–{turno.horaFin}
                            </span>
                          </>
                        ) : (
                          "+"
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: un bloque por día */}
      <div className="space-y-4 md:hidden">
        {dias.map((d) => {
          const delDia = turnos.filter((t) => t.fecha === d);
          return (
            <div key={d} className="card p-4">
              <p className={`mb-2 text-sm font-bold ${d === hoyISO() ? "text-forge-orange" : "text-forge-dark"}`}>
                {diaCorto(d)}
              </p>
              {delDia.length === 0 && <p className="text-sm text-slate-400">Sin turnos.</p>}
              <div className="space-y-2">
                {delDia.map((turno) => {
                  const t = trabajadores.find((x) => x.id === turno.trabajadorId);
                  const obra = obraDe(turno.obraId);
                  if (!t) return null;
                  return (
                    <button
                      key={turno.id}
                      onClick={() => abrirCelda(t, d)}
                      className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-2.5 text-left"
                    >
                      <Avatar nombre={t.nombre} color={t.color} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-forge-dark">{t.nombre}</p>
                        <p className="truncate text-xs text-slate-400">
                          {obra?.nombre ?? "Sin obra"} · {turno.horaInicio}–{turno.horaFin}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {trabajadores
                  .filter((t) => !delDia.some((x) => x.trabajadorId === t.id))
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => abrirCelda(t, d)}
                      className="rounded-full border border-dashed border-slate-200 px-2.5 py-1 text-xs text-slate-400"
                    >
                      + {t.nombre.split(" ")[0]}
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title={editando ? `${editando.trabajador.nombre} · ${diaCorto(editando.fecha)}` : ""}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Obra</label>
            <select className="field mt-1.5" value={obraId} onChange={(e) => setObraId(e.target.value)}>
              <option value="">Sin obra concreta</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Entrada</label>
              <input type="time" className="field mt-1.5" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div>
              <label className="label">Salida</label>
              <input type="time" className="field mt-1.5" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Nota (opcional)</label>
            <input
              className="field mt-1.5"
              placeholder="p.ej. Recoger material en almacén"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {editando?.turno && (
              <button
                onClick={borrarCelda}
                disabled={guardando}
                className="btn border border-red-200 bg-white px-4 text-red-600 hover:bg-red-50"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            )}
            <button onClick={guardarCelda} disabled={guardando} className="btn-primary flex-1 py-3">
              {guardando ? <Spinner className="h-5 w-5" /> : "Guardar turno"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
