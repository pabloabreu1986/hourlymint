import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientesApi, obrasApi, facturasApi } from "@/services";
import { ESTADOS_FACTURA, infoEstadoFactura } from "@/lib/finanzas";
import { formatEuro, fechaCompleta } from "@/lib/format";
import { Badge, Cargando } from "@/components/ui";
import { confirmar } from "@/components/confirm";
import { IconPlus, IconEdit, IconTrash, IconReceipt } from "@/components/icons";
import FacturaForm from "./FacturaForm";
import type { Cliente, EstadoFactura, Factura, Obra } from "@/lib/types";

type Filtro = "todas" | EstadoFactura;

export default function AdminFacturas() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [facturas, setFacturas] = useState<Factura[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [nueva, setNueva] = useState(false);
  const [editar, setEditar] = useState<Factura | null>(null);
  const navigate = useNavigate();

  async function cargar() {
    const [c, o, f] = await Promise.all([
      clientesApi.listClientes(),
      obrasApi.listObras(),
      facturasApi.listFacturas(),
    ]);
    setClientes(c);
    setObras(o);
    setFacturas(f);
  }
  useEffect(() => {
    cargar();
  }, []);

  const nombreCliente = (cid: string) => {
    const c = clientes.find((x) => x.id === cid);
    return c ? `${c.nombre} ${c.apellidos}`.trim() : "—";
  };

  const totales = useMemo(() => {
    const fs = facturas ?? [];
    const emitido = fs.filter((f) => f.estado !== "borrador");
    return {
      facturado: emitido.reduce((a, f) => a + f.total, 0),
      cobrado: fs.filter((f) => f.estado === "pagada").reduce((a, f) => a + f.total, 0),
      pendiente: emitido
        .filter((f) => f.estado !== "pagada")
        .reduce((a, f) => a + f.total, 0),
    };
  }, [facturas]);

  if (!facturas) return <Cargando />;

  const visibles = filtro === "todas" ? facturas : facturas.filter((f) => f.estado === filtro);

  async function marcarPagada(f: Factura) {
    await facturasApi.actualizarFactura(f.id, { estado: "pagada", fechaPago: f.fechaPago ?? f.fecha });
    cargar();
  }
  async function eliminar(f: Factura) {
    if (!(await confirmar({ titulo: "Eliminar factura", mensaje: `Se eliminará la factura ${f.numero || ""}.`.trim() }))) return;
    await facturasApi.eliminarFactura(f.id);
    cargar();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{facturas.length} facturas</p>
        <button
          onClick={() => setNueva(true)}
          disabled={clientes.length === 0}
          className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
          title={clientes.length === 0 ? "Crea antes un cliente" : undefined}
        >
          <IconPlus className="h-4 w-4" /> Nueva factura
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-400">Facturado</p>
          <p className="mt-1 text-lg font-extrabold text-forge-dark">{formatEuro(totales.facturado)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">Cobrado</p>
          <p className="mt-1 text-lg font-extrabold text-green-600">{formatEuro(totales.cobrado)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">Pendiente</p>
          <p className="mt-1 text-lg font-extrabold text-amber-600">{formatEuro(totales.pendiente)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["todas", ...ESTADOS_FACTURA.map((e) => e.valor)] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filtro === f
                ? "bg-forge-dark text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-forge-dark"
            }`}
          >
            {f === "todas" ? "Todas" : infoEstadoFactura(f as EstadoFactura).label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <IconReceipt className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">No hay facturas en este filtro.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nº</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((f) => {
                  const info = infoEstadoFactura(f.estado);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-forge-dark">{f.numero}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/admin/clientes/${f.clienteId}`)}
                          className="text-forge-dark hover:text-forge-orange hover:underline"
                        >
                          {nombreCliente(f.clienteId)}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{fechaCompleta(f.fecha)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-forge-dark">
                        {formatEuro(f.total)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={info.badge}>{info.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {f.estado !== "pagada" && (
                            <button
                              onClick={() => marcarPagada(f)}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-green-600 hover:bg-green-50"
                            >
                              Cobrada
                            </button>
                          )}
                          <button
                            onClick={() => setEditar(f)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => eliminar(f)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
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

      {(nueva || editar) && (
        <FacturaForm
          factura={editar}
          clientes={clientes}
          obras={obras}
          onClose={() => {
            setNueva(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNueva(false);
            setEditar(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}
