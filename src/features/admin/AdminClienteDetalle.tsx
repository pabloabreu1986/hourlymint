import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  clientesApi,
  obrasApi,
  gastosApi,
  facturasApi,
  documentosApi,
  comprasApi,
  oportunidadesApi,
  seguimientoApi,
} from "@/services";
import { useAuth } from "@/context/AuthContext";
import {
  infoEstadoFactura,
  labelCanal,
  resumenCliente,
  resumenObra,
} from "@/lib/finanzas";
import {
  ESTADOS_OPORTUNIDAD,
  TIPOS_INTERACCION,
  accionVencida,
  comunidadesDe,
  esAdminFincas,
  esComunidad,
  infoEstadoComercial,
  infoEstadoOportunidad,
  labelInteraccion,
  labelTipo,
} from "@/lib/fincas";
import { hoyISO } from "@/lib/seed";
import { formatEuro, fechaCompleta, fechaHora } from "@/lib/format";
import { Badge, Cargando, Modal, Spinner } from "@/components/ui";
import { confirmar } from "@/components/confirm";
import {
  IconChevronLeft,
  IconEdit,
  IconTrash,
  IconPlus,
  IconDownload,
  IconFolder,
  IconBuilding,
  IconChevronRight,
  IconTarget,
  IconPhone,
} from "@/components/icons";
import ClienteForm from "./ClienteForm";
import FacturaForm from "./FacturaForm";
import type {
  CategoriaDocumento,
  Cliente,
  Documento,
  EstadoOportunidad,
  Factura,
  FacturaProveedor,
  Gasto,
  Interaccion,
  Obra,
  Oportunidad,
  TipoInteraccion,
} from "@/lib/types";

