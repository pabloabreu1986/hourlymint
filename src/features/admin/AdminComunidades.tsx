import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientesApi, obrasApi, gastosApi, facturasApi } from "@/services";
import { resumenCliente } from "@/lib/finanzas";
import { esComunidad, esAdminFincas } from "@/lib/fincas";
import { formatEuro } from "@/lib/format";
import { Cargando } from "@/components/ui";
import { IconPlus, IconBuilding, IconChevronRight } from "@/components/icons";
import ClienteForm from "./ClienteForm";
import type { Cliente, Factura, Gasto, Obra } from "@/lib/types";

export default function AdminComunidades() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [nuevo, setNuevo] = useState(false);
  const [admin, setAdmin] = useState("");

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

  const administraciones = useMemo(() => (clientes ?? []).filter(esAdminFincas), [clientes]);
  const nombreAdmin = (adminId: string | null | undefined) =>
    adminId ? administraciones.find((a) => a.id === adminId)?.nombreAdministracion ??
      administraciones.find((a) => a.id === adminId)?.nombre ?? "—" : "Sin administración";

  const comunidades = useMemo(() => {
    return (clientes ?? [])
      .filter(esComunidad)
      .filter((c) => (admin ? c.administradorId === admin : true))
      .map((c) => ({ c, r: resumenCliente(c.id, obras, gastos, facturas) }));
  }, [clientes, obras, gastos, facturas, admin]);

  if (!clientes) return <Cargando />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500">
            {comunidades.length} {comunidades.length === 1 ? "comunidad" : "comunidades"}
          </p>
          <select
            className="field h-9 w-auto py-1 text-sm"
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
          >
            <option value="">Todas las administraciones</option>
            {administraciones.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombreAdministracion || a.nombre}
              </option>
            ))}
          </select>
        </div>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nueva comunidad
        </button>
      </div>

      {comunidades.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <IconBuilding className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            Sin comunidades. Créalas y vincúlalas a la administración que las gestiona.
          </p>
          <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
            <IconPlus className="h-4 w-4" /> Nueva comunidad
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {comunidades.map(({ c, r }) => (
            <button
              key={c.id}
              onClick={() => navigate(`/admin/clientes/${c.id}`)}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50/50"
            >
              <IconBuilding className="h-5 w-5 shrink-0 text-slate-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-forge-dark">{c.nombre}</p>
                <p className="text-xs text-slate-400">
                  {nombreAdmin(c.administradorId)}
                  {c.direccion ? ` · ${c.direccion}` : ""}
                </p>
              </div>
              <div className="hidden gap-6 text-right text-xs sm:flex">
                <div>
                  <p className="text-slate-400">Obras</p>
                  <p className="font-semibold text-forge-dark">{r.numObras}</p>
                </div>
                <div>
                  <p className="text-slate-400">Facturado</p>
                  <p className="font-semibold text-forge-dark">{formatEuro(r.facturado)}</p>
                </div>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      )}

      {nuevo && (
        <ClienteForm
          cliente={null}
          tipoInicial="comunidad"
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
