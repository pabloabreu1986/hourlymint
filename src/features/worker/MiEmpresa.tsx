import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { comunicadosApi, obrasApi, talentoApi, turnosApi } from "@/services";
import { notaMedia } from "@/services/talento";
import { tenantActual } from "@/lib/branding";
import { tenantTieneFuncion } from "@/lib/funciones";
import type {
  CategoriaDenuncia,
  Comunicado,
  Evaluacion,
  Meta,
  Obra,
  Turno,
} from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Badge, Cargando, EmptyState, Modal, ProgressBar, Spinner } from "@/components/ui";
import { diaCorto, fechaHora } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import {
  IconMegaphone,
  IconShield,
  IconStar,
  IconTarget,
  IconTurnos,
} from "@/components/icons";

const CATEGORIAS_DENUNCIA: { value: CategoriaDenuncia; label: string }[] = [
  { value: "seguridad", label: "Seguridad" },
  { value: "acoso", label: "Acoso" },
  { value: "fraude", label: "Fraude" },
  { value: "otro", label: "Otro" },
];

function sumarDias(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

type Tab = "comunicados" | "turnos" | "objetivos";

export default function MiEmpresa() {
  const { usuario } = useAuth();
  const funciones = tenantActual().funciones;

  const tabs = useMemo(() => {
    const t: { id: Tab; label: string }[] = [];
    if (tenantTieneFuncion(funciones, "comunicados"))
      t.push({ id: "comunicados", label: "Tablón" });
    if (tenantTieneFuncion(funciones, "turnos")) t.push({ id: "turnos", label: "Mi semana" });
    if (tenantTieneFuncion(funciones, "metas") || tenantTieneFuncion(funciones, "evaluaciones"))
      t.push({ id: "objetivos", label: "Objetivos" });
    return t;
  }, [funciones]);

  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? "comunicados");
  const [denunciaAbierta, setDenunciaAbierta] = useState(false);

  if (!usuario) return null;

  return (
    <div>
      <WorkerHeader
        title="Mi empresa"
        action={
          tenantTieneFuncion(funciones, "denuncias") ? (
            <button
              onClick={() => setDenunciaAbierta(true)}
              className="btn-ghost px-3 py-2 text-sm"
              title="Canal de denuncias"
            >
              <IconShield className="h-4 w-4" /> Canal ético
            </button>
          ) : undefined
        }
      />

      <div className="p-4">
        {tabs.length > 1 && (
          <div className="mb-4 flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  tab === t.id ? "bg-forge-dark text-white" : "bg-white text-slate-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === "comunicados" && <TabComunicados />}
        {tab === "turnos" && <TabTurnos trabajadorId={usuario.id} />}
        {tab === "objetivos" && <TabObjetivos trabajadorId={usuario.id} />}
      </div>

      <ModalDenuncia
        open={denunciaAbierta}
        onClose={() => setDenunciaAbierta(false)}
        trabajadorId={usuario.id}
      />
    </div>
  );
}

// ── Tablón de comunicados ──

function TabComunicados() {
  const [items, setItems] = useState<Comunicado[] | null>(null);
  useEffect(() => {
    comunicadosApi.listComunicados().then(setItems);
  }, []);

  if (!items) return <Cargando />;
  if (items.length === 0)
    return (
      <EmptyState
        icon={<IconMegaphone className="h-12 w-12" />}
        titulo="Sin comunicados"
        texto="Aquí verás los avisos de tu empresa."
      />
    );

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <div key={c.id} className="card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-forge-dark">{c.titulo}</p>
            {c.fijado && <Badge color="orange">FIJADO</Badge>}
          </div>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{c.cuerpo}</p>
          <p className="mt-2 text-xs text-slate-400">{fechaHora(c.fecha)}</p>
        </div>
      ))}
    </div>
  );
}

// ── Mi semana (turnos) ──

