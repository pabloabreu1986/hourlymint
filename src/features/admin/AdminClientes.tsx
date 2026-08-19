import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientesApi, obrasApi, gastosApi, facturasApi } from "@/services";
import { resumenCliente } from "@/lib/finanzas";
import {
  TIPOS_CONTACTO,
  ESTADOS_COMERCIAL,
  labelTipo,
  infoEstadoComercial,
  accionVencida,
} from "@/lib/fincas";
import { hoyISO } from "@/lib/seed";
import { formatEuro } from "@/lib/format";
import { Badge, Cargando } from "@/components/ui";
import { IconPlus, IconBriefcase } from "@/components/icons";
import ClienteForm from "./ClienteForm";
import type { Cliente, EstadoComercial, Factura, Gasto, Obra, TipoContacto } from "@/lib/types";

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [nuevo, setNuevo] = useState(false);
  const navigate = useNavigate();

  // Filtros
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<TipoContacto | "">("");
  const [estado, setEstado] = useState<EstadoComercial | "">("");
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [incluirInactivos, setIncluirInactivos] = useState(false);

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

  const hoy = hoyISO();

  const filas = useMemo(() => {
    if (!clientes) return [];
    const q = busca.trim().toLowerCase();
    return clientes
      .filter((c) => (incluirInactivos ? true : c.activo))
      .filter((c) => (tipo ? (c.tipo ?? "particular") === tipo : true))
      .filter((c) => (estado ? c.estadoComercial === estado : true))
      .filter((c) => (soloVencidos ? accionVencida(c.fechaProximaAccion, hoy) : true))
      .filter((c) =>
        q
          ? `${c.nombre} ${c.apellidos} ${c.nombreAdministracion ?? ""} ${c.zona ?? ""}`
              .toLowerCase()
              .includes(q)
          : true
      )
      .map((c) => ({ c, r: resumenCliente(c.id, obras, gastos, facturas) }));
  }, [clientes, obras, gastos, facturas, busca, tipo, estado, soloVencidos, incluirInactivos, hoy]);

  if (!clientes) return <Cargando />;

  const vencidosTotal = clientes.filter((c) => accionVencida(c.fechaProximaAccion, hoy)).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {filas.length} de {clientes.length} {clientes.length === 1 ? "contacto" : "contactos"}
        </p>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nuevo contacto
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <IconBriefcase className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            Aún no hay contactos. Crea el primero (particular, empresa, administrador de fincas…).
          </p>
          <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
            <IconPlus className="h-4 w-4" /> Nuevo contacto
          </button>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              className="field h-9 w-full py-1 text-sm sm:w-56"
              placeholder="Buscar por nombre, administración, zona…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select
              className="field h-9 w-auto py-1 text-sm"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoContacto | "")}
            >
              <option value="">Todos los tipos</option>
              {TIPOS_CONTACTO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              className="field h-9 w-auto py-1 text-sm"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoComercial | "")}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_COMERCIAL.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={soloVencidos}
                onChange={(e) => setSoloVencidos(e.target.checked)}
              />
              Acción vencida{vencidosTotal > 0 ? ` (${vencidosTotal})` : ""}
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={incluirInactivos}
                onChange={(e) => setIncluirInactivos(e.target.checked)}
              />
              Incluir inactivos
            </label>
          </div>

          {/* Móvil: tarjetas */}
          <div className="space-y-3 md:hidden">
            {filas.map(({ c, r }) => {
              const est = c.estadoComercial ? infoEstadoComercial(c.estadoComercial) : null;
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/admin/clientes/${c.id}`)}
                  className="card w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold text-forge-dark">
                      {c.nombreAdministracion || `${c.nombre} ${c.apellidos}`.trim()}
                    </p>
                    <Badge color="slate">{labelTipo(c.tipo)}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {c.telefono || "—"} · {c.email || "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {est && <Badge color={est.badge}>{est.label}</Badge>}
                    {accionVencida(c.fechaProximaAccion, hoy) && (
                      <Badge color="red">Seguimiento vencido</Badge>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
                    <div>
                      <p className="text-slate-400">Obras</p>
                      <p className="font-semibold text-forge-dark">{r.numObras}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Facturado</p>
                      <p className="font-semibold text-forge-dark">{formatEuro(r.facturado)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Margen</p>
                      <p className={`font-semibold ${r.margenReal >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {formatEuro(r.margenReal)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Escritorio: tabla */}
          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 text-right font-semibold">Obras</th>
                    <th className="px-4 py-3 text-right font-semibold">Facturado</th>
                    <th className="px-4 py-3 text-right font-semibold">Margen real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.map(({ c, r }) => {
                    const est = c.estadoComercial ? infoEstadoComercial(c.estadoComercial) : null;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/admin/clientes/${c.id}`)}
                        className="cursor-pointer hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-forge-dark">
                            {c.nombreAdministracion || `${c.nombre} ${c.apellidos}`.trim()}
                          </p>
                          {(c.zona || c.direccion) && (
                            <p className="text-xs text-slate-400">{c.zona || c.direccion}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color="slate">{labelTipo(c.tipo)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {est ? <Badge color={est.badge}>{est.label}</Badge> : <span className="text-xs text-slate-300">—</span>}
                            {accionVencida(c.fechaProximaAccion, hoy) && <Badge color="red">Vencido</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <p>{c.telefono || "—"}</p>
                          <p className="text-xs text-slate-400">{c.email || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-forge-dark">{r.numObras}</td>
                        <td className="px-4 py-3 text-right text-forge-dark">{formatEuro(r.facturado)}</td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            r.margenReal >= 0 ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {formatEuro(r.margenReal)}
                        </td>
                      </tr>
                    );
                  })}
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
