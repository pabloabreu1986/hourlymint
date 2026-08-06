// Editor en vivo (WYSIWYG) del dosier corporativo. Panel izquierdo =
// estructura de páginas (añadir/insertar/reordenar/duplicar/eliminar con
// renumeración automática) + ajustes globales. Centro = las páginas reales
// escaladas, clicables. Panel derecho = inspector del elemento seleccionado.
// Todo se refleja en tiempo real; al guardar se persiste vía services/.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tenantApi } from "@/services";
import { fijarTenant, tenantActual } from "@/lib/branding";
import { nuevoDosier } from "@/lib/dosier-default";
import { fileToThumbDataURL } from "@/lib/image";
import type {
  Alineacion,
  BloqueDosier,
  Dosier,
  EstiloDosier,
  ItemDosier,
  PosicionImagen,
  TipoBloqueDosier,
} from "@/lib/types";
import { Cargando, Spinner } from "@/components/ui";
import { IconCheck, IconEye, IconPlus, IconTrash, IconX, IconChevronUp, IconChevronDown } from "@/components/icons";
import { PaginaDosier, posDe } from "@/features/dosier/DosierPagina";
import { ICONOS, resolverIcono } from "@/features/dosier/dosier-iconos";

// A4 apaisado en px (96dpi): 297mm × 210mm.
const PW = 1122.5;
const PH = 793.7;

const TIPO_LABEL: Record<TipoBloqueDosier, string> = {
  "texto-imagen": "Texto + foto",
  "lista-imagen": "Lista grande + foto",
  pasos: "Pasos",
  iconos: "Rejilla de iconos",
  servicios: "Lista con iconos",
  logos: "Logos / marcas",
  "lista-detalle": "Lista en columnas",
  "antes-despues": "Antes y después",
  garantias: "Garantías",
  testimonios: "Opiniones",
  pagos: "Forma de pago",
  faq: "Preguntas frecuentes",
};

const TIPOS: TipoBloqueDosier[] = [
  "texto-imagen", "lista-imagen", "pasos", "iconos", "servicios", "logos",
  "lista-detalle", "antes-despues", "garantias", "testimonios", "pagos", "faq",
];

type CamposItem = { titulo?: boolean; texto?: boolean; valor?: boolean; imagen?: boolean; icono?: boolean };
const CAMPOS_ITEM: Record<TipoBloqueDosier, CamposItem> = {
  "texto-imagen": {},
  "lista-imagen": { titulo: true, texto: true },
  pasos: { titulo: true },
  iconos: { titulo: true, icono: true },
  servicios: { titulo: true, texto: true, icono: true },
  logos: { titulo: true, imagen: true },
  "lista-detalle": { titulo: true, texto: true, icono: true },
  "antes-despues": { titulo: true, imagen: true },
  garantias: { titulo: true, texto: true, icono: true },
  testimonios: { titulo: true, texto: true, valor: true },
  pagos: { titulo: true, texto: true, valor: true },
  faq: { titulo: true, texto: true },
};
const SIN_ITEMS: TipoBloqueDosier[] = ["texto-imagen"];
const USA_FOTO: TipoBloqueDosier[] = [
  "texto-imagen", "lista-imagen", "pasos", "servicios", "lista-detalle", "garantias",
];

function labelsItem(tipo: TipoBloqueDosier) {
  switch (tipo) {
    case "lista-imagen":
      return { titulo: "Texto (grande)", texto: "Detalle (opcional)", valor: "" };
    case "testimonios":
      return { titulo: "Autor (opcional)", texto: "Opinión", valor: "Estrellas (1–5)" };
    case "pagos":
      return { titulo: "Concepto", texto: "Detalle", valor: "Porcentaje (60%)" };
    case "faq":
      return { titulo: "Pregunta", texto: "Respuesta", valor: "" };
    case "antes-despues":
      return { titulo: "Etiqueta", texto: "", valor: "" };
    default:
      return { titulo: "Título", texto: "Descripción", valor: "" };
  }
}

function rid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

function nuevoBloque(tipo: TipoBloqueDosier): BloqueDosier {
  const items: ItemDosier[] =
    tipo === "antes-despues"
      ? [{ id: rid(), titulo: "Antes" }, { id: rid(), titulo: "Después" }]
      : SIN_ITEMS.includes(tipo)
        ? []
        : [{ id: rid(), titulo: "Elemento 1" }, { id: rid(), titulo: "Elemento 2" }, { id: rid(), titulo: "Elemento 3" }];
  return { id: rid(), tipo, activo: true, eyebrow: "", titulo: TIPO_LABEL[tipo], subtitulo: "", imagen: null, items };
}

