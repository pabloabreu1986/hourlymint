import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { presupuestosApi, clientesApi, obrasApi } from "@/services";
import { confirmar } from "@/components/confirm";
import { infoEstadoPresupuesto, totalesPresupuesto } from "@/lib/presupuestos-calc";
import { formatEuro, fechaCompleta } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { Badge, Cargando } from "@/components/ui";
import { IconPlus, IconClipboard, IconReceipt, IconTrash } from "@/components/icons";
import type { Cliente, Obra, Presupuesto } from "@/lib/types";
import FacturaForm from "./FacturaForm";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Prefill de factura a partir de uno o varios presupuestos. Suma los PVP.
 * Devuelve null (y avisa) si mezclan clientes distintos. */
function prefillFactura(ps: Presupuesto[]): {
  clienteId: string;
  obraId: string;
  concepto: string;
  base: string;
} | null {
  const clientesSel = new Set(ps.map((p) => p.clienteId).filter(Boolean) as string[]);
  if (clientesSel.size > 1) {
    toast.error("Los presupuestos son de clientes distintos. Factura por separado.");
    return null;
  }
  const obrasSel = new Set(ps.map((p) => p.obraId).filter(Boolean) as string[]);
  const base = r2(ps.reduce((s, p) => s + totalesPresupuesto(p).pvp, 0));
  const numeros = ps.map((p) => p.numero).join(", ");
  return {
    clienteId: [...clientesSel][0] ?? "",
    obraId: obrasSel.size === 1 ? [...obrasSel][0] : "",
    concepto: ps.length === 1 ? `Presupuesto ${numeros}` : `Presupuestos ${numeros}`,
    base: String(base),
  };
}

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
  const [obras, setObras] = useState<Obra[]>([]);
  const [margen, setMargen] = useState(margenDefecto());
  // Prefill de la factura en curso (uno o varios presupuestos); null = cerrado.
  const [facturarPrefill, setFacturarPrefill] = useState<ReturnType<typeof prefillFactura>>(null);
  // Presupuestos seleccionados para combinar en una sola factura.
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  async function cargar() {
    const [ps, cs, os] = await Promise.all([
      presupuestosApi.listPresupuestos(),
      clientesApi.listClientes(),
      obrasApi.listObras(),
    ]);
    setItems(ps);
    setClientes(cs);
    setObras(os);
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

  function toggleSel(id: string) {
    setSeleccion((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  /** Factura de uno (botón por fila) o de los seleccionados (barra). */
  function facturar(ps: Presupuesto[]) {
    const pf = prefillFactura(ps);
    if (pf) setFacturarPrefill(pf);
  }

  async function borrar(p: Presupuesto) {
    if (
      !(await confirmar({
        titulo: "Eliminar presupuesto",
        mensaje: `Se eliminará el presupuesto ${p.numero}. Esta acción no se puede deshacer.`,
        confirmar: "Eliminar",
        peligro: true,
      }))
    )
      return;
    await presupuestosApi.eliminarPresupuesto(p.id);
    setSeleccion((s) => {
      const n = new Set(s);
      n.delete(p.id);
      return n;
    });
    cargar();
  }

  if (!items) return <Cargando />;

  const seleccionados = items.filter((p) => seleccion.has(p.id));

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
        <div className="flex items-center gap-2">
          {seleccionados.length > 0 && (
            <button
              onClick={() => facturar(seleccionados)}
              className="btn-ghost px-4 py-2.5 text-sm"
            >
              <IconReceipt className="h-4 w-4" /> Crear factura ({seleccionados.length})
            </button>
          )}
          <button onClick={nuevo} className="btn-primary px-4 py-2.5 text-sm">
            <IconPlus className="h-4 w-4" /> Nuevo presupuesto
          </button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <p className="mb-3 text-xs text-slate-400">
          {seleccionados.length} presupuesto{seleccionados.length > 1 ? "s" : ""} seleccionado
          {seleccionados.length > 1 ? "s" : ""} · se combinarán en una sola factura (suma de PVP).
        </p>
      )}

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
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-forge-orange"
                      checked={items.length > 0 && seleccion.size === items.length}
                      ref={(el) => {
                        if (el) el.indeterminate = seleccion.size > 0 && seleccion.size < items.length;
                      }}
                      onChange={(e) =>
                        setSeleccion(e.target.checked ? new Set(items.map((p) => p.id)) : new Set())
                      }
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Nº</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3"></th>
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
                      className={`cursor-pointer hover:bg-slate-50/50 ${
                        seleccion.has(p.id) ? "bg-forge-orange/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-forge-orange"
                          checked={seleccion.has(p.id)}
                          onChange={() => toggleSel(p.id)}
                          aria-label={`Seleccionar ${p.numero}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-forge-dark">{p.numero}</td>
                      <td className="px-4 py-3 text-slate-600">{nombreCliente(p.clienteId)}</td>
                      <td className="px-4 py-3 text-slate-500">{fechaCompleta(p.fecha)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-forge-dark">
                        {formatEuro(t.pvp)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={info.badge}>{info.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => facturar([p])}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-forge-orange hover:bg-forge-orange/5"
                          >
                            <IconReceipt className="h-3.5 w-3.5" /> Crear factura
                          </button>
                          <button
                            onClick={() => borrar(p)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Eliminar presupuesto"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {facturarPrefill && (
        <FacturaForm
          factura={null}
          clientes={clientes}
          obras={obras}
          prefill={facturarPrefill}
          onClose={() => setFacturarPrefill(null)}
          onSaved={() => {
            setFacturarPrefill(null);
            setSeleccion(new Set());
            toast.success("Factura creada a partir del presupuesto");
            navigate("/admin/facturas");
          }}
        />
      )}
    </div>
  );
}
