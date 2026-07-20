import { useEffect, useState } from "react";
import { incidenciasApi, obrasApi, usuariosApi } from "@/services";
import type { EstadoIncidencia, Incidencia, Obra, Usuario } from "@/lib/types";
import { Badge, Cargando, EmptyState } from "@/components/ui";
import { fechaHora } from "@/lib/format";
import { IconAlert } from "@/components/icons";

const ESTADOS: { value: EstadoIncidencia; label: string; color: "orange" | "amber" | "green" }[] = [
  { value: "nueva", label: "Nueva", color: "orange" },
  { value: "en_proceso", label: "En proceso", color: "amber" },
  { value: "resuelta", label: "Resuelta", color: "green" },
];

export default function AdminIncidencias() {
  const [items, setItems] = useState<Incidencia[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState<EstadoIncidencia | "todas">("todas");

  async function cargar() {
    setItems(await incidenciasApi.listIncidencias());
  }
  useEffect(() => {
    cargar();
    obrasApi.listObras().then(setObras);
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  if (!items) return <Cargando />;

  const obraDe = (id: string) => obras.find((o) => o.id === id)?.nombre ?? "—";
  const usuarioDe = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre ?? "—";
  const visibles = filtro === "todas" ? items : items.filter((i) => i.estado === filtro);

  async function cambiarEstado(id: string, estado: EstadoIncidencia) {
    await incidenciasApi.actualizarIncidencia(id, { estado });
    cargar();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {(["todas", ...ESTADOS.map((e) => e.value)] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filtro === f ? "bg-forge-dark text-white" : "bg-white text-slate-500 hover:bg-slate-100"
            }`}
          >
            {f === "todas" ? "Todas" : ESTADOS.find((e) => e.value === f)?.label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EmptyState icon={<IconAlert className="h-12 w-12" />} titulo="Sin incidencias" />
      ) : (
        <div className="space-y-3">
          {visibles.map((i) => {
            const badge = ESTADOS.find((e) => e.value === i.estado)!;
            return (
              <div key={i.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
                  <IconAlert className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-forge-dark">{i.titulo}</p>
                    <Badge color={badge.color}>{badge.label.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{i.descripcion}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {obraDe(i.obraId)} · {usuarioDe(i.trabajadorId)} · {fechaHora(i.fecha)}
                  </p>
                </div>
                <select
                  value={i.estado}
                  onChange={(e) => cambiarEstado(i.id, e.target.value as EstadoIncidencia)}
                  className="field w-full sm:w-40"
                >
                  {ESTADOS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
