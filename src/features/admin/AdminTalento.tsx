import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { talentoApi, usuariosApi } from "@/services";
import { notaMedia } from "@/services/talento";
import type {
  Evaluacion,
  Meta,
  ProcesoOnboarding,
  PuntuacionesEvaluacion,
  Usuario,
} from "@/lib/types";
import { Avatar, Badge, Cargando, EmptyState, Modal, ProgressBar, Spinner } from "@/components/ui";
import { fechaCompleta } from "@/lib/format";
import {
  IconCheckSquare,
  IconPlus,
  IconStar,
  IconTarget,
  IconTrash,
} from "@/components/icons";

type Tab = "evaluaciones" | "metas" | "onboarding";

const TABS: { id: Tab; label: string; ruta: string }[] = [
  { id: "evaluaciones", label: "Evaluaciones", ruta: "/admin/evaluaciones" },
  { id: "metas", label: "Metas y objetivos", ruta: "/admin/metas" },
  { id: "onboarding", label: "Onboarding", ruta: "/admin/onboarding" },
];

const CRITERIOS: { key: keyof PuntuacionesEvaluacion; label: string }[] = [
  { key: "puntualidad", label: "Puntualidad" },
  { key: "calidad", label: "Calidad del trabajo" },
  { key: "seguridad", label: "Seguridad" },
  { key: "equipo", label: "Trabajo en equipo" },
];

export default function AdminTalento({ tab }: { tab: Tab }) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(t.ruta)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.id ? "bg-forge-dark text-white" : "bg-white text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "evaluaciones" && <Evaluaciones />}
      {tab === "metas" && <Metas />}
      {tab === "onboarding" && <Onboarding />}
    </div>
  );
}

// ── Evaluaciones de desempeño ──

