import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { comprasApi, catalogoApi } from "@/services";
import { formatEuro, fechaCompleta } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { Badge, Cargando } from "@/components/ui";
import { IconPlus, IconReceipt } from "@/components/icons";
import type { FacturaProveedor, Proveedor } from "@/lib/types";

const BADGE: Record<FacturaProveedor["estado"], { label: string; color: "slate" | "amber" | "green" }> = {
  borrador: { label: "Borrador", color: "slate" },
  revisada: { label: "Revisada", color: "amber" },
  aprobada: { label: "Aprobada", color: "green" },
};

export default function AdminCompras() {
  const [items, setItems] = useState<FacturaProveedor[] | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const navigate = useNavigate();

  async function cargar() {
    const [cs, ps] = await Promise.all([comprasApi.listCompras(), catalogoApi.listProveedores()]);
    setItems(cs);
    setProveedores(ps);
  }
  useEffect(() => {
    cargar();
  }, []);

  const nombreProv = (id: string | null) =>
    id ? proveedores.find((p) => p.id === id)?.nombre ?? "—" : "—";

  async function nueva() {
    const c = await comprasApi.crearCompra({
      proveedorId: null,
      obraId: null,
      numero: "",
      fecha: hoyISO(),
      archivo: null,
      lineas: [],
      estado: "borrador",
      total: 0,
    });
    navigate(`/admin/compras/${c.id}`);
  }

  if (!items) return <Cargando />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Sube facturas de proveedor; el sistema extrae las líneas y alimenta el banco de precios.
        </p>
        <button onClick={nueva} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nueva factura
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <IconReceipt className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">Sin facturas de proveedor todavía.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nº</th>
                  <th className="px-4 py-3 font-semibold">Proveedor</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/compras/${c.id}`)}
                    className="cursor-pointer hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-forge-dark">{c.numero || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{nombreProv(c.proveedorId)}</td>
                    <td className="px-4 py-3 text-slate-500">{fechaCompleta(c.fecha)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-forge-dark">
                      {formatEuro(c.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={BADGE[c.estado].color}>{BADGE[c.estado].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
