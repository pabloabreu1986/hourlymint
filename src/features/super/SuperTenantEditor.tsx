import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { tenantApi } from "@/services";
import { refrescarTenant, tenantActual } from "@/lib/branding";
import { FUNCIONES_DISPONIBLES } from "@/lib/funciones";
import { fileToThumbDataURL } from "@/lib/image";
import { errorDeTamano } from "@/lib/files";
import type { Tenant, TenantColores } from "@/lib/types";
import { Cargando, EmptyState, Spinner } from "@/components/ui";
import { IconChevronLeft, IconCheck, IconTrash, IconCamera } from "@/components/icons";

const COLORES: Array<{ key: keyof TenantColores; label: string; hint: string }> = [
  { key: "dark", label: "Oscuro / navy", hint: "Fondos, sidebar, textos" },
  { key: "orange", label: "Acento principal", hint: "Botones y elementos activos" },
  { key: "orange600", label: "Acento (hover)", hint: "Botón al pasar el ratón" },
  { key: "orange400", label: "Acento claro", hint: "Detalles suaves" },
  { key: "slate", label: "Secundario", hint: "Superficies oscuras 2" },
  { key: "steel", label: "Terciario", hint: "Superficies oscuras 3" },
  { key: "canvas", label: "Fondo", hint: "Lienzo de la app" },
];

export default function SuperTenantEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [t, setT] = useState<Tenant | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!id) return;
    tenantApi.getTenantById(id).then((res) => {
      if (res) setT(res);
      else setNoEncontrado(true);
    });
  }, [id]);

  if (noEncontrado)
    return <EmptyState titulo="Cliente no encontrado" texto="Vuelve a la lista de clientes." />;
  if (!t) return <Cargando />;

  const set = <K extends keyof Tenant>(k: K, v: Tenant[K]) => {
    setGuardado(false);
    setT({ ...t, [k]: v });
  };
  const setColor = (k: keyof TenantColores, v: string) =>
    set("colores", { ...t.colores, [k]: v });
  const toggleFuncion = (clave: string) => {
    const on = t.funciones.includes(clave);
    set("funciones", on ? t.funciones.filter((f) => f !== clave) : [...t.funciones, clave]);
  };

  async function onLogo(file: File | undefined) {
    if (!file || !t) return;
    const err = errorDeTamano(file);
    if (err) return alert(err);
    const dataUrl = await fileToThumbDataURL(file, 256, 0.9);
    set("logoUrl", dataUrl);
  }

  async function guardar() {
    if (!t) return;
    setGuardando(true);
    try {
      await tenantApi.guardarTenant(t);
      // Si estamos editando el tenant activo (p. ej. FORGEVIA en local),
      // repintamos la app al instante.
      if (t.id === tenantActual().id) refrescarTenant();
      setGuardado(true);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/super")}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-200"
          aria-label="Volver"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold text-slate-900">{t.nombreCorto}</h1>
          <p className="truncate text-xs text-slate-400">{t.slug}.fichaloop.com</p>
        </div>
      </div>

      {/* Vista previa */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: t.colores.dark }}
        >
          {t.logoUrl ? (
            <img src={t.logoUrl} alt="" className="h-8 w-8 object-contain" />
          ) : (
            <span
              className="grid h-8 w-8 place-items-center rounded-lg text-xs font-extrabold"
              style={{ background: t.colores.orange, color: "#fff" }}
            >
              {t.nombreCorto.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="leading-none">
            <div className="text-base font-extrabold text-white">
              {t.logotipo ? (
                <>
                  {t.logotipo.base}
                  <span style={{ color: t.colores.orange }}>{t.logotipo.acento}</span>
                </>
              ) : (
                t.nombreCorto
              )}
            </div>
            {t.eslogan && (
              <div className="mt-1 text-[8px] font-semibold tracking-[0.28em] text-white/60">
                {t.eslogan}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-4" style={{ background: t.colores.canvas }}>
          <span className="text-sm font-semibold" style={{ color: t.colores.dark }}>
            Vista previa
          </span>
          <span
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: t.colores.orange }}
          >
            Botón
          </span>
        </div>
      </div>

      {/* Marca */}
      <Seccion titulo="Marca">
        <Campo label="Nombre corto (logo)">
          <input className={inputCls} value={t.nombreCorto} onChange={(e) => set("nombreCorto", e.target.value)} />
        </Campo>
        <Campo label="Nombre completo (título / pestaña)">
          <input className={inputCls} value={t.nombre} onChange={(e) => set("nombre", e.target.value)} />
        </Campo>
        <Campo label="Eslogan (opcional)">
          <input className={inputCls} value={t.eslogan} onChange={(e) => set("eslogan", e.target.value)} placeholder="p. ej. PROYECTOS INTEGRALES" />
        </Campo>

        {/* Logotipo de dos tonos */}
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={!!t.logotipo}
            onChange={(e) =>
              set("logotipo", e.target.checked ? { base: t.nombreCorto, acento: "" } : undefined)
            }
          />
          Logotipo de dos tonos (parte en color de acento)
        </label>
        {t.logotipo && (
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Parte base">
              <input className={inputCls} value={t.logotipo.base} onChange={(e) => set("logotipo", { ...t.logotipo!, base: e.target.value })} />
            </Campo>
            <Campo label="Parte acento">
              <input className={inputCls} value={t.logotipo.acento} onChange={(e) => set("logotipo", { ...t.logotipo!, acento: e.target.value })} />
            </Campo>
          </div>
        )}

        {/* Logo imagen */}
        <Campo label="Logo (imagen, opcional)">
          <div className="flex items-center gap-3">
            {t.logoUrl && (
              <img src={t.logoUrl} alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-contain p-1" />
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <IconCamera className="h-4 w-4" /> {t.logoUrl ? "Cambiar" : "Subir"}
            </button>
            {t.logoUrl && (
              <button
                onClick={() => set("logoUrl", null)}
                className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <IconTrash className="h-4 w-4" /> Quitar
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onLogo(e.target.files?.[0])}
            />
          </div>
        </Campo>
      </Seccion>

      {/* Colores */}
      <Seccion titulo="Colores de marca">
        <div className="grid gap-3 sm:grid-cols-2">
          {COLORES.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="color"
                value={t.colores[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white"
                aria-label={label}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="truncate text-xs text-slate-400">{t.colores[key]} · {hint}</p>
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      {/* Funciones */}
      <Seccion titulo="Funciones activas">
        <div className="grid gap-2 sm:grid-cols-2">
          {FUNCIONES_DISPONIBLES.map((f) => {
            const on = f.fija || t.funciones.includes(f.clave);
            return (
              <label
                key={f.clave}
                className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                  on ? "border-slate-300 bg-slate-50" : "border-slate-200"
                } ${f.fija ? "opacity-60" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={f.fija}
                  onChange={() => toggleFuncion(f.clave)}
                />
                <span className="font-medium text-slate-700">{f.label}</span>
                {f.fija && <span className="ml-auto text-[10px] uppercase text-slate-400">fija</span>}
              </label>
            );
          })}
        </div>
        <p className="text-xs text-slate-400">
          El filtrado del menú por estas funciones se aplicará en un paso posterior.
        </p>
      </Seccion>

      {/* Guardar (barra fija) */}
      <div className="sticky bottom-4 flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={guardando}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-60"
        >
          {guardando ? (
            <Spinner className="h-5 w-5" />
          ) : guardado ? (
            <>
              <IconCheck className="h-5 w-5" /> Guardado
            </>
          ) : (
            "Guardar cambios"
          )}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