// ─── Controles reutilizables ─────────────────────────────────

function SubirImagen({
  src,
  onChange,
  alto = "h-24",
}: {
  src?: string | null;
  onChange: (v: string | null) => void;
  alto?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  async function elegir(file?: File) {
    if (!file) return;
    setSubiendo(true);
    try {
      onChange(await fileToThumbDataURL(file, 1000, 0.75));
    } finally {
      setSubiendo(false);
    }
  }
  return (
    <div className={`relative ${alto} w-full overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50`}>
      {src ? (
        <>
          <img src={src} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="grid h-full w-full place-items-center text-xs font-semibold text-slate-400 hover:bg-slate-100"
        >
          {subiendo ? <Spinner className="h-4 w-4" /> : "+ Imagen"}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => elegir(e.target.files?.[0])} />
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-forge-dark outline-none focus:border-forge-orange";

/** Color con opción de "por defecto" (marca). */
function CampoColor({ label, value, onChange }: { label: string; value?: string; onChange: (v?: string) => void }) {
  return (
    <Campo label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#BE6B39"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white"
        />
        <input className={inputCls} value={value || ""} placeholder="marca" onChange={(e) => onChange(e.target.value || undefined)} />
        {value && (
          <button onClick={() => onChange(undefined)} className="text-xs text-slate-400 hover:text-forge-dark" title="Restablecer">
            <IconX className="h-4 w-4" />
          </button>
        )}
      </div>
    </Campo>
  );
}

/** Slider numérico. */
function CampoRango({
  label, value, min, max, step = 1, onChange, sufijo = "",
}: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; sufijo?: string;
}) {
  return (
    <Campo label={`${label}: ${value}${sufijo}`}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-forge-orange" />
    </Campo>
  );
}

/** Selector de icono (lucide) con buscador. */
function SelectorIcono({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const Actual = resolverIcono(value);
  const filtrados = q ? ICONOS.filter((i) => i.nombre.toLowerCase().includes(q.toLowerCase())) : ICONOS;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((x) => !x)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:border-forge-orange"
      >
        <Actual size={18} strokeWidth={1.5} className="text-forge-dark" />
        <span className="text-xs text-slate-500">{value || "icono"}</span>
      </button>
      {abierto && (
        <div className="absolute z-30 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <input autoFocus className={`${inputCls} mb-2`} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto">
            {filtrados.map((i) => {
              const Ico = i.Comp;
              return (
                <button
                  key={i.nombre}
                  type="button"
                  title={i.nombre}
                  onClick={() => { onChange(i.nombre); setAbierto(false); }}
                  className={`grid h-9 place-items-center rounded-lg hover:bg-slate-100 ${value === i.nombre ? "bg-forge-orange/10 text-forge-orange" : "text-forge-dark"}`}
                >
                  <Ico size={18} strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Botones segmentados. */
function Segmentado<T extends string>({ value, opciones, onChange }: { value: T; opciones: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {opciones.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${value === o.v ? "bg-white text-forge-dark shadow-sm" : "text-slate-500 hover:text-forge-dark"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Editor principal ────────────────────────────────────────

type Seleccion = "global" | "portada" | "contraportada" | { blockId: string; itemId?: string };

export default function AdminDosier() {
  const navigate = useNavigate();
  const tenant = tenantActual();
  const [dosier, setDosier] = useState<Dosier | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [sel, setSel] = useState<Seleccion>("portada");
  const [escala, setEscala] = useState(0.5);
  const [addAbierto, setAddAbierto] = useState<number | null>(null); // índice donde insertar
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const dosierRef = useRef<Dosier | null>(null);
  const dragIdx = useRef<number | null>(null);
  const [hist, setHist] = useState<{ stack: Dosier[]; i: number }>({ stack: [], i: -1 });

  useEffect(() => {
    tenantApi.getTenant().then((t) => {
      const d = t.dosier ?? null;
      setDosier(d);
      dosierRef.current = d;
      setHist(d ? { stack: [d], i: 0 } : { stack: [], i: -1 });
      setCargando(false);
    });
  }, []);

  // Historial para deshacer/rehacer.
  function reiniciarHist(d: Dosier | null) {
    dosierRef.current = d;
    setHist(d ? { stack: [d], i: 0 } : { stack: [], i: -1 });
  }
  function aplicar(n: Dosier) {
    setDosier(n);
    dosierRef.current = n;
    setHist((h) => {
      const stack = h.stack.slice(0, h.i + 1);
      stack.push(n);
      const t = stack.length > 120 ? stack.slice(stack.length - 120) : stack;
      return { stack: t, i: t.length - 1 };
    });
    setGuardado(false);
  }
  function setD(mut: (d: Dosier) => Dosier) {
    const cur = dosierRef.current;
    if (!cur) return;
    aplicar(mut(cur));
  }
  function undo() {
    if (hist.i <= 0) return;
    const i = hist.i - 1;
    const n = hist.stack[i];
    setHist({ ...hist, i });
    setDosier(n);
    dosierRef.current = n;
    setGuardado(false);
  }
  function redo() {
    if (hist.i >= hist.stack.length - 1) return;
    const i = hist.i + 1;
    const n = hist.stack[i];
    setHist({ ...hist, i });
    setDosier(n);
    dosierRef.current = n;
    setGuardado(false);
  }

  // Atajos Ctrl/Cmd+Z (deshacer) y Ctrl/Cmd+Shift+Z (rehacer), salvo en campos.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function selKey(s: Seleccion): string {
    return typeof s === "string" ? s : s.blockId;
  }
  function seleccionar(s: Seleccion) {
    setSel(s);
    const k = selKey(s);
    refs.current[k]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Operaciones de bloque
  const setBloque = (id: string, patch: Partial<BloqueDosier>) =>
    setD((d) => ({ ...d, bloques: d.bloques.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const moverBloque = (id: string, dir: -1 | 1) =>
    setD((d) => {
      const i = d.bloques.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.bloques.length) return d;
      const bloques = [...d.bloques];
      [bloques[i], bloques[j]] = [bloques[j], bloques[i]];
      return { ...d, bloques };
    });
  const moverBloqueA = (from: number, to: number) =>
    setD((d) => {
      if (from === to || from < 0 || to < 0) return d;
      const bloques = [...d.bloques];
      const [x] = bloques.splice(from, 1);
      bloques.splice(to, 0, x);
      return { ...d, bloques };
    });
  const insertarBloque = (index: number, tipo: TipoBloqueDosier) =>
    setD((d) => {
      const nb = nuevoBloque(tipo);
      const bloques = [...d.bloques];
      bloques.splice(index, 0, nb);
      setTimeout(() => seleccionar({ blockId: nb.id }), 0);
      return { ...d, bloques };
    });
  const duplicarBloque = (id: string) =>
    setD((d) => {
      const i = d.bloques.findIndex((b) => b.id === id);
      if (i < 0) return d;
      const copia: BloqueDosier = { ...d.bloques[i], id: rid(), items: d.bloques[i].items.map((it) => ({ ...it, id: rid() })) };
      const bloques = [...d.bloques];
      bloques.splice(i + 1, 0, copia);
      return { ...d, bloques };
    });
  const borrarBloque = (id: string) =>
    setD((d) => ({ ...d, bloques: d.bloques.filter((b) => b.id !== id) }));
  const setItem = (bid: string, iid: string, patch: Partial<ItemDosier>) =>
    setD((d) => ({ ...d, bloques: d.bloques.map((b) => (b.id === bid ? { ...b, items: b.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) } : b)) }));
  const addItem = (bid: string) =>
    setD((d) => ({ ...d, bloques: d.bloques.map((b) => (b.id === bid ? { ...b, items: [...b.items, { id: rid() }] } : b)) }));
  const removeItem = (bid: string, iid: string) =>
    setD((d) => ({ ...d, bloques: d.bloques.map((b) => (b.id === bid ? { ...b, items: b.items.filter((it) => it.id !== iid) } : b)) }));
  const moverItem = (bid: string, iid: string, dir: -1 | 1) =>
    setD((d) => ({
      ...d,
      bloques: d.bloques.map((b) => {
        if (b.id !== bid) return b;
        const i = b.items.findIndex((it) => it.id === iid);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= b.items.length) return b;
        const items = [...b.items];
        [items[i], items[j]] = [items[j], items[i]];
        return { ...b, items };
      }),
    }));
  const setEstilo = (patch: Partial<EstiloDosier>) =>
    setD((d) => ({ ...d, estilo: { ...d.estilo, ...patch } }));
  const setMeta = (patch: Partial<Dosier>) => setD((d) => ({ ...d, ...patch }));
  const setContacto = (patch: Partial<Dosier["contacto"]>) =>
    setD((d) => ({ ...d, contacto: { ...d.contacto, ...patch } }));

  async function guardar() {
    if (!dosier) return;
    setGuardando(true);
    try {
      const t = await tenantApi.actualizarDosier(dosier);
      fijarTenant(t);
      setGuardado(true);
    } finally {
      setGuardando(false);
    }
  }

  async function crear() {
    const t = await tenantApi.getTenant();
    const nuevo = nuevoDosier(t);
    setDosier(nuevo);
    reiniciarHist(nuevo);
    setGuardado(false);
  }
  async function regenerar() {
    setRegenerando(true);
    try {
      const t = await tenantApi.getTenant();
      const nuevo = nuevoDosier(t);
      const act = await tenantApi.actualizarDosier(nuevo);
      fijarTenant(act);
      setDosier(nuevo);
      reiniciarHist(nuevo);
      setSel("portada");
      setGuardado(true);
    } finally {
      setRegenerando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (regenerando)
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Spinner className="h-6 w-6 text-forge-orange" /> Regenerando dosier…
        </div>
      </div>
    );

  if (!dosier) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-black text-forge-dark">Crea tu dosier corporativo</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Genera la plantilla y edítala en vivo: páginas, imágenes, iconos, colores y textos, con vista previa en tiempo real.
          </p>
          <button onClick={crear} className="btn-primary mx-auto mt-6 px-6 py-3">
            <IconPlus className="h-5 w-5" /> Crear dosier
          </button>
        </div>
      </div>
    );
  }

  // Numeración por posición entre bloques activos.
  let contador = 0;
  const numeros: Record<string, number> = {};
  dosier.bloques.forEach((b) => { if (b.activo) numeros[b.id] = ++contador; });

  const bloqueSel = typeof sel === "object" ? dosier.bloques.find((b) => b.id === sel.blockId) : undefined;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Barra superior */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-black text-forge-dark">Dosier — editor en vivo</h1>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-200">
            <button onClick={undo} disabled={hist.i <= 0} title="Deshacer (Ctrl+Z)" className="px-2.5 py-2 text-sm text-forge-dark hover:bg-slate-50 disabled:opacity-30">↶</button>
            <button onClick={redo} disabled={hist.i >= hist.stack.length - 1} title="Rehacer (Ctrl+Shift+Z)" className="border-l border-slate-200 px-2.5 py-2 text-sm text-forge-dark hover:bg-slate-50 disabled:opacity-30">↷</button>
          </div>
          <button onClick={regenerar} className="btn-ghost px-3 py-2 text-xs text-slate-500">Regenerar</button>
          <button onClick={async () => { await guardar(); navigate("/dosier"); }} className="btn-ghost gap-2 px-3 py-2 text-sm">
            <IconEye className="h-4 w-4" /> Previa / PDF
          </button>
          <button onClick={guardar} disabled={guardando} className="btn-primary px-4 py-2 text-sm">
            {guardando ? <Spinner className="h-4 w-4" /> : guardado ? <><IconCheck className="h-4 w-4" /> Guardado</> : "Guardar"}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        {/* Panel izquierdo: estructura */}
        <aside className="flex w-60 shrink-0 flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
          <button
            onClick={() => seleccionar("global")}
            className={`mb-1 rounded-lg px-3 py-2 text-left text-sm font-semibold ${sel === "global" ? "bg-forge-orange/10 text-forge-orange" : "hover:bg-slate-50"}`}
          >
            ⚙︎ Ajustes globales
          </button>
          <FilaPagina label="Portada" activa={sel === "portada"} onClick={() => seleccionar("portada")} />

          <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Páginas</p>
          {dosier.bloques.map((b, i) => (
            <FilaBloque
              key={b.id}
              b={b}
              num={numeros[b.id]}
              activa={typeof sel === "object" && sel.blockId === b.id}
              primero={i === 0}
              ultimo={i === dosier.bloques.length - 1}
              onSelect={() => seleccionar({ blockId: b.id })}
              onToggle={() => setBloque(b.id, { activo: !b.activo })}
              onSubir={() => moverBloque(b.id, -1)}
              onBajar={() => moverBloque(b.id, 1)}
              onInsertar={() => setAddAbierto(i + 1)}
              onDuplicar={() => duplicarBloque(b.id)}
              onBorrar={() => borrarBloque(b.id)}
              onDragStart={() => (dragIdx.current = i)}
              onDropAqui={() => { if (dragIdx.current !== null) moverBloqueA(dragIdx.current, i); dragIdx.current = null; }}
            />
          ))}

          <div className="relative mt-1">
            <button onClick={() => setAddAbierto(addAbierto === -1 ? null : -1)} className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 hover:border-forge-orange hover:text-forge-orange">
              <IconPlus className="mr-1 inline h-4 w-4" /> Añadir página
            </button>
            {addAbierto !== null && (
              <div className="absolute bottom-full left-0 z-30 mb-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {TIPOS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { insertarBloque(addAbierto === -1 ? dosier.bloques.length : addAbierto, t); setAddAbierto(null); }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {TIPO_LABEL[t]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <FilaPagina label="Contraportada" activa={sel === "contraportada"} onClick={() => seleccionar("contraportada")} className="mt-1" />

          <div className="mt-3 border-t border-slate-100 px-1 pt-3">
            <CampoRango label="Zoom" value={Math.round(escala * 100)} min={30} max={100} onChange={(v) => setEscala(v / 100)} sufijo="%" />
          </div>
        </aside>

        {/* Centro: lienzo */}
        <div className="min-w-0 flex-1 overflow-auto rounded-xl bg-slate-200 p-6">
          <div className="dosier-editable mx-auto flex flex-col items-center gap-5" style={{ width: PW * escala }}>
            <LienzoPagina id="portada" escala={escala} sel={sel === "portada"} onClick={() => seleccionar("portada")} refCb={(el) => (refs.current["portada"] = el)}>
              <PaginaDosier tenant={tenant} dosier={dosier} which="portada" />
            </LienzoPagina>
            {dosier.bloques.filter((b) => b.activo).map((b) => (
              <LienzoPagina
                key={b.id}
                id={b.id}
                escala={escala}
                sel={typeof sel === "object" && sel.blockId === b.id}
                onClick={(e) => {
                  const el = (e.target as HTMLElement).closest("[data-item-id]");
                  seleccionar({ blockId: b.id, itemId: el?.getAttribute("data-item-id") || undefined });
                }}
                refCb={(el) => (refs.current[b.id] = el)}
              >
                <PaginaDosier tenant={tenant} dosier={dosier} which={b} n={numeros[b.id]} />
              </LienzoPagina>
            ))}
            <LienzoPagina id="contraportada" escala={escala} sel={sel === "contraportada"} onClick={() => seleccionar("contraportada")} refCb={(el) => (refs.current["contraportada"] = el)}>
              <PaginaDosier tenant={tenant} dosier={dosier} which="contraportada" />
            </LienzoPagina>
          </div>
        </div>

        {/* Panel derecho: inspector */}
        <aside className="w-80 shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
          {sel === "global" && <InspectorGlobal estilo={dosier.estilo} setEstilo={setEstilo} />}
          {sel === "portada" && (
            <InspectorPortada dosier={dosier} setMeta={setMeta} />
          )}
          {sel === "contraportada" && (
            <InspectorContra dosier={dosier} setMeta={setMeta} setContacto={setContacto} />
          )}
          {bloqueSel && (
            <InspectorBloque
              b={bloqueSel}
              selItemId={typeof sel === "object" ? sel.itemId : undefined}
              setBloque={(p) => setBloque(bloqueSel.id, p)}
              setItem={(iid, p) => setItem(bloqueSel.id, iid, p)}
              addItem={() => addItem(bloqueSel.id)}
              removeItem={(iid) => removeItem(bloqueSel.id, iid)}
              moverItem={(iid, dir) => moverItem(bloqueSel.id, iid, dir)}
              onBorrar={() => { borrarBloque(bloqueSel.id); setSel("portada"); }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Filas del panel izquierdo ───────────────────────────────

function FilaPagina({ label, activa, onClick, className = "" }: { label: string; activa: boolean; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${activa ? "bg-forge-orange/10 text-forge-orange" : "hover:bg-slate-50"} ${className}`}>
      {label}
    </button>
  );
}

function FilaBloque({
  b, num, activa, primero, ultimo, onSelect, onToggle, onSubir, onBajar, onInsertar, onDuplicar, onBorrar, onDragStart, onDropAqui,
}: {
  b: BloqueDosier; num?: number; activa: boolean; primero: boolean; ultimo: boolean;
  onSelect: () => void; onToggle: () => void; onSubir: () => void; onBajar: () => void;
  onInsertar: () => void; onDuplicar: () => void; onBorrar: () => void;
  onDragStart: () => void; onDropAqui: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDropAqui(); }}
      className={`group flex items-center gap-1 rounded-lg pr-1 ${activa ? "bg-forge-orange/10" : "hover:bg-slate-50"} ${b.activo ? "" : "opacity-50"} ${dragOver ? "ring-2 ring-forge-orange/50" : ""}`}
    >
      <span title="Arrastra para reordenar" className="cursor-grab select-none pl-1 text-slate-300 active:cursor-grabbing">⋮⋮</span>
      <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left">
        <span className="w-5 shrink-0 text-xs font-bold text-forge-orange">{num ? String(num).padStart(2, "0") : "—"}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-forge-dark">{b.titulo || TIPO_LABEL[b.tipo]}</span>
      </button>
      <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
        <button onClick={onSubir} disabled={primero} title="Subir" className="p-0.5 text-slate-400 hover:text-forge-dark disabled:opacity-30"><IconChevronUp className="h-3.5 w-3.5" /></button>
        <button onClick={onBajar} disabled={ultimo} title="Bajar" className="p-0.5 text-slate-400 hover:text-forge-dark disabled:opacity-30"><IconChevronDown className="h-3.5 w-3.5" /></button>
        <button onClick={onInsertar} title="Insertar debajo" className="p-0.5 text-slate-400 hover:text-forge-dark"><IconPlus className="h-3.5 w-3.5" /></button>
        <button onClick={onDuplicar} title="Duplicar" className="px-1 text-[10px] font-bold text-slate-400 hover:text-forge-dark">⧉</button>
        <button onClick={onBorrar} title="Eliminar" className="p-0.5 text-slate-400 hover:text-red-500"><IconTrash className="h-3.5 w-3.5" /></button>
      </div>
      <button onClick={onToggle} title={b.activo ? "Ocultar" : "Mostrar"} className={`ml-0.5 h-4 w-7 shrink-0 rounded-full ${b.activo ? "bg-forge-orange" : "bg-slate-300"} relative`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${b.activo ? "left-[14px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Lienzo de página escalada ───────────────────────────────

function LienzoPagina({
  id, escala, sel, onClick, refCb, children,
}: {
  id: string; escala: number; sel: boolean; onClick: (e: React.MouseEvent) => void; refCb: (el: HTMLDivElement | null) => void; children: React.ReactNode;
}) {
  return (
    <div
      ref={refCb}
      data-id={id}
      onClick={onClick}
      className={`relative shrink-0 cursor-pointer overflow-hidden rounded shadow-lg ring-offset-2 ${sel ? "ring-2 ring-forge-orange" : "ring-1 ring-black/5"}`}
      style={{ width: PW * escala, height: PH * escala }}
    >
      <div style={{ width: PW, height: PH, transform: `scale(${escala})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Inspectores (panel derecho) ─────────────────────────────

const FUENTES = [{ v: "sans", label: "Sans" }, { v: "serif", label: "Serif" }, { v: "mono", label: "Mono" }];

function InspectorGlobal({ estilo, setEstilo }: { estilo?: EstiloDosier; setEstilo: (p: Partial<EstiloDosier>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-forge-dark">Ajustes globales</h3>
      <p className="text-xs text-slate-400">Afectan a todas las páginas (puedes ajustar iconos por ítem en cada página).</p>
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Número + título de página</p>
        <CampoColor label="Color del número" value={estilo?.numeroColor} onChange={(v) => setEstilo({ numeroColor: v })} />
        <CampoColor label="Color del título" value={estilo?.tituloColor} onChange={(v) => setEstilo({ tituloColor: v })} />
        <CampoRango label="Tamaño" value={estilo?.numeroSize ?? 50} min={24} max={80} onChange={(v) => setEstilo({ numeroSize: v })} sufijo="px" />
        <Campo label="Fuente">
          <Segmentado value={estilo?.numeroFuente ?? "sans"} opciones={FUENTES} onChange={(v) => setEstilo({ numeroFuente: v })} />
        </Campo>
      </div>
      <div className="space-y-3 border-t border-slate-100 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Iconos (por defecto)</p>
        <CampoColor label="Color" value={estilo?.iconoColor} onChange={(v) => setEstilo({ iconoColor: v })} />
        <CampoRango label="Tamaño" value={estilo?.iconoSize ?? 30} min={16} max={56} onChange={(v) => setEstilo({ iconoSize: v })} sufijo="px" />
      </div>
    </div>
  );
}

const ALINEACIONES = [
  { v: "izquierda" as Alineacion, label: "Izq." },
  { v: "centro" as Alineacion, label: "Centro" },
  { v: "derecha" as Alineacion, label: "Der." },
];

function InspectorPortada({ dosier, setMeta }: { dosier: Dosier; setMeta: (p: Partial<Dosier>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-forge-dark">Portada</h3>
      <Campo label="Título del dosier"><input className={inputCls} value={dosier.titulo} onChange={(e) => setMeta({ titulo: e.target.value })} /></Campo>
      <Campo label="Eslogan"><textarea className={inputCls} rows={3} value={dosier.eslogan} onChange={(e) => setMeta({ eslogan: e.target.value })} /></Campo>
      <Campo label="Alineación"><Segmentado value={dosier.portadaAlign ?? "izquierda"} opciones={ALINEACIONES} onChange={(v) => setMeta({ portadaAlign: v })} /></Campo>
      <Campo label="Imagen de fondo"><SubirImagen src={dosier.portada} onChange={(v) => setMeta({ portada: v })} alto="h-32" /></Campo>
    </div>
  );
}

function InspectorContra({ dosier, setMeta, setContacto }: { dosier: Dosier; setMeta: (p: Partial<Dosier>) => void; setContacto: (p: Partial<Dosier["contacto"]>) => void }) {
  const c = dosier.contacto ?? {};
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-forge-dark">Contraportada</h3>
      <Campo label="Alineación"><Segmentado value={dosier.contraAlign ?? "izquierda"} opciones={ALINEACIONES} onChange={(v) => setMeta({ contraAlign: v })} /></Campo>
      <Campo label="Teléfono"><input className={inputCls} value={c.telefono ?? ""} onChange={(e) => setContacto({ telefono: e.target.value })} /></Campo>
      <Campo label="Email"><input className={inputCls} value={c.email ?? ""} onChange={(e) => setContacto({ email: e.target.value })} /></Campo>
      <Campo label="Web"><input className={inputCls} value={c.web ?? ""} onChange={(e) => setContacto({ web: e.target.value })} /></Campo>
      <Campo label="Dirección"><input className={inputCls} value={c.direccion ?? ""} onChange={(e) => setContacto({ direccion: e.target.value })} /></Campo>
      <Campo label="Imagen diagonal"><SubirImagen src={dosier.contraportada} onChange={(v) => setMeta({ contraportada: v })} alto="h-32" /></Campo>
      <p className="text-xs text-slate-400">El QR apunta a tu subdominio automáticamente.</p>
    </div>
  );
}

const POSICIONES = [
  { v: "ninguna" as PosicionImagen, label: "Ninguna" },
  { v: "fondo" as PosicionImagen, label: "Fondo" },
  { v: "izquierda" as PosicionImagen, label: "Izq." },
  { v: "derecha" as PosicionImagen, label: "Der." },
  { v: "diagonal" as PosicionImagen, label: "Diag." },
];

const SOMBRAS_OPC = [
  { v: "ninguna", label: "No" },
  { v: "suave", label: "Suave" },
  { v: "fuerte", label: "Fuerte" },
  { v: "halo", label: "Halo" },
  { v: "contorno", label: "Contorno" },
];

function InspectorBloque({
  b, selItemId, setBloque, setItem, addItem, removeItem, moverItem, onBorrar,
}: {
  b: BloqueDosier;
  selItemId?: string;
  setBloque: (p: Partial<BloqueDosier>) => void;
  setItem: (iid: string, p: Partial<ItemDosier>) => void;
  addItem: () => void;
  removeItem: (iid: string) => void;
  moverItem: (iid: string, dir: -1 | 1) => void;
  onBorrar: () => void;
}) {
  const campos = CAMPOS_ITEM[b.tipo] ?? {};
  const labels = labelsItem(b.tipo);
  const pos = posDe(b);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (selItemId) itemRefs.current[selItemId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selItemId]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-forge-dark">{TIPO_LABEL[b.tipo]}</h3>
        <button onClick={onBorrar} className="text-slate-300 hover:text-red-500"><IconTrash className="h-4 w-4" /></button>
      </div>

      <Campo label="Título de la página"><input className={inputCls} value={b.titulo} onChange={(e) => setBloque({ titulo: e.target.value })} /></Campo>
      <Campo label="Subtítulo / texto de apoyo"><textarea className={inputCls} rows={b.tipo === "texto-imagen" ? 6 : 2} value={b.subtitulo} onChange={(e) => setBloque({ subtitulo: e.target.value })} /></Campo>

      <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3">
        <CampoColor label="Fondo de la página" value={b.bg} onChange={(v) => setBloque({ bg: v })} />
        <CampoColor label="Acento (número + iconos)" value={b.acento} onChange={(v) => setBloque({ acento: v })} />
        <Campo label="Alineación del texto"><Segmentado value={b.align ?? "izquierda"} opciones={ALINEACIONES} onChange={(v) => setBloque({ align: v })} /></Campo>
      </div>

      {USA_FOTO.includes(b.tipo) && (
        <div className="space-y-3 rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Imagen</p>
          <SubirImagen src={b.imagen} onChange={(v) => setBloque({ imagen: v })} alto="h-24" />
          <Campo label="Posición"><Segmentado value={pos} opciones={POSICIONES} onChange={(v) => setBloque({ imagenPos: v })} /></Campo>
          {pos === "diagonal" && (
            <CampoRango label="Corte diagonal" value={b.diagonalOffset ?? 30} min={0} max={70} onChange={(v) => setBloque({ diagonalOffset: v })} sufijo="%" />
          )}
          {pos !== "ninguna" && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Texto sobre la imagen</span>
                <button
                  onClick={() => setBloque({ textoSobreImagen: !b.textoSobreImagen })}
                  title="El texto se coloca por encima de la imagen"
                  className={`relative h-5 w-9 shrink-0 rounded-full ${b.textoSobreImagen ? "bg-forge-orange" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${b.textoSobreImagen ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </div>
              <Campo label="Sombra del texto">
                <Segmentado value={b.textoSombra ?? "ninguna"} opciones={SOMBRAS_OPC} onChange={(v) => setBloque({ textoSombra: v })} />
              </Campo>
            </>
          )}
        </div>
      )}

      {!SIN_ITEMS.includes(b.tipo) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Elementos</p>
            <button onClick={addItem} className="text-xs font-semibold text-forge-orange hover:underline"><IconPlus className="mr-0.5 inline h-3.5 w-3.5" />Añadir</button>
          </div>
          {b.items.map((it, idx) => (
            <div
              key={it.id}
              ref={(el) => (itemRefs.current[it.id] = el)}
              className={`space-y-2 rounded-xl border p-2.5 ${it.id === selItemId ? "border-forge-orange ring-2 ring-forge-orange/30" : "border-slate-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moverItem(it.id, -1)} className="text-slate-300 hover:text-forge-dark"><IconChevronUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => moverItem(it.id, 1)} className="text-slate-300 hover:text-forge-dark"><IconChevronDown className="h-3.5 w-3.5" /></button>
                  <button onClick={() => removeItem(it.id)} className="text-slate-300 hover:text-red-500"><IconTrash className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {campos.valor && <input className={inputCls} placeholder={labels.valor} value={it.valor ?? ""} onChange={(e) => setItem(it.id, { valor: e.target.value })} />}
              {campos.titulo && <input className={inputCls} placeholder={labels.titulo} value={it.titulo ?? ""} onChange={(e) => setItem(it.id, { titulo: e.target.value })} />}
              {campos.texto && <textarea className={inputCls} rows={2} placeholder={labels.texto} value={it.texto ?? ""} onChange={(e) => setItem(it.id, { texto: e.target.value })} />}
              {campos.imagen && <SubirImagen src={it.imagen} onChange={(v) => setItem(it.id, { imagen: v })} alto="h-20" />}
              {campos.icono && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                  <SelectorIcono value={it.icono} onChange={(v) => setItem(it.id, { icono: v })} />
                  <input type="color" value={it.iconoColor || "#BE6B39"} onChange={(e) => setItem(it.id, { iconoColor: e.target.value })} className="h-8 w-9 cursor-pointer rounded border border-slate-200" title="Color del icono" />
                  {it.iconoColor && <button onClick={() => setItem(it.id, { iconoColor: undefined })} className="text-slate-300 hover:text-forge-dark"><IconX className="h-3.5 w-3.5" /></button>}
                  <input type="number" min={16} max={64} value={it.iconoSize ?? ""} placeholder="px" onChange={(e) => setItem(it.id, { iconoSize: e.target.value ? Number(e.target.value) : undefined })} className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs" title="Tamaño" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
