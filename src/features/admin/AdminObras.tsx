import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { obrasApi, usuariosApi, adjuntosApi, dashboardApi } from "@/services";
import type { Adjunto, EstadoObra, Obra, Usuario, Fichaje } from "@/lib/types";
import { errorDeTamano } from "@/lib/files";
import { calcularJornada, formatHoras } from "@/lib/horas";
import { sb, isSupabaseEnabled } from "@/lib/supabase";
import {
  Avatar,
  Cargando,
  EstadoObraBadge,
  Modal,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconObras,
  IconMapPin,
  IconVideo,
  IconCamera,
  IconClock,
} from "@/components/icons";

const DIAS_SEMANA = [
  { valor: 1, letra: "L" },
  { valor: 2, letra: "M" },
  { valor: 3, letra: "X" },
  { valor: 4, letra: "J" },
  { valor: 5, letra: "V" },
  { valor: 6, letra: "S" },
  { valor: 7, letra: "D" },
];

export default function AdminObras() {
  const [obras, setObras] = useState<Obra[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editar, setEditar] = useState<Obra | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [borrar, setBorrar] = useState<Obra | null>(null);
  const [fichajesPorTrabajador, setFichajesPorTrabajador] = useState<Record<string, Fichaje[]>>({});
  const [ahora, setAhora] = useState(() => new Date());

  async function cargar() {
    const [os, us] = await Promise.all([obrasApi.listObras(), usuariosApi.listTrabajadores()]);
    setObras(os);
    setUsuarios(us);
  }
  async function cargarFichajes() {
    const data = await dashboardApi.getDashboard();
    const mapa: Record<string, Fichaje[]> = {};
    data.tiempoReal.forEach((t) => {
      mapa[t.trabajador.id] = t.fichajesHoy;
    });
    setFichajesPorTrabajador(mapa);
  }
  useEffect(() => {
    cargar();
    cargarFichajes();
  }, []);

  // Tiempo hoy en vivo: recalcula cada segundo.
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // El estado se propaga por Realtime, no por polling.
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    const canal = sb()
      .channel("obras-fichajes")
      .on("postgres_changes", { event: "*", schema: "public", table: "fichajes" }, cargarFichajes)
      .subscribe();
    return () => {
      sb().removeChannel(canal);
    };
  }, []);

  if (!obras) return <Cargando />;
  const nombreDe = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre ?? "Sin asignar";

  function tiempoHoyDeObra(o: Obra): number {
    const equipo = new Set(o.trabajadorIds);
    if (o.encargadoId) equipo.add(o.encargadoId);
    let segundos = 0;
    equipo.forEach((id) => {
      const jornada = calcularJornada(fichajesPorTrabajador[id] ?? [], ahora);
      segundos += jornada.segundosOrdinarios + jornada.segundosExtra;
    });
    return segundos;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">{obras.length} obras</p>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nueva obra
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {obras.map((o) => (
          <div key={o.id} className="card p-5">
            <div className="flex items-start justify-between">
              <span
                className="grid h-11 w-11 place-items-center rounded-xl text-white"
                style={{ background: o.color }}
              >
                <IconObras className="h-6 w-6" />
              </span>
              <EstadoObraBadge estado={o.estado} />
            </div>
            <h3 className="mt-3 font-bold text-forge-dark">{o.nombre}</h3>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <IconMapPin className="h-3.5 w-3.5" /> {o.direccion}
            </p>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-400">Avance</span>
                <span className="font-semibold text-forge-dark">{o.avance}%</span>
              </div>
              <ProgressBar value={o.avance} />
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <IconClock className="h-3.5 w-3.5 text-forge-orange" />
              <span>Tiempo hoy:</span>
              <span className="font-semibold text-forge-dark">
                {formatHoras(tiempoHoyDeObra(o))}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs">
                <p className="text-slate-400">Encargado</p>
                <p className="font-semibold text-forge-dark">{nombreDe(o.encargadoId)}</p>
              </div>
              <div className="flex -space-x-2">
                {o.trabajadorIds.slice(0, 4).map((id) => {
                  const u = usuarios.find((x) => x.id === id);
                  return u ? (
                    <span key={id} className="ring-2 ring-white rounded-full">
                      <Avatar nombre={u.nombre} color={u.color} size={26} />
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditar(o)} className="btn-ghost flex-1 px-3 py-2 text-sm">
                <IconEdit className="h-4 w-4" /> Editar
              </button>
              <button
                onClick={() => setBorrar(o)}
                className="btn border border-slate-200 bg-white px-3 py-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(nuevo || editar) && (
        <ObraForm
          obra={editar}
          trabajadores={usuarios}
          onClose={() => {
            setNuevo(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNuevo(false);
            setEditar(null);
            cargar();
          }}
        />
      )}

      <Modal open={!!borrar} onClose={() => setBorrar(null)} title="Eliminar obra">
        {borrar && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ¿Eliminar <b>{borrar.nombre}</b>? Sus partes quedarán sin obra asociada.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBorrar(null)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await obrasApi.eliminarObra(borrar.id);
                  setBorrar(null);
                  cargar();
                }}
                className="btn flex-1 bg-red-500 px-5 py-3 text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ObraForm({
  obra,
  trabajadores,
  onClose,
  onSaved,
}: {
  obra: Obra | null;
  trabajadores: Usuario[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(obra?.nombre ?? "");
  const [direccion, setDireccion] = useState(obra?.direccion ?? "");
  const [estado, setEstado] = useState<EstadoObra>(obra?.estado ?? "pendiente");
  const [avance, setAvance] = useState(obra?.avance ?? 0);
  const [encargadoId, setEncargadoId] = useState<string | null>(obra?.encargadoId ?? null);
  const [equipo, setEquipo] = useState<string[]>(obra?.trabajadorIds ?? []);
  const [diasLaborables, setDiasLaborables] = useState<number[]>(
    obra?.diasLaborables ?? [1, 2, 3, 4, 5]
  );
  const [horaEntrada, setHoraEntrada] = useState(obra?.horaEntrada ?? "09:00");
  const [horaSalida, setHoraSalida] = useState(obra?.horaSalida ?? "18:00");
  const [margen, setMargen] = useState(obra?.margenSalidaAutomaticaMin ?? 5);
  const [guardando, setGuardando] = useState(false);

  function toggle(id: string) {
    setEquipo((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  }
  function toggleDia(dia: number) {
    setDiasLaborables((d) => (d.includes(dia) ? d.filter((x) => x !== dia) : [...d, dia].sort()));
  }

  async function guardar() {
    if (!nombre.trim()) return;
    setGuardando(true);
    // El encargado siempre forma parte del equipo asignado.
    const trabajadorIds = encargadoId && !equipo.includes(encargadoId) ? [encargadoId, ...equipo] : equipo;
    try {
      const payload = {
        nombre,
        direccion,
        estado,
        avance,
        encargadoId,
        trabajadorIds,
        diasLaborables,
        horaEntrada,
        horaSalida,
        margenSalidaAutomaticaMin: margen,
      };
      if (obra) await obrasApi.actualizarObra(obra.id, payload);
      else await obrasApi.crearObra(payload);
      onSaved();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={obra ? "Editar obra" : "Nueva obra"}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre de la obra</label>
          <input className="field mt-1.5" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div>
          <label className="label">Dirección</label>
          <input className="field mt-1.5" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Estado</label>
            <select
              className="field mt-1.5"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoObra)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
          <div>
            <label className="label">Avance: {avance}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={avance}
              onChange={(e) => setAvance(Number(e.target.value))}
              className="mt-4 w-full accent-forge-orange"
            />
          </div>
        </div>

        <div>
          <label className="label">Cuadrante: días laborables</label>
          <div className="mt-1.5 flex gap-1.5">
            {DIAS_SEMANA.map((d) => (
              <button
                key={d.valor}
                type="button"
                onClick={() => toggleDia(d.valor)}
                className={`h-9 flex-1 rounded-lg text-xs font-bold transition ${
                  diasLaborables.includes(d.valor)
                    ? "bg-forge-orange text-white"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                {d.letra}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Hora entrada</label>
            <input
              type="time"
              className="field mt-1.5"
              value={horaEntrada}
              onChange={(e) => setHoraEntrada(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Hora salida</label>
            <input
              type="time"
              className="field mt-1.5"
              value={horaSalida}
              onChange={(e) => setHoraSalida(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Margen salida auto. (min)</label>
            <input
              type="number"
              min={0}
              max={120}
              className="field mt-1.5"
              value={margen}
              onChange={(e) => setMargen(Number(e.target.value))}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-slate-400">
          Si pasado ese margen tras la hora de salida alguien no ha fichado, el sistema le ficha la
          salida automáticamente a la hora de salida del cuadrante.
        </p>

        <div>
          <label className="label">Encargado del día</label>
          <select
            className="field mt-1.5"
            value={encargadoId ?? ""}
            onChange={(e) => setEncargadoId(e.target.value || null)}
          >
            <option value="">Sin asignar</option>
            {trabajadores.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            El encargado puede cambiar cada día según a quién asignes a la obra.
          </p>
        </div>

        <div>
          <label className="label">Equipo asignado</label>
          <div className="mt-1.5 grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {trabajadores.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-forge-orange"
                  checked={equipo.includes(u.id)}
                  onChange={() => toggle(u.id)}
                />
                <Avatar nombre={u.nombre} color={u.color} size={26} />
                <span className="text-sm text-forge-dark">{u.nombre}</span>
                {encargadoId === u.id && (
                  <span className="ml-auto text-xs font-semibold text-forge-orange">Encargado</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {obra ? (
          <AdjuntosObra obraId={obra.id} />
        ) : (
          <p className="text-xs text-slate-400">
            Guarda la obra primero para poder subir fotos o vídeo de referencia.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex-1">
            {guardando ? <Spinner className="h-5 w-5" /> : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** Fotos y vídeo de referencia de la obra, visibles luego para el equipo. */
function AdjuntosObra({ obraId }: { obraId: string }) {
  const { usuario } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Adjunto[] | null>(null);
  const [fase, setFase] = useState<"preparando" | "subiendo" | null>(null);

  async function cargar() {
    setItems(await adjuntosApi.listAdjuntosDeObra(obraId));
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const errores = Array.from(files).map(errorDeTamano).filter(Boolean);
    if (errores.length) {
      alert(errores.join("\n"));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    try {
      for (const file of Array.from(files)) {
        const tipo = file.type.startsWith("video/") ? "video" : "imagen";
        await adjuntosApi.subirAdjunto(file, { obraId, tipo, subidoPor: usuario?.id ?? null }, setFase);
      }
      await cargar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al subir el archivo");
    } finally {
      setFase(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function eliminar(a: Adjunto) {
    await adjuntosApi.eliminarAdjunto(a);
    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label">Fotos y vídeo de referencia</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!!fase}
          className="flex items-center gap-1.5 text-sm font-semibold text-forge-orange"
        >
          {fase && <Spinner className="h-4 w-4" />}
          {fase === "preparando" ? "Preparando…" : fase === "subiendo" ? "Subiendo…" : "+ Subir"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Lo verá el equipo asignado en el detalle de la obra (planos, fotos o vídeo explicando el
        trabajo).
      </p>

      {items === null ? (
        <div className="mt-2 py-4 text-center">
          <Spinner className="mx-auto h-5 w-5 text-slate-300" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">Todavía no hay nada subido.</p>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((a) => (
            <div key={a.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              {a.tipo === "video" ? (
                <video src={a.url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={a.url} alt="" className="h-full w-full object-cover" />
              )}
              <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/50 text-white">
                {a.tipo === "video" ? (
                  <IconVideo className="h-3 w-3" />
                ) : (
                  <IconCamera className="h-3 w-3" />
                )}
              </span>
              <button
                type="button"
                onClick={() => eliminar(a)}
                className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Eliminar"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
