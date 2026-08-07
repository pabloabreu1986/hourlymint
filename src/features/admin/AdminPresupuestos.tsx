import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { presupuestosApi, clientesApi } from "@/services";
import { infoEstadoPresupuesto, totalesPresupuesto } from "@/lib/presupuestos-calc";
import { formatEuro, fechaCompleta } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { Badge, Cargando } from "@/components/ui";
import { IconPlus, IconClipboard } from "@/components/icons";
import type { Cliente, Presupuesto } from "@/lib/types";

/** Margen por defecto (lo fija el directivo); se guarda por tenant en local. */
export function margenDefecto(): number {
  try {
    const v = Number(localStorage.getItem("fichaloop.margenDefecto"));
    return Number.isFinite(v) && v > 0 ? v : 25;
  } catch {
    return 25;
  }
}

export default function AdminPresupuestos() {
  const [items, setItems] = useState<Presupuesto[] | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [margen, setMargen] = useState(margenDefecto());
  const navigate = useNavigate();

  async function cargar() {
    const [ps, cs] = await Promise.all([
      presupuestosApi.listPresupuestos(),
      clientesApi.listClientes(),
    ]);
    setItems(ps);
    setClientes(cs);
  }
  useEffect(() => {
    cargar();
  }, []);

  const nombreCliente = (id: string | null) => {
    const c = clientes.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellidos}`.trim() : "—";
  };

  async function nuevo() {
    const anio = hoyISO().slice(0, 4);
    const n = (items?.length ?? 0) + 1;
    const p = await presupuestosApi.crearPresupuesto({
      clienteId: null,
      obraId: null,
      numero: `P-${anio}-${String(n).padStart(3, "0")}`,
      fecha: hoyISO(),
      estado: "borrador",
      margenPct: margenDefecto(),
      lineas: [],
      disclaimers: [],
      notas: "",
    });
    navigate(`/admin/presupuestos/${p.id}`);
  }

  function guardarMargen(v: number) {
    setMargen(v);
    try {
      localStorage.setItem("fichaloop.margenDefecto", String(v));
    } catch {
      /* cuota */
    }
  }

  if (!items) return <Cargando />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Margen por defecto</span>
          <input
            type="number"
            className="field w-20 py-1.5"
            value={margen}
            onChange={(e) => guardarMargen(Number(e.target.value) || 0)}
          />
          <span>%</span>
        </div>
        <button onClick={nuevo} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nuevo presupuesto
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <IconClipboard className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            Sin presupuestos. Crea el primero a partir de tu banco de precios.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nº</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => {
                  const info = infoEstadoPresupuesto(p.estado);
                  const t = totalesPresupuesto(p);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/admin/presupuestos/${p.id}`)}
                      className="cursor-pointer hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 font-medium text-forge-dark">{p.numero}</td>
                      <td className="px-4 py-3 text-slate-600">{nombreCliente(p.clienteId)}</td>
                      <td className="px-4 py-3 text-slate-500">{fechaCompleta(p.fecha)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-forge-dark">
                        {formatEuro(t.pvp)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={info.badge}>{info.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