function Evaluaciones() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Evaluacion[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [trabajadorId, setTrabajadorId] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [puntuaciones, setPuntuaciones] = useState<PuntuacionesEvaluacion>({
    puntualidad: 3,
    calidad: 3,
    seguridad: 3,
    equipo: 3,
  });
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setItems(await talentoApi.listEvaluaciones());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  if (!items) return <Cargando />;

  const trabajadores = usuarios.filter((u) => u.rol === "trabajador" && u.activo);
  const usuarioDe = (id: string | null) => usuarios.find((u) => u.id === id);

  async function crear() {
    if (!trabajadorId || !periodo.trim()) return;
    setGuardando(true);
    try {
      await talentoApi.crearEvaluacion({
        trabajadorId,
        evaluadorId: usuario?.id ?? null,
        periodo: periodo.trim(),
        puntuaciones,
        comentario: comentario.trim(),
      });
      setAbierto(false);
      setComentario("");
      setPeriodo("");
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setAbierto(true)} className="btn-primary px-4 py-2.5">
          <IconPlus className="h-5 w-5" /> Nueva evaluación
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconStar className="h-12 w-12" />}
          titulo="Sin evaluaciones"
          texto="Evalúa el desempeño de tu equipo por periodos."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((e) => {
            const t = usuarioDe(e.trabajadorId);
            const media = notaMedia(e);
            return (
              <div key={e.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar nombre={t?.nombre ?? "?"} color={t?.color} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-forge-dark">{t?.nombre ?? "—"}</p>
                    <p className="text-xs text-slate-400">
                      {e.periodo} · {fechaCompleta(e.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-forge-orange">{media.toFixed(1)}</p>
                    <Estrellas valor={media} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {CRITERIOS.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">{c.label}</span>
                      <span className="text-xs font-bold text-forge-dark">
                        {e.puntuaciones[c.key]}/5
                      </span>
                    </div>
                  ))}
                </div>
                {e.comentario && <p className="mt-3 text-sm text-slate-500">“{e.comentario}”</p>}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={abierto} onClose={() => setAbierto(false)} title="Nueva evaluación">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Trabajador</label>
              <select className="field mt-1.5" value={trabajadorId} onChange={(e) => setTrabajadorId(e.target.value)}>
                <option value="">Elegir…</option>
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Periodo</label>
              <input
                className="field mt-1.5"
                placeholder="p.ej. 3er trimestre 2026"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              />
            </div>
          </div>
          {CRITERIOS.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between">
                <label className="label">{c.label}</label>
                <span className="text-sm font-bold text-forge-orange">
                  {puntuaciones[c.key]}/5
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={puntuaciones[c.key]}
                onChange={(e) =>
                  setPuntuaciones((p) => ({ ...p, [c.key]: Number(e.target.value) }))
                }
                className="mt-1 w-full accent-[rgb(var(--brand-orange))]"
              />
            </div>
          ))}
          <div>
            <label className="label">Comentario</label>
            <textarea
              className="field mt-1.5"
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>
          <button
            onClick={crear}
            disabled={guardando || !trabajadorId || !periodo.trim()}
            className="btn-primary w-full py-3"
          >
            {guardando ? <Spinner className="h-5 w-5" /> : "Guardar evaluación"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <div className="flex gap-0.5 text-forge-orange">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          className="h-3.5 w-3.5"
          fill={i <= Math.round(valor) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

// ── Metas y objetivos ──

function Metas() {
  const [items, setItems] = useState<Meta[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [trabajadorId, setTrabajadorId] = useState("");
  const [fechaObjetivo, setFechaObjetivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setItems(await talentoApi.listMetas());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  if (!items) return <Cargando />;

  const trabajadores = usuarios.filter((u) => u.rol === "trabajador" && u.activo);
  const usuarioDe = (id: string | null) => usuarios.find((u) => u.id === id);

  async function crear() {
    if (!titulo.trim() || !fechaObjetivo) return;
    setGuardando(true);
    try {
      await talentoApi.crearMeta({
        trabajadorId: trabajadorId || null,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        progreso: 0,
        fechaObjetivo,
      });
      setAbierto(false);
      setTitulo("");
      setDescripcion("");
      setTrabajadorId("");
      setFechaObjetivo("");
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function actualizarProgreso(id: string, progreso: number) {
    await talentoApi.actualizarMeta(id, { progreso });
    cargar();
  }

  async function eliminar(m: Meta) {
    if (!window.confirm(`¿Eliminar la meta "${m.titulo}"?`)) return;
    await talentoApi.eliminarMeta(m.id);
    cargar();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setAbierto(true)} className="btn-primary px-4 py-2.5">
          <IconPlus className="h-5 w-5" /> Nueva meta
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconTarget className="h-12 w-12" />}
          titulo="Sin metas"
          texto="Define objetivos de empresa o individuales y sigue su avance."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((m) => {
            const t = usuarioDe(m.trabajadorId);
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-forge-dark">{m.titulo}</p>
                      <Badge color={m.trabajadorId ? "blue" : "orange"}>
                        {m.trabajadorId ? t?.nombre.toUpperCase() ?? "—" : "EMPRESA"}
                      </Badge>
                    </div>
                    {m.descripcion && <p className="mt-1 text-sm text-slate-500">{m.descripcion}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      Objetivo: {fechaCompleta(m.fechaObjetivo)}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminar(m)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={m.progreso} className="flex-1" />
                  <span className="w-10 text-right text-sm font-bold text-forge-dark">
                    {m.progreso}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={m.progreso}
                  onChange={(e) => actualizarProgreso(m.id, Number(e.target.value))}
                  className="mt-2 w-full accent-[rgb(var(--brand-orange))]"
                />
              </div>
            );
          })}
        </div>
      )}

      <Modal open={abierto} onClose={() => setAbierto(false)} title="Nueva meta">
        <div className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input className="field mt-1.5" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="field mt-1.5"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Asignada a</label>
              <select className="field mt-1.5" value={trabajadorId} onChange={(e) => setTrabajadorId(e.target.value)}>
                <option value="">Empresa (todos)</option>
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fecha objetivo</label>
              <input
                type="date"
                className="field mt-1.5"
                value={fechaObjetivo}
                onChange={(e) => setFechaObjetivo(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={crear}
            disabled={guardando || !titulo.trim() || !fechaObjetivo}
            className="btn-primary w-full py-3"
          >
            {guardando ? <Spinner className="h-5 w-5" /> : "Crear meta"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ── Onboarding / offboarding ──

function Onboarding() {
  const [items, setItems] = useState<ProcesoOnboarding[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [usuarioId, setUsuarioId] = useState("");
  const [tipo, setTipo] = useState<"alta" | "baja">("alta");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setItems(await talentoApi.listOnboardings());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  if (!items) return <Cargando />;

  const trabajadores = usuarios.filter((u) => u.rol === "trabajador");
  const usuarioDe = (id: string) => usuarios.find((u) => u.id === id);

  async function crear() {
    if (!usuarioId) return;
    setGuardando(true);
    try {
      await talentoApi.crearOnboarding(usuarioId, tipo);
      setAbierto(false);
      setUsuarioId("");
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function marcar(procesoId: string, tareaId: string, hecha: boolean) {
    await talentoApi.marcarTareaOnboarding(procesoId, tareaId, hecha);
    cargar();
  }

  async function eliminar(p: ProcesoOnboarding) {
    const nombre = usuarioDe(p.usuarioId)?.nombre ?? "";
    if (!window.confirm(`¿Eliminar el proceso de ${nombre}?`)) return;
    await talentoApi.eliminarOnboarding(p.id);
    cargar();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setAbierto(true)} className="btn-primary px-4 py-2.5">
          <IconPlus className="h-5 w-5" /> Nuevo proceso
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconCheckSquare className="h-12 w-12" />}
          titulo="Sin procesos abiertos"
          texto="Crea un checklist de alta (acogida) o de baja (salida) para un empleado."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((p) => {
            const t = usuarioDe(p.usuarioId);
            const hechas = p.tareas.filter((x) => x.hecha).length;
            const pct = p.tareas.length ? Math.round((hechas / p.tareas.length) * 100) : 0;
            return (
              <div key={p.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar nombre={t?.nombre ?? "?"} color={t?.color} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-forge-dark">{t?.nombre ?? "—"}</p>
                      <Badge color={p.tipo === "alta" ? "green" : "amber"}>
                        {p.tipo === "alta" ? "ALTA" : "BAJA"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {hechas}/{p.tareas.length} tareas · desde {fechaCompleta(p.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminar(p)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
                <ProgressBar value={pct} className="mt-3" />
                <div className="mt-3 space-y-2">
                  {p.tareas.map((tarea) => (
                    <label key={tarea.id} className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={tarea.hecha}
                        onChange={(e) => marcar(p.id, tarea.id, e.target.checked)}
                        className="h-4 w-4 accent-[rgb(var(--brand-orange))]"
                      />
                      <span
                        className={`text-sm ${
                          tarea.hecha ? "text-slate-300 line-through" : "text-slate-600"
                        }`}
                      >
                        {tarea.texto}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={abierto} onClose={() => setAbierto(false)} title="Nuevo proceso">
        <div className="space-y-4">
          <div>
            <label className="label">Empleado</label>
            <select className="field mt-1.5" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
              <option value="">Elegir…</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo de proceso</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["alta", "baja"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    tipo === t
                      ? "border-forge-orange bg-forge-orange/10 text-forge-orange"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {t === "alta" ? "Alta (acogida)" : "Baja (salida)"}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Se creará el checklist estándar de {tipo === "alta" ? "acogida" : "salida"}; podrás
            marcar las tareas según se completen.
          </p>
          <button onClick={crear} disabled={guardando || !usuarioId} className="btn-primary w-full py-3">
            {guardando ? <Spinner className="h-5 w-5" /> : "Crear proceso"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