export default function AdminClienteDetalle() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [compras, setCompras] = useState<FacturaProveedor[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [cargando, setCargando] = useState(true);

  const [editar, setEditar] = useState(false);
  const [borrar, setBorrar] = useState(false);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [nuevaFactura, setNuevaFactura] = useState(false);
  const [asignar, setAsignar] = useState(false);
  const [nuevaComunidad, setNuevaComunidad] = useState(false);
  const [nuevaOportunidad, setNuevaOportunidad] = useState(false);

  async function cargar() {
    const [c, cs, o, g, f, d, cm, ops, ints] = await Promise.all([
      clientesApi.getCliente(id),
      clientesApi.listClientes(),
      obrasApi.listObras(),
      gastosApi.listGastos(),
      facturasApi.listFacturas(),
      documentosApi.listDocumentos(),
      comprasApi.listCompras(),
      oportunidadesApi.listOportunidades(),
      seguimientoApi.listInteracciones(id),
    ]);
    setCliente(c);
    setClientes(cs);
    setObras(o);
    setGastos(g);
    setFacturas(f);
    setDocumentos(d);
    setCompras(cm);
    setOportunidades(ops);
    setInteracciones(ints);
    setCargando(false);
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (cargando) return <Cargando />;
  if (!cliente) {
    return (
      <div className="card p-8 text-center text-slate-500">
        Cliente no encontrado.{" "}
        <button onClick={() => navigate("/admin/clientes")} className="text-forge-orange underline">
          Volver
        </button>
      </div>
    );
  }

  const obrasCli = obras.filter((o) => o.clienteId === cliente.id);
  const facturasCli = facturas
    .filter((f) => f.clienteId === cliente.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const docsCli = documentos.filter((d) => d.clienteId === cliente.id);
  const r = resumenCliente(cliente.id, obras, gastos, facturas, compras);
  const sinAsignar = obras.filter((o) => !o.clienteId);
  const nombreObra = (obraId: string | null) =>
    obraId ? obras.find((o) => o.id === obraId)?.nombre ?? "—" : "General";

  // ── CRM fincas ──
  const hoy = hoyISO();
  const esAdmin = esAdminFincas(cliente);
  const esCom = esComunidad(cliente);
  const estadoInfo = cliente.estadoComercial ? infoEstadoComercial(cliente.estadoComercial) : null;
  const comunidades = esAdmin ? comunidadesDe(cliente.id, clientes) : [];
  const comunidadIds = new Set(comunidades.map((c) => c.id));
  const administracion = esCom && cliente.administradorId
    ? clientes.find((c) => c.id === cliente.administradorId) ?? null
    : null;
  // Oportunidades del contacto: las propias + (si es admin) las de sus comunidades.
  const oportsCli = oportunidades.filter(
    (o) => o.clienteId === cliente.id || o.administradorId === cliente.id || comunidadIds.has(o.clienteId)
  );
  const nombreCliente = (cid: string) => clientes.find((c) => c.id === cid)?.nombre ?? "—";

  async function nuevaOportunidadPara(data: {
    titulo: string;
    descripcion: string;
    importeEstimado: number;
    clienteId: string;
  }) {
    await oportunidadesApi.crearOportunidad({
      clienteId: data.clienteId,
      administradorId: esAdmin ? cliente!.id : administracion?.id ?? null,
      titulo: data.titulo,
      descripcion: data.descripcion,
      estado: "recibida",
      fecha: hoy,
      fechaVisita: null,
      presupuestoId: null,
      obraId: null,
      importeEstimado: data.importeEstimado || undefined,
    });
    setNuevaOportunidad(false);
    cargar();
  }

  async function cambiarEstadoOportunidad(o: Oportunidad, estado: EstadoOportunidad) {
    await oportunidadesApi.actualizarOportunidad(o.id, {
      estado,
      fechaVisita: estado === "visita" && !o.fechaVisita ? hoy : o.fechaVisita,
    });
    cargar();
  }
  async function eliminarOportunidad(o: Oportunidad) {
    if (!(await confirmar({ titulo: "Eliminar oportunidad", mensaje: `Se eliminará "${o.titulo}".` }))) return;
    await oportunidadesApi.eliminarOportunidad(o.id);
    cargar();
  }

  async function registrarInteraccion(tipo: TipoInteraccion, resumen: string) {
    await seguimientoApi.crearInteraccion({
      clienteId: cliente!.id,
      oportunidadId: null,
      tipo,
      fecha: new Date().toISOString(),
      resumen,
    });
    cargar();
  }
  async function eliminarInteraccion(i: Interaccion) {
    await seguimientoApi.eliminarInteraccion(i.id);
    cargar();
  }

  async function eliminarCliente() {
    if (!(await confirmar({ titulo: "Eliminar cliente", mensaje: `Se eliminará a ${cliente!.nombre} ${cliente!.apellidos}. Sus obras, gastos y facturas quedarán sin cliente asignado.` }))) return;
    await clientesApi.eliminarCliente(cliente!.id);
    navigate("/admin/clientes");
  }

  async function asignarObra(obraId: string) {
    await obrasApi.actualizarObra(obraId, { clienteId: cliente!.id });
    setAsignar(false);
    cargar();
  }
  async function desasignarObra(obraId: string) {
    await obrasApi.actualizarObra(obraId, { clienteId: null });
    cargar();
  }

  async function marcarPagada(f: Factura) {
    await facturasApi.actualizarFactura(f.id, {
      estado: "pagada",
      fechaPago: f.fechaPago ?? f.fecha,
    });
    cargar();
  }
  async function eliminarFactura(f: Factura) {
    if (!(await confirmar({ titulo: "Eliminar factura", mensaje: `Se eliminará la factura ${f.numero || ""}.`.trim() }))) return;
    await facturasApi.eliminarFactura(f.id);
    cargar();
  }

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div>
        <button
          onClick={() => navigate("/admin/clientes")}
          className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-forge-dark"
        >
          <IconChevronLeft className="h-4 w-4" /> Clientes
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-forge-dark">
              {cliente.nombre} {cliente.apellidos}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {[cliente.telefono, cliente.email].filter(Boolean).join(" · ") ||
                "Sin datos de contacto"}
            </p>
            {cliente.cif && (
              <p className="mt-0.5 text-sm text-slate-500">CIF/NIF: {cliente.cif}</p>
            )}
            {[cliente.direccion, cliente.cp, cliente.ciudad, cliente.poblacion].some(Boolean) && (
              <p className="mt-0.5 text-sm text-slate-500">
                {[cliente.direccion, [cliente.cp, cliente.ciudad].filter(Boolean).join(" "), cliente.poblacion]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {/* Ficha específica de administrador de fincas */}
            {esAdmin && [cliente.personaContacto, cliente.cargo, cliente.zona, cliente.web].some(Boolean) && (
              <p className="mt-0.5 text-sm text-slate-500">
                {[
                  [cliente.personaContacto, cliente.cargo].filter(Boolean).join(", "),
                  cliente.zona && `Zona: ${cliente.zona}`,
                  cliente.web,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {/* Comunidad → administración que la gestiona */}
            {esCom && administracion && (
              <button
                onClick={() => navigate(`/admin/clientes/${administracion.id}`)}
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-forge-orange hover:underline"
              >
                <IconBuilding className="h-4 w-4" />
                {administracion.nombreAdministracion || administracion.nombre}
              </button>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge color="slate">{labelTipo(cliente.tipo)}</Badge>
              {estadoInfo && <Badge color={estadoInfo.badge}>{estadoInfo.label}</Badge>}
              {cliente.dossierEnviado && <Badge color="blue">Dossier enviado</Badge>}
              <Badge color="slate">Captación: {labelCanal(cliente.canal)}</Badge>
              {cliente.canalDetalle && (
                <span className="text-xs text-slate-400">{cliente.canalDetalle}</span>
              )}
              {!cliente.activo && <Badge color="red">Inactivo</Badge>}
            </div>
            {/* Próxima acción / aviso de vencida */}
            {cliente.proximaAccion && (
              <div
                className={`mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                  accionVencida(cliente.fechaProximaAccion, hoy)
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                <IconPhone className="h-4 w-4" />
                <span>
                  Próxima acción: <b>{cliente.proximaAccion}</b>
                  {cliente.fechaProximaAccion && ` · ${fechaCompleta(cliente.fechaProximaAccion)}`}
                  {accionVencida(cliente.fechaProximaAccion, hoy) && " · VENCIDA"}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditar(true)} className="btn-ghost px-3 py-2 text-sm">
              <IconEdit className="h-4 w-4" /> Editar
            </button>
            <button
              onClick={() => setBorrar(true)}
              className="btn px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        </div>
        {cliente.notas && (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{cliente.notas}</p>
        )}
      </div>

      {/* KPIs financieros */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Facturado" valor={formatEuro(r.facturado)} />
        <Kpi label="Cobrado" valor={formatEuro(r.cobrado)} tono="verde" />
        <Kpi label="Pendiente de cobro" valor={formatEuro(r.pendiente)} tono="ambar" />
        <Kpi label="Gastos" valor={formatEuro(r.gastos)} />
        <Kpi
          label="Margen (real / previsto)"
          valor={formatEuro(r.margenReal)}
          sub={`Previsto ${formatEuro(r.margenPrevisto)}`}
          tono={r.margenReal >= 0 ? "verde" : "rojo"}
        />
      </div>

      {/* Comunidades asociadas (solo administrador de fincas) */}
      {esAdmin && (
        <Seccion
          titulo={`Comunidades asociadas${comunidades.length ? ` (${comunidades.length})` : ""}`}
          accion={
            <button onClick={() => setNuevaComunidad(true)} className="btn-ghost px-3 py-1.5 text-sm">
              <IconPlus className="h-4 w-4" /> Nueva comunidad
            </button>
          }
        >
          {comunidades.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Sin comunidades todavía. Añade las que gestiona esta administración.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {comunidades.map((c) => {
                const rc = resumenCliente(c.id, obras, gastos, facturas, compras);
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/admin/clientes/${c.id}`)}
                    className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50/50"
                  >
                    <IconBuilding className="h-5 w-5 shrink-0 text-slate-300" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-forge-dark">{c.nombre}</p>
                      <p className="text-xs text-slate-400">
                        {c.direccion || "—"} · {rc.numObras} obras · Facturado {formatEuro(rc.facturado)}
                      </p>
                    </div>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                );
              })}
            </div>
          )}
        </Seccion>
      )}

      {/* Oportunidades (contactos comerciales) */}
      {(cliente.tipo ?? "particular") !== "particular" && (
        <Seccion
          titulo={`Oportunidades${oportsCli.length ? ` (${oportsCli.length})` : ""}`}
          accion={
            <button onClick={() => setNuevaOportunidad(true)} className="btn-ghost px-3 py-1.5 text-sm">
              <IconPlus className="h-4 w-4" /> Nueva oportunidad
            </button>
          }
        >
          {oportsCli.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Sin oportunidades registradas.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {oportsCli.map((o) => {
                const info = infoEstadoOportunidad(o.estado);
                return (
                  <div key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                    <IconTarget className="h-5 w-5 shrink-0 text-slate-300" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-forge-dark">{o.titulo}</p>
                      <p className="text-xs text-slate-400">
                        {fechaCompleta(o.fecha)}
                        {esAdmin && o.clienteId !== cliente.id && ` · ${nombreCliente(o.clienteId)}`}
                        {o.importeEstimado ? ` · ${formatEuro(o.importeEstimado)}` : ""}
                      </p>
                    </div>
                    <select
                      className="field h-8 w-auto py-0.5 text-xs"
                      value={o.estado}
                      onChange={(e) => cambiarEstadoOportunidad(o, e.target.value as EstadoOportunidad)}
                    >
                      {ESTADOS_OPORTUNIDAD.map((e) => (
                        <option key={e.valor} value={e.valor}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                    <Badge color={info.badge}>{info.label}</Badge>
                    <button
                      onClick={() => eliminarOportunidad(o)}
                      className="rounded-lg p-2 text-slate-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Seccion>
      )}

      {/* Obras asociadas */}
      <Seccion
        titulo="Obras asociadas"
        accion={
          sinAsignar.length > 0 && (
            <button onClick={() => setAsignar(true)} className="btn-ghost px-3 py-1.5 text-sm">
              <IconPlus className="h-4 w-4" /> Asignar obra
            </button>
          )
        }
      >
        {obrasCli.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            Sin obras asociadas todavía.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {obrasCli.map((o) => {
              const ro = resumenObra(o, gastos, facturas, compras);
              return (
                <div key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-forge-dark">{o.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {o.direccion || "—"} · Presupuesto {formatEuro(o.presupuesto ?? 0)}
                    </p>
                  </div>
                  <div className="flex gap-4 text-right text-xs">
                    <div>
                      <p className="text-slate-400">Facturado</p>
                      <p className="font-semibold text-forge-dark">{formatEuro(ro.facturado)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Gastos</p>
                      <p className="font-semibold text-forge-dark">{formatEuro(ro.gastos)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Margen</p>
                      <p
                        className={`font-semibold ${
                          ro.margenReal >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {formatEuro(ro.margenReal)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => desasignarObra(o.id)}
                    className="rounded-lg p-2 text-slate-300 hover:bg-red-50 hover:text-red-500"
                    title="Quitar de este cliente"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Seccion>

      {/* Facturas */}
      <Seccion
        titulo="Facturas"
        accion={
          <button onClick={() => setNuevaFactura(true)} className="btn-ghost px-3 py-1.5 text-sm">
            <IconPlus className="h-4 w-4" /> Nueva factura
          </button>
        }
      >
        {facturasCli.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">Sin facturas emitidas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Nº</th>
                  <th className="py-2 pr-3 font-semibold">Fecha</th>
                  <th className="py-2 pr-3 font-semibold">Obra</th>
                  <th className="py-2 pr-3 text-right font-semibold">Total</th>
                  <th className="py-2 pr-3 font-semibold">Estado</th>
                  <th className="py-2 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturasCli.map((f) => {
                  const info = infoEstadoFactura(f.estado);
                  return (
                    <tr key={f.id}>
                      <td className="py-2 pr-3 font-medium text-forge-dark">{f.numero}</td>
                      <td className="py-2 pr-3 text-slate-500">{fechaCompleta(f.fecha)}</td>
                      <td className="py-2 pr-3 text-slate-500">{nombreObra(f.obraId)}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-forge-dark">
                        {formatEuro(f.total)}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge color={info.badge}>{info.label}</Badge>
                      </td>
                      <td className="py-2">
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
                            onClick={() => setFactura(f)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => eliminarFactura(f)}
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
        )}
      </Seccion>

      {/* Seguimiento comercial (timeline) */}
      {(cliente.tipo ?? "particular") !== "particular" && (
        <SeguimientoTimeline
          interacciones={interacciones}
          onRegistrar={registrarInteraccion}
          onEliminar={eliminarInteraccion}
        />
      )}

      {/* Documentos */}
      <DocumentosCliente
        clienteId={cliente.id}
        subidoPor={usuario?.id ?? null}
        documentos={docsCli}
        onCambio={cargar}
      />

      {/* Modales */}
      {editar && (
        <ClienteForm
          cliente={cliente}
          onClose={() => setEditar(false)}
          onSaved={() => {
            setEditar(false);
            cargar();
          }}
        />
      )}
      {nuevaComunidad && (
        <ClienteForm
          cliente={null}
          tipoInicial="comunidad"
          administradorFijo={cliente.id}
          onClose={() => setNuevaComunidad(false)}
          onSaved={() => {
            setNuevaComunidad(false);
            cargar();
          }}
        />
      )}
      {nuevaOportunidad && (
        <OportunidadForm
          esAdmin={esAdmin}
          comunidades={comunidades}
          clienteId={cliente.id}
          onClose={() => setNuevaOportunidad(false)}
          onSaved={nuevaOportunidadPara}
        />
      )}
      {(nuevaFactura || factura) && (
        <FacturaForm
          factura={factura}
          clienteIdFijo={cliente.id}
          clientes={[cliente]}
          obras={obrasCli}
          onClose={() => {
            setNuevaFactura(false);
            setFactura(null);
          }}
          onSaved={() => {
            setNuevaFactura(false);
            setFactura(null);
            cargar();
          }}
        />
      )}
      <Modal open={asignar} onClose={() => setAsignar(false)} title="Asignar obra existente">
        {sinAsignar.length === 0 ? (
          <p className="text-sm text-slate-500">No hay obras sin cliente.</p>
        ) : (
          <div className="space-y-2">
            {sinAsignar.map((o) => (
              <button
                key={o.id}
                onClick={() => asignarObra(o.id)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-forge-orange"
              >
                <div>
                  <p className="font-semibold text-forge-dark">{o.nombre}</p>
                  <p className="text-xs text-slate-400">{o.direccion || "—"}</p>
                </div>
                <IconPlus className="h-4 w-4 text-forge-orange" />
              </button>
            ))}
          </div>
        )}
      </Modal>
      <Modal open={borrar} onClose={() => setBorrar(false)} title="Eliminar cliente">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            ¿Seguro que quieres eliminar a <b>{cliente.nombre} {cliente.apellidos}</b>? Se
            desvincularán sus obras y gastos, y se borrarán sus facturas y documentos. No se puede
            deshacer.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setBorrar(false)} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button
              onClick={eliminarCliente}
              className="btn flex-1 bg-red-500 px-5 py-3 text-white hover:bg-red-600"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Kpi({
  label,
  valor,
  sub,
  tono,
}: {
  label: string;
  valor: string;
  sub?: string;
  tono?: "verde" | "rojo" | "ambar";
}) {
  const color =
    tono === "verde"
      ? "text-green-600"
      : tono === "rojo"
        ? "text-red-500"
        : tono === "ambar"
          ? "text-amber-600"
          : "text-forge-dark";
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${color}`}>{valor}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function Seccion({
  titulo,
  accion,
  children,
}: {
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-forge-dark">{titulo}</h3>
        {accion}
      </div>
      {children}
    </div>
  );
}

/** Timeline de seguimiento comercial + alta rápida de interacción. */
function SeguimientoTimeline({
  interacciones,
  onRegistrar,
  onEliminar,
}: {
  interacciones: Interaccion[];
  onRegistrar: (tipo: TipoInteraccion, resumen: string) => Promise<void>;
  onEliminar: (i: Interaccion) => void;
}) {
  const [tipo, setTipo] = useState<TipoInteraccion>("llamada");
  const [resumen, setResumen] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function registrar() {
    if (!resumen.trim() || guardando) return;
    setGuardando(true);
    try {
      await onRegistrar(tipo, resumen.trim());
      setResumen("");
      setTipo("llamada");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Seccion titulo="Seguimiento comercial">
      {/* Alta rápida */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-3">
        <div>
          <label className="label">Tipo</label>
          <select
            className="field mt-1 h-9 w-auto py-1 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoInteraccion)}
          >
            {TIPOS_INTERACCION.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[12rem] flex-1">
          <label className="label">Resumen</label>
          <input
            className="field mt-1 h-9 py-1 text-sm"
            placeholder="Qué se habló / se hizo…"
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && registrar()}
          />
        </div>
        <button onClick={registrar} disabled={guardando || !resumen.trim()} className="btn-primary h-9 px-4 py-1 text-sm">
          {guardando ? <Spinner className="h-4 w-4" /> : "Registrar"}
        </button>
      </div>

      {/* Historial */}
      {interacciones.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">Sin interacciones registradas.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {interacciones.map((i) => (
            <li key={i.id} className="flex items-start gap-3 border-l-2 border-slate-200 py-1 pl-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-forge-dark">
                  <span className="font-semibold">{labelInteraccion(i.tipo)}</span> — {i.resumen}
                </p>
                <p className="text-xs text-slate-400">{fechaHora(i.fecha)}</p>
              </div>
              <button
                onClick={() => onEliminar(i)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}

/** Alta rápida de oportunidad. Para una administración, permite elegir a qué
 * comunidad se asocia. */
function OportunidadForm({
  esAdmin,
  comunidades,
  clienteId,
  onClose,
  onSaved,
}: {
  esAdmin: boolean;
  comunidades: Cliente[];
  clienteId: string;
  onClose: () => void;
  onSaved: (data: {
    titulo: string;
    descripcion: string;
    importeEstimado: number;
    clienteId: string;
  }) => Promise<void>;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [importe, setImporte] = useState("");
  const [destino, setDestino] = useState(esAdmin && comunidades[0] ? comunidades[0].id : clienteId);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!titulo.trim()) return setError("Indica un título para la oportunidad.");
    setGuardando(true);
    setError(null);
    try {
      await onSaved({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        importeEstimado: importe ? Number(importe) : 0,
        clienteId: destino,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Nueva oportunidad">
      <div className="space-y-4">
        {esAdmin && comunidades.length > 0 && (
          <div>
            <label className="label">Comunidad</label>
            <select className="field mt-1.5" value={destino} onChange={(e) => setDestino(e.target.value)}>
              {comunidades.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Título *</label>
          <input
            className="field mt-1.5"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Reforma portal, impermeabilización cubierta…"
          />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea
            className="field mt-1.5"
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Importe estimado (€)</label>
          <input
            className="field mt-1.5"
            inputMode="decimal"
            value={importe}
            onChange={(e) => setImporte(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex-1">
            {guardando ? <Spinner className="h-5 w-5" /> : "Crear oportunidad"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const CATEGORIAS_DOC: { valor: CategoriaDocumento; label: string }[] = [
  { valor: "contrato", label: "Contrato" },
  { valor: "certificado", label: "Certificado" },
  { valor: "otro", label: "Otro" },
];

function DocumentosCliente({
  clienteId,
  subidoPor,
  documentos,
  onCambio,
}: {
  clienteId: string;
  subidoPor: string | null;
  documentos: Documento[];
  onCambio: () => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaDocumento>("contrato");

  async function subir(file: File) {
    setSubiendo(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      await documentosApi.subirDocumento({
        usuarioId: null,
        clienteId,
        nombre: file.name,
        categoria,
        path: dataUrl,
        mime: file.type || "application/octet-stream",
        subidoPor,
      });
      onCambio();
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <Seccion
      titulo="Documentos"
      accion={
        <div className="flex items-center gap-2">
          <select
            className="field h-9 py-1 text-sm"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
          >
            {CATEGORIAS_DOC.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
          <label className="btn-ghost cursor-pointer px-3 py-1.5 text-sm">
            {subiendo ? <Spinner className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />} Subir
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) subir(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      }
    >
      {documentos.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">Sin documentos.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {documentos.map((d) => (
            <div key={d.id} className="flex items-center gap-3 py-2.5">
              <IconFolder className="h-5 w-5 shrink-0 text-slate-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-forge-dark">{d.nombre}</p>
                <p className="text-xs capitalize text-slate-400">{d.categoria}</p>
              </div>
              <a
                href={d.path}
                download={d.nombre}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
              >
                <IconDownload className="h-4 w-4" />
              </a>
              <button
                onClick={async () => {
                  if (!(await confirmar({ titulo: "Eliminar documento", mensaje: `Se eliminará "${d.nombre}".` }))) return;
                  await documentosApi.eliminarDocumento(d.id);
                  onCambio();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Seccion>
  );
}