function TabTurnos({ trabajadorId }: { trabajadorId: string }) {
  const [turnos, setTurnos] = useState<Turno[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const hoy = hoyISO();
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i)), [hoy]);

  useEffect(() => {
    turnosApi.turnosDe(trabajadorId, dias[0], dias[6]).then(setTurnos);
    obrasApi.listObras().then(setObras);
  }, [trabajadorId, dias]);

  if (!turnos) return <Cargando />;

  const obraDe = (id: string | null) => obras.find((o) => o.id === id);

  return (
    <div className="space-y-2.5">
      {dias.map((d) => {
        const turno = turnos.find((t) => t.fecha === d);
        const obra = obraDe(turno?.obraId ?? null);
        return (
          <div
            key={d}
            className={`card flex items-center gap-3 p-3.5 ${d === hoy ? "border-2 border-forge-orange/30" : ""}`}
          >
            <div className="w-16 shrink-0 text-center">
              <p className={`text-sm font-bold ${d === hoy ? "text-forge-orange" : "text-forge-dark"}`}>
                {diaCorto(d)}
              </p>
              {d === hoy && <p className="text-[10px] font-semibold text-forge-orange">HOY</p>}
            </div>
            {turno ? (
              <>
                <span
                  className="h-9 w-1.5 shrink-0 rounded-full"
                  style={{ background: obra?.color ?? "#3B4756" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forge-dark">
                    {obra?.nombre ?? "Sin obra concreta"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {turno.horaInicio} – {turno.horaFin}
                    {turno.nota && ` · ${turno.nota}`}
                  </p>
                </div>
              </>
            ) : (
              <p className="flex-1 text-sm text-slate-300">Sin turno asignado</p>
            )}
          </div>
        );
      })}
      <p className="pt-1 text-center text-xs text-slate-400">
        <IconTurnos className="mr-1 inline h-3.5 w-3.5" />
        Turnos planificados por tu empresa para los próximos 7 días.
      </p>
    </div>
  );
}

// ── Objetivos: metas + evaluaciones ──

function TabObjetivos({ trabajadorId }: { trabajadorId: string }) {
  const funciones = tenantActual().funciones;
  const [metas, setMetas] = useState<Meta[] | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[] | null>(null);

  useEffect(() => {
    if (tenantTieneFuncion(funciones, "metas"))
      talentoApi.metasDe(trabajadorId).then(setMetas);
    else setMetas([]);
    if (tenantTieneFuncion(funciones, "evaluaciones"))
      talentoApi.evaluacionesDe(trabajadorId).then(setEvaluaciones);
    else setEvaluaciones([]);
  }, [trabajadorId, funciones]);

  if (!metas || !evaluaciones) return <Cargando />;
  if (metas.length === 0 && evaluaciones.length === 0)
    return (
      <EmptyState
        icon={<IconTarget className="h-12 w-12" />}
        titulo="Sin objetivos todavía"
        texto="Aquí verás tus metas y evaluaciones de desempeño."
      />
    );

  return (
    <div className="space-y-3">
      {metas.map((m) => (
        <div key={m.id} className="card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <IconTarget className="h-4 w-4 text-forge-orange" />
            <p className="font-bold text-forge-dark">{m.titulo}</p>
            <Badge color={m.trabajadorId ? "blue" : "orange"}>
              {m.trabajadorId ? "PERSONAL" : "EMPRESA"}
            </Badge>
          </div>
          {m.descripcion && <p className="mt-1 text-sm text-slate-500">{m.descripcion}</p>}
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={m.progreso} className="flex-1" />
            <span className="text-sm font-bold text-forge-dark">{m.progreso}%</span>
          </div>
        </div>
      ))}

      {evaluaciones.map((e) => (
        <div key={e.id} className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconStar className="h-4 w-4 text-forge-orange" />
              <p className="font-bold text-forge-dark">Evaluación · {e.periodo}</p>
            </div>
            <p className="text-xl font-extrabold text-forge-orange">
              {notaMedia(e).toFixed(1)}
              <span className="text-xs font-semibold text-slate-400">/5</span>
            </p>
          </div>
          {e.comentario && <p className="mt-1 text-sm text-slate-500">“{e.comentario}”</p>}
        </div>
      ))}
    </div>
  );
}

// ── Canal de denuncias ──

function ModalDenuncia({
  open,
  onClose,
  trabajadorId,
}: {
  open: boolean;
  onClose: () => void;
  trabajadorId: string;
}) {
  const [categoria, setCategoria] = useState<CategoriaDenuncia>("seguridad");
  const [descripcion, setDescripcion] = useState("");
  const [anonima, setAnonima] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  async function enviar() {
    if (!descripcion.trim()) return;
    setEnviando(true);
    try {
      await comunicadosApi.presentarDenuncia({
        categoria,
        descripcion: descripcion.trim(),
        anonima,
        trabajadorId: anonima ? null : trabajadorId,
      });
      setEnviada(true);
      setDescripcion("");
    } finally {
      setEnviando(false);
    }
  }

  function cerrar() {
    setEnviada(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={cerrar} title="Canal de denuncias">
      {enviada ? (
        <div className="grid place-items-center gap-3 py-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600">
            <IconShield className="h-7 w-7" />
          </span>
          <p className="font-bold text-forge-dark">Comunicación enviada</p>
          <p className="max-w-xs text-sm text-slate-400">
            Gracias. Se revisará de forma confidencial
            {anonima ? " y nadie sabrá que la has enviado tú." : "."}
          </p>
          <button onClick={cerrar} className="btn-dark mt-2 px-6 py-2.5">
            Cerrar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Comunica de forma confidencial cualquier situación de acoso, riesgo para la
            seguridad o irregularidad.
          </p>
          <div>
            <label className="label">Categoría</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {CATEGORIAS_DENUNCIA.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategoria(c.value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    categoria === c.value
                      ? "border-forge-orange bg-forge-orange/10 text-forge-orange"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="field mt-1.5"
              rows={4}
              placeholder="Cuenta qué ha pasado, dónde y cuándo"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={anonima}
              onChange={(e) => setAnonima(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--brand-orange))]"
            />
            <span className="text-sm text-slate-600">
              Enviar de forma <strong>anónima</strong> (no se guarda quién la envía)
            </span>
          </label>
          <button
            onClick={enviar}
            disabled={enviando || !descripcion.trim()}
            className="btn-primary w-full py-3"
          >
            {enviando ? <Spinner className="h-5 w-5" /> : "Enviar de forma confidencial"}
          </button>
        </div>
      )}
    </Modal>
  );
}
