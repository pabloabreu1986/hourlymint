import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientesApi, oportunidadesApi } from "@/services";
import {
  ESTADOS_OPORTUNIDAD,
  infoEstadoOportunidad,
  esComunidad,
} from "@/lib/fincas";
import { hoyISO } from "@/lib/seed";
import { formatEuro, fechaCompleta } from "@/lib/format";
import { confirmar } from "@/components/confirm";
import { Badge, Cargando, Modal, Spinner } from "@/components/ui";
import { IconPlus, IconTarget, IconTrash } from "@/components/icons";
import type { Cliente, EstadoOportunidad, Oportunidad } from "@/lib/types";

export default function AdminOportunidades() {
  const navigate = useNavigate();
  const [oportunidades, setOportunidades] = useState<Oportunidad[] | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [estado, setEstado] = useState<EstadoOportunidad | "">("");
  const [nuevo, setNuevo] = useState(false);

  async function cargar() {
    const [ops, cs] = await Promise.all([
      oportunidadesApi.listOportunidades(),
      clientesApi.listClientes(),
    ]);
    setOportunidades(ops);
    setClientes(cs);
  }
  useEffect(() => {
    cargar();
  }, []);

  const comunidades = useMemo(() => clientes.filter(esComunidad), [clientes]);
  const nombre = (cid: string) => clientes.find((c) => c.id === cid)?.nombre ?? "—";
  const admin = (o: Oportunidad) =>
    o.administradorId ? clientes.find((c) => c.id === o.administradorId)?.nombreAdministracion ??
      clientes.find((c) => c.id === o.administradorId)?.nombre ?? "" : "";

  const filtradas = useMemo(
    () => (oportunidades ?? []).filter((o) => (estado ? o.estado === estado : true)),
    [oportunidades, estado]
  );

  async function cambiarEstado(o: Oportunidad, e: EstadoOportunidad) {
    await oportunidadesApi.actualizarOportunidad(o.id, {
      estado: e,
      fechaVisita: e === "visita" && !o.fechaVisita ? hoyISO() : o.fechaVisita,
    });
    cargar();
  }
  async function eliminar(o: Oportunidad) {
    if (!(await confirmar({ titulo: "Eliminar oportunidad", mensaje: `Se eliminará "${o.titulo}".` }))) return;
    await oportunidadesApi.eliminarOportunidad(o.id);
    cargar();
  }

  if (!oportunidades) return <Cargando />;

  const conteos = ESTADOS_OPORTUNIDAD.map((e) => ({
    ...e,
    n: oportunidades.filter((o) => o.estado === e.valor).length,
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setEstado("")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              estado === "" ? "bg-forge-dark text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            Todas ({oportunidades.length})
          </button>
          {conteos.map((e) => (
            <button
              key={e.valor}
              onClick={() => setEstado(e.valor)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                estado === e.valor ? "bg-forge-dark text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {e.label} ({e.n})
            </button>
          ))}
        </div>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nueva oportunidad
        </button>
      </div>

      {filtradas.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <IconTarget className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            {oportunidades.length === 0
              ? "Sin oportunidades. Créalas desde una comunidad o aquí."
              : "Sin oportunidades en este estado."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Oportunidad</th>
                  <th className="px-4 py-3 font-semibold">Comunidad</th>
                  <th className="px-4 py-3 font-semibold">Administración</th>
                  <th className="px-4 py-3 text-right font-semibold">Importe</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((o) => {
                  const info = infoEstadoOportunidad(o.estado);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-forge-dark">{o.titulo}</td>
                      <td
                        className="cursor-pointer px-4 py-3 text-forge-orange hover:underline"
                        onClick={() => navigate(`/admin/clientes/${o.clienteId}`)}
                      >
                        {nombre(o.clienteId)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{admin(o) || "—"}</td>
                      <td className="px-4 py-3 text-right text-forge-dark">
                        {o.importeEstimado ? formatEuro(o.importeEstimado) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{fechaCompleta(o.fecha)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            className="field h-8 w-auto py-0.5 text-xs"
                            value={o.estado}
                            onChange={(e) => cambiarEstado(o, e.target.value as EstadoOportunidad)}
                          >
                            {ESTADOS_OPORTUNIDAD.map((e) => (
                              <option key={e.valor} value={e.valor}>
                                {e.label}
                              </option>
                            ))}
                          </select>
                          <Badge color={info.badge}>{info.label}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => eliminar(o)}
                          className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nuevo && (
        <NuevaOportunidad
          comunidades={comunidades}
          onClose={() => setNuevo(false)}
          onSaved={async (data) => {
            const com = comunidades.find((c) => c.id === data.clienteId);
            await oportunidadesApi.crearOportunidad({
              clienteId: data.clienteId,
              administradorId: com?.administradorId ?? null,
              titulo: data.titulo,
              descripcion: data.descripcion,
              estado: "recibida",
              fecha: hoyISO(),
              fechaVisita: null,
              presupuestoId: null,
              obraId: null,
              importeEstimado: data.importeEstimado || undefined,
            });
            setNuevo(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}

function NuevaOportunidad({
  comunidades,
  onClose,
  onSaved,
}: {
  comunidades: Cliente[];
  onClose: () => void;
  onSaved: (data: {
    clienteId: string;
    titulo: string;
    descripcion: string;
    importeEstimado: number;
  }) => Promise<void>;
}) {
  const [clienteId, setClienteId] = useState(comunidades[0]?.id ?? "");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [importe, setImporte] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!clienteId) return setError("Selecciona la comunidad.");
    if (!titulo.trim()) return setError("Indica un título.");
    setGuardando(true);
    setError(null);
    try {
      await onSaved({
        clienteId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        importeEstimado: importe ? Number(importe) : 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Nueva oportunidad">
      <div className="space-y-4">
        {comunidades.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay comunidades. Crea primero una comunidad (Clientes → Nuevo contacto → Comunidad).
          </p>
        ) : (
          <>
            <div>
              <label className="label">Comunidad *</label>
              <select className="field mt-1.5" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                {comunidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Título *</label>
              <input
                className="field mt-1.5"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Reforma portal, impermeabilización…"
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
          </>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || comunidades.length === 0}
            className="btn-primary flex-1"
          >
            {guardando ? <Spinner className="h-5 w-5" /> : "Crear"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
