import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientesApi, obrasApi, gastosApi, facturasApi } from "@/services";
import { labelCanal, resumenCliente } from "@/lib/finanzas";
import { formatEuro } from "@/lib/format";
import { Badge, Cargando } from "@/components/ui";
import { IconPlus, IconBriefcase } from "@/components/icons";
import ClienteForm from "./ClienteForm";
import type { Cliente, Factura, Gasto, Obra } from "@/lib/types";

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [nuevo, setNuevo] = useState(false);
  const navigate = useNavigate();

  async function cargar() {
    const [c, o, g, f] = await Promise.all([
      clientesApi.listClientes(),
      obrasApi.listObras(),
      gastosApi.listGastos(),
      facturasApi.listFacturas(),
    ]);
    setClientes(c);
    setObras(o);
    setGastos(g);
    setFacturas(f);
  }
  useEffect(() => {
    cargar();
  }, []);

  if (!clientes) return <Cargando />;

  const filas = clientes.map((c) => ({
    c,
    r: resumenCliente(c.id, obras, gastos, facturas),
  }));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
        </p>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nuevo cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <IconBriefcase className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            Aún no hay clientes. Crea el primero para asociarle obras, gastos y facturas.
          </p>
          <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
            <IconPlus className="h-4 w-4" /> Nuevo cliente
          </button>
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <div className="space-y-3 md:hidden">
            {filas.map(({ c, r }) => (
              <button
                key={c.id}
                onClick={() => navigate(`/admin/clientes/${c.id}`)}
                className="card w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-forge-dark">
                    {c.nombre} {c.apellidos}
                  </p>
                  <Badge color="slate">{labelCanal(c.canal)}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {c.telefono || "—"} · {c.email || "—"}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
                  <div>
                    <p className="text-slate-400">Obras</p>
                    <p className="font-semibold text-forge-dark">{r.numObras}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Gastos</p>
                    <p className="font-semibold text-forge-dark">{formatEuro(r.gastos)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Margen</p>
                    <p className={`font-semibold ${r.margenReal >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {formatEuro(r.margenReal)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Escritorio: tabla */}
          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Captación</th>
                    <th className="px-4 py-3 text-right font-semibold">Obras</th>
                    <th className="px-4 py-3 text-right font-semibold">Facturado</th>
                    <th className="px-4 py-3 text-right font-semibold">Gastos</th>
                    <th className="px-4 py-3 text-right font-semibold">Margen real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.map(({ c, r }) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/clientes/${c.id}`)}
                      className="cursor-pointer hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-forge-dark">
                          {c.nombre} {c.apellidos}
                        </p>
                        {c.direccion && (
                          <p className="text-xs text-slate-400">{c.direccion}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <p>{c.telefono || "—"}</p>
                        <p className="text-xs text-slate-400">{c.email || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="slate">{labelCanal(c.canal)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-forge-dark">
                        {r.numObras}
                      </td>
                      <td className="px-4 py-3 text-right text-forge-dark">
                        {formatEuro(r.facturado)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatEuro(r.gastos)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          r.margenReal >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {formatEuro(r.margenReal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {nuevo && (
        <ClienteForm
          cliente={null}
          onClose={() => setNuevo(false)}
          onSaved={(c) => {
            setNuevo(false);
            navigate(`/admin/clientes/${c.id}`);
          }}
        />
      )}
    </div>
  );
}
