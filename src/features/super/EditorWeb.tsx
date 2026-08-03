import { uid } from "@/lib/db";
import { urlDeEspacio } from "@/lib/host";
import { plantillaWebEjemplo } from "@/lib/web-plantilla";
import type { ItemWeb, SeccionWeb, TipoSeccionWeb } from "@/lib/types";
import {
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconTrash,
} from "@/components/icons";

const TIPOS: Array<{ tipo: TipoSeccionWeb; label: string }> = [
  { tipo: "hero", label: "Portada" },
  { tipo: "texto", label: "Texto" },
  { tipo: "cards", label: "Tarjetas" },
  { tipo: "lista", label: "Lista" },
  { tipo: "chips", label: "Píldoras" },
  { tipo: "faq", label: "Preguntas y respuestas" },
  { tipo: "cta", label: "Contacto" },
];

const labelDe = (t: TipoSeccionWeb) => TIPOS.find((x) => x.tipo === t)?.label ?? t;

const inputCls =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

/**
 * Editor de la mini-web pública del cliente (solo super-admin).
 * Trabaja sobre `web` del tenant; el guardado lo hace el botón general
 * "Guardar cambios" del editor de cliente.
 */
export default function EditorWeb({
  web,
  nombreCorto,
  slug,
  onChange,
}: {
  web: SeccionWeb[];
  nombreCorto: string;
  slug: string;
  onChange: (web: SeccionWeb[]) => void;
}) {
  function nuevaSeccion(tipo: TipoSeccionWeb) {
    const s: SeccionWeb = {
      id: uid("ws"),
      tipo,
      titulo: labelDe(tipo),
      subtitulo: "",
      items: [],
      ...(tipo === "cta" ? { telefono: "", email: "", whatsapp: "" } : {}),
    };
    onChange([...web, s]);
  }

  function patch(id: string, p: Partial<SeccionWeb>) {
    onChange(web.map((s) => (s.id === id ? { ...s, ...p } : s)));
  }

  function mover(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= web.length) return;
    const copia = [...web];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange(copia);
  }

  function eliminar(id: string) {
    onChange(web.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          La web pública se muestra en la raíz de{" "}
          <span className="font-mono">{slug}.fichaloop.com</span> (con botón «Acceso» al login).
          Sin secciones, la raíz sigue siendo el login.
        </p>
        {web.length > 0 && (
          <a
            href={urlDeEspacio(slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-slate-700 underline underline-offset-4 hover:text-slate-900"
          >
            Ver web ↗
          </a>
        )}
      </div>

      {web.length === 0 && (
        <button
          onClick={() => onChange(plantillaWebEjemplo(nombreCorto))}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          Insertar plantilla de ejemplo (experiencias, reserva, libro del proyecto, FAQ y contacto)
        </button>
      )}

      {web.map((s, i) => (
        <div key={s.id} className="rounded-xl border border-slate-200">
          {/* Cabecera de la sección */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {labelDe(s.tipo)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
              {s.titulo || "(sin título)"}
            </span>
            <button onClick={() => mover(i, -1)} disabled={i === 0} className={btnMini} aria-label="Subir">
              <IconChevronUp className="h-4 w-4" />
            </button>
            <button onClick={() => mover(i, 1)} disabled={i === web.length - 1} className={btnMini} aria-label="Bajar">
              <IconChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => eliminar(s.id)}
              className="grid h-7 w-7 place-items-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar sección"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>

          {/* Campos */}
          <div className="space-y-2.5 p-3">
            <input
              className={inputCls}
              value={s.titulo}
              onChange={(e) => patch(s.id, { titulo: e.target.value })}
              placeholder="Título"
            />
            <textarea
              className={inputCls}
              rows={s.tipo === "texto" ? 4 : 2}
              value={s.subtitulo}
              onChange={(e) => patch(s.id, { subtitulo: e.target.value })}
              placeholder={s.tipo === "texto" ? "Cuerpo del texto" : "Texto de apoyo (opcional)"}
            />

            {s.tipo === "cards" && (
              <EditorCards s={s} onPatch={(p) => patch(s.id, p)} />
            )}

            {(s.tipo === "lista" || s.tipo === "chips") && (
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-400">
                  Elementos (uno por línea)
                </p>
                <textarea
                  className={inputCls}
                  rows={5}
                  value={s.items.map((x) => x.texto ?? "").join("\n")}
                  onChange={(e) =>
                    patch(s.id, {
                      items: e.target.value
                        .split("\n")
                        .map((linea) => ({ id: uid("wi"), texto: linea })),
                    })
                  }
                  onBlur={(e) =>
                    patch(s.id, {
                      items: e.target.value
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .map((texto) => ({ id: uid("wi"), texto })),
                    })
                  }
                />
              </div>
            )}

            {s.tipo === "faq" && <EditorFaq s={s} onPatch={(p) => patch(s.id, p)} />}

            {s.tipo === "cta" && (
              <div className="grid gap-2.5 sm:grid-cols-3">
                <input className={inputCls} value={s.telefono ?? ""} onChange={(e) => patch(s.id, { telefono: e.target.value })} placeholder="Teléfono" />
                <input className={inputCls} value={s.whatsapp ?? ""} onChange={(e) => patch(s.id, { whatsapp: e.target.value })} placeholder="WhatsApp (+34…)" />
                <input className={inputCls} value={s.email ?? ""} onChange={(e) => patch(s.id, { email: e.target.value })} placeholder="Email" />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Añadir sección */}
      <div className="flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.tipo}
            onClick={() => nuevaSeccion(t.tipo)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <IconPlus className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const btnMini =
  "grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30";

// ── Tarjetas ──

function EditorCards({ s, onPatch }: { s: SeccionWeb; onPatch: (p: Partial<SeccionWeb>) => void }) {
  const setItem = (id: string, p: Partial<ItemWeb>) =>
    onPatch({ items: s.items.map((x) => (x.id === id ? { ...x, ...p } : x)) });

  return (
    <div className="space-y-2.5">
      {s.items.map((c) => (
        <div key={c.id} className="space-y-2 rounded-lg bg-slate-50 p-2.5">
          <div className="flex gap-2">
            <input className={inputCls} value={c.titulo ?? ""} onChange={(e) => setItem(c.id, { titulo: e.target.value })} placeholder="Título de la tarjeta" />
            <input className={inputCls} value={c.etiqueta ?? ""} onChange={(e) => setItem(c.id, { etiqueta: e.target.value })} placeholder="Etiqueta (p.ej. precio)" />
            <button
              onClick={() => onPatch({ items: s.items.filter((x) => x.id !== c.id) })}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-400 hover:bg-red-50"
              aria-label="Eliminar tarjeta"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
          <input className={inputCls} value={c.texto ?? ""} onChange={(e) => setItem(c.id, { texto: e.target.value })} placeholder="Descripción corta" />
          <textarea
            className={inputCls}
            rows={4}
            value={(c.puntos ?? []).join("\n")}
            onChange={(e) => setItem(c.id, { puntos: e.target.value.split("\n") })}
            onBlur={(e) =>
              setItem(c.id, { puntos: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) })
            }
            placeholder="Puntos incluidos (uno por línea)"
          />
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={!!c.destacada}
              onChange={(e) => setItem(c.id, { destacada: e.target.checked })}
            />
            Tarjeta destacada
          </label>
        </div>
      ))}
      <button
        onClick={() => onPatch({ items: [...s.items, { id: uid("wi"), titulo: "", puntos: [] }] })}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
      >
        <IconPlus className="h-3.5 w-3.5" /> Añadir tarjeta
      </button>
    </div>
  );
}

// ── FAQ ──

function EditorFaq({ s, onPatch }: { s: SeccionWeb; onPatch: (p: Partial<SeccionWeb>) => void }) {
  const setItem = (id: string, p: Partial<ItemWeb>) =>
    onPatch({ items: s.items.map((x) => (x.id === id ? { ...x, ...p } : x)) });

  return (
    <div className="space-y-2.5">
      {s.items.map((f) => (
        <div key={f.id} className="space-y-2 rounded-lg bg-slate-50 p-2.5">
          <div className="flex gap-2">
            <input className={inputCls} value={f.titulo ?? ""} onChange={(e) => setItem(f.id, { titulo: e.target.value })} placeholder="Pregunta" />
            <button
              onClick={() => onPatch({ items: s.items.filter((x) => x.id !== f.id) })}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-400 hover:bg-red-50"
              aria-label="Eliminar pregunta"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
          <textarea className={inputCls} rows={2} value={f.texto ?? ""} onChange={(e) => setItem(f.id, { texto: e.target.value })} placeholder="Respuesta" />
        </div>
      ))}
      <button
        onClick={() => onPatch({ items: [...s.items, { id: uid("wi"), titulo: "", texto: "" }] })}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
      >
        <IconPlus className="h-3.5 w-3.5" /> Añadir pregunta
      </button>
    </div>
  );
}
