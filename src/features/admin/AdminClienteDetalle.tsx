import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  clientesApi,
  obrasApi,
  gastosApi,
  facturasApi,
  documentosApi,
  comprasApi,
} from "@/services";
import { useAuth } from "@/context/AuthContext";
import {
  infoEstadoFactura,
  labelCanal,
  resumenCliente,
  resumenObra,
} from "@/lib/finanzas";
import { formatEuro, fechaCompleta } from "@/lib/format";
import { Badge, Cargando, Modal, Spinner } from "@/components/ui";
import {
  IconChevronLeft,
  IconEdit,
  IconTrash,
  IconPlus,
  IconDownload,
  IconFolder,
} from "@/components/icons";
import ClienteForm from "./ClienteForm";
import FacturaForm from "./FacturaForm";
import type {
  CategoriaDocumento,
  Cliente,
  Documento,
  Factura,
  FacturaProveedor,
  Gasto,
  Obra,
} from "@/lib/types";

export default function AdminClienteDetalle() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [compras, setCompras] = useState<FacturaProveedor[]>([]);
  const [cargando, setCargando] = useState(true);

  const [editar, setEditar] = useState(false);
  const [borrar, setBorrar] = useState(false);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [nuevaFactura, setNuevaFactura] = useState(false);
  const [asignar, setAsignar] = useState(false);

  async function cargar() {
    const [c, o, g, f, d, cm] = await Promise.all([
      clientesApi.getCliente(id),
      obrasApi.listObras(),
      gastosApi.listGastos(),
      facturasApi.listFacturas(),
      documentosApi.listDocumentos(),
      comprasApi.listCompras(),
    ]);
    setCliente(c);
    setObras(o);
    setGastos(g);
    setFacturas(f);
    setDocumentos(d);
    setCompras(cm);
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

  async function eliminarCliente() {
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
              {[cliente.telefono, cliente.email, cliente.direccion].filter(Boolean).join(" · ") ||
                "Sin datos de contacto"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge color="slate">Captación: {labelCanal(cliente.canal)}</Badge>
              {cliente.canalDetalle && (
                <span className="text-xs text-slate-400">{cliente.canalDetalle}</span>
              )}
              {!cliente.activo && <Badge color="red">Inactivo</Badge>}
            </div>
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
