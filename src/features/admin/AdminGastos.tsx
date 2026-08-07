import { useEffect, useState } from "react";
import { gastosApi, obrasApi, usuariosApi, clientesApi } from "@/services";
import type { CategoriaGasto, Cliente, EstadoGasto, Gasto, Obra, Usuario } from "@/lib/types";
import { Avatar, Badge, Cargando, EmptyState, Modal } from "@/components/ui";
import { fechaCompleta } from "@/lib/format";
import { IconEuro } from "@/components/icons";

export const ETIQUETA_CATEGORIA_GASTO: Record<CategoriaGasto, string> = {
  dietas: "Dietas",
  transporte: "Transporte",
  material: "Material",
  alojamiento: "Alojamiento",
  otro: "Otro",
};

const ESTADOS: { value: EstadoGasto; label: string; color: "amber" | "green" | "red" | "blue" }[] = [
  { value: "pendiente", label: "Pendiente", color: "amber" },
  { value: "aprobado", label: "Aprobado", color: "green" },
  { value: "rechazado", label: "Rechazado", color: "red" },
  { value: "pagado", label: "Pagado", color: "blue" },
];

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function AdminGastos() {
  const [items, setItems] = useState<Gasto[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState<EstadoGasto | "todos">("todos");
  const [justificante, setJustificante] = useState<Gasto | null>(null);

  async function cargar() {
    setItems(await gastosApi.listGastos());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
    obrasApi.listObras().then(setObras);
    clientesApi.listClientes().then(setClientes);
  }, []);

  if (!items) return <Cargando />;

  const usuarioDe = (id: string) => usuarios.find((u) => u.id === id);
  const obraDe = (id: string | null) => obras.find((o) => o.id === id)?.nombre ?? "—";
  // Cliente imputado: el explícito del gasto o, si no, el de su obra.
  const clienteDeGasto = (g: Gasto): string =>
    g.clienteId ?? obras.find((o) => o.id === g.obraId)?.clienteId ?? "";
  const nombreCliente = (cid: string) => {
    const c = clientes.find((x) => x.id === cid);
    return c ? `${c.nombre} ${c.apellidos}`.trim() : null;
  };

  async function asignarCliente(id: string, clienteId: string) {
    await gastosApi.actualizarGasto(id, { clienteId: clienteId || null });
    cargar();
  }
  const visibles = filtro === "todos" ? items : items.filter((g) => g.estado === filtro);

  const totalPendiente = items
    .filter((g) => g.estado === "pendiente")
    .reduce((s, g) => s + g.importe, 0);
  const totalAprobado = items
    .filter((g) => g.estado === "aprobado")
    .reduce((s, g) => s + g.importe, 0);
  const totalMes = items
    .filter((g) => g.fecha.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((s, g) => s + g.importe, 0);

  async function cambiarEstado(id: string, estado: EstadoGasto) {
    await gastosApi.cambiarEstadoGasto(id, estado);
    cargar();
  }

  return (
    <div>
      {/* Totales */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Kpi titulo="Pendiente de aprobar" valor={eur(totalPendiente)} acento />
        <Kpi titulo="Aprobado (por pagar)" valor={eur(totalAprobado)} />
        <Kpi titulo="Presentado este mes" valor={eur(totalMes)} />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(["todos", ...ESTADOS.map((e) => e.value)] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filtro === f ? "bg-forge-dark text-white" : "bg-white text-slate-500 hover:bg-slate-100"
            }`}
          >
            {f === "todos" ? "Todos" : ESTADOS.find((e) => e.value === f)?.label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon={<IconEuro className="h-12 w-12" />}
          titulo="Sin gastos"
          texto="Los gastos que presente tu equipo desde la app aparecerán aquí."
        />
      ) : (
        <div className="space-y-3">
          {visibles.map((g) => {
            const u = usuarioDe(g.trabajadorId);
            const badge = ESTADOS.find((e) => e.value === g.estado)!;
            return (
              <div key={g.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Avatar nombre={u?.nombre ?? "?"} color={u?.color} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-forge-dark">{g.concepto}</p>
                    <Badge color={badge.color}>{badge.label.toUpperCase()}</Badge>
                    <Badge color="slate">
                      {ETIQUETA_CATEGORIA_GASTO[g.categoria].toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {u?.nombre ?? "—"} · {obraDe(g.obraId)} · {fechaCompleta(g.fecha)}
                    {nombreCliente(clienteDeGasto(g)) && (
                      <> · Cliente: {nombreCliente(clienteDeGasto(g))}</>
                    )}
                  </p>
                  {g.justificante && (
                    <button
                      onClick={() => setJustificante(g)}
                      className="mt-1 text-xs font-semibold text-forge-orange hover:underline"
                    >
                      Ver justificante
                    </button>
                  )}
                </div>
                <p className="text-xl font-extrabold text-forge-dark">{eur(g.importe)}</p>
                <div className="flex w-full flex-col gap-2 sm:w-44">
                  <select
                    value={g.estado}
                    onChange={(e) => cambiarEstado(g.id, e.target.value as EstadoGasto)}
                    className="field"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={g.clienteId ?? ""}
                    onChange={(e) => asignarCliente(g.id, e.target.value)}
                    className="field text-sm"
                    title="Imputar a un cliente"
                  >
                    <option value="">
                      {clienteDeGasto(g) && !g.clienteId
                        ? `Cliente (de la obra)`
                        : "Sin cliente"}
                    </option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!justificante}
        onClose={() => setJustificante(null)}
        title="Justificante"
        maxWidth="max-w-2xl"
      >
        {justificante?.justificante && (
          <img
            src={justificante.justificante}
            alt="Justificante del gasto"
            className="mx-auto max-h-[70vh] rounded-xl"
          />
        )}
      </Modal>
    </div>
  );
}

function Kpi({ titulo, valor, acento }: { titulo: string; valor: string; acento?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className={`mt-1 text-2xl font-extrabold ${acento ? "text-forge-orange" : "text-forge-dark"}`}>
        {valor}
      </p>
    </div>
  );
}
