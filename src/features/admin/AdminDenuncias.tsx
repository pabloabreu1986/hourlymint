import { useEffect, useState } from "react";
import { comunicadosApi, usuariosApi } from "@/services";
import type { CategoriaDenuncia, Denuncia, EstadoDenuncia, Usuario } from "@/lib/types";
import { Badge, Cargando, EmptyState } from "@/components/ui";
import { fechaHora } from "@/lib/format";
import { IconShield } from "@/components/icons";

export const ETIQUETA_CATEGORIA_DENUNCIA: Record<CategoriaDenuncia, string> = {
  acoso: "Acoso",
  seguridad: "Seguridad",
  fraude: "Fraude",
  otro: "Otro",
};

const ESTADOS: { value: EstadoDenuncia; label: string; color: "orange" | "amber" | "green" }[] = [
  { value: "nueva", label: "Nueva", color: "orange" },
  { value: "en_revision", label: "En revisión", color: "amber" },
  { value: "cerrada", label: "Cerrada", color: "green" },
];

export default function AdminDenuncias() {
  const [items, setItems] = useState<Denuncia[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState<EstadoDenuncia | "todas">("todas");

  async function cargar() {
    setItems(await comunicadosApi.listDenuncias());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  if (!items) return <Cargando />;

  const usuarioDe = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre;
  const visibles = filtro === "todas" ? items : items.filter((d) => d.estado === filtro);

  async function cambiarEstado(id: string, estado: EstadoDenuncia) {
    await comunicadosApi.cambiarEstadoDenuncia(id, estado);
    cargar();
  }

  return (
    <div>
      <div className="card mb-5 flex items-start gap-3 border-l-4 border-forge-orange p-4">
        <IconShield className="mt-0.5 h-5 w-5 shrink-0 text-forge-orange" />
        <p className="text-sm text-slate-500">
          Canal confidencial. Las denuncias enviadas como <strong>anónimas</strong> no guardan
          ningún dato de quién las envía — ni siquiera el administrador puede verlo.
        </p>
      </div>

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
        <EmptyState
          icon={<IconShield className="h-12 w-12" />}
          titulo="Sin denuncias"
          texto="Las comunicaciones del canal ético aparecerán aquí."
        />
      ) : (
        <div className="space-y-3">
          {visibles.map((d) => {
            const badge = ESTADOS.find((e) => e.value === d.estado)!;
            return (
              <div key={d.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-forge-dark">
                  <IconShield className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge color="slate">
                      {ETIQUETA_CATEGORIA_DENUNCIA[d.categoria].toUpperCase()}
                    </Badge>
                    <Badge color={badge.color}>{badge.label.toUpperCase()}</Badge>
                    {d.anonima ? (
                      <Badge color="violet">ANÓNIMA</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {usuarioDe(d.trabajadorId) ?? "—"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{d.descripcion}</p>
                  <p className="mt-1 text-xs text-slate-400">{fechaHora(d.fecha)}</p>
                </div>
                <select
                  value={d.estado}
                  onChange={(e) => cambiarEstado(d.id, e.target.value as EstadoDenuncia)}
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
