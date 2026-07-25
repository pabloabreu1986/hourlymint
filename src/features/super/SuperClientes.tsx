import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tenantApi } from "@/services";
import type { Tenant } from "@/lib/types";
import { Cargando, EmptyState, Modal, Spinner } from "@/components/ui";
import { IconPlus, IconChevronRight, IconObras } from "@/components/icons";

export default function SuperClientes() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [creando, setCreando] = useState(false);

  async function cargar() {
    setTenants(await tenantApi.listTenants());
  }
  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    if (!nombre.trim() || creando) return;
    setCreando(true);
    try {
      const t = await tenantApi.crearTenant(nombre);
      setNuevoOpen(false);
      setNombre("");
      navigate(`/super/clientes/${t.id}`);
    } finally {
      setCreando(false);
    }
  }

  if (!tenants) return <Cargando />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">
            {tenants.length} {tenants.length === 1 ? "cliente" : "clientes"} en la plataforma
          </p>
        </div>
        <button
          onClick={() => setNuevoOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
        >
          <IconPlus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          icon={<IconObras className="h-12 w-12" />}
          titulo="Sin clientes todavía"
          texto="Crea el primer cliente para configurar su marca."
        />
      ) : (
        <div className="space-y-3">
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/super/clientes/${t.id}`)}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300"
            >
              {/* Muestra de marca */}
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                style={{ background: t.colores.dark }}
              >
                {t.logoUrl ? (
                  <img src={t.logoUrl} alt="" className="h-8 w-8 object-contain" />
                ) : (
                  <span style={{ color: t.colores.orange }}>
                    {t.nombreCorto.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{t.nombreCorto}</p>
                <p className="truncate text-xs text-slate-400">
                  {t.slug}.fichaloop.com · {t.funciones.length} funciones
                </p>
                <div className="mt-1.5 flex gap-1">
                  {[t.colores.dark, t.colores.orange, t.colores.canvas].map((c, i) => (
                    <span
                      key={i}
                      className="h-3 w-3 rounded-full ring-1 ring-black/10"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <IconChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      )}

      <Modal open={nuevoOpen} onClose={() => setNuevoOpen(false)} title="Nuevo cliente">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Nombre del cliente
            </label>
            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
              placeholder="p. ej. Construcciones López"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Podrás ajustar marca, colores, logo y funciones a continuación.
            </p>
          </div>
          <button
            onClick={crear}
            disabled={!nombre.trim() || creando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {creando ? <Spinner className="h-5 w-5" /> : "Crear cliente"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
