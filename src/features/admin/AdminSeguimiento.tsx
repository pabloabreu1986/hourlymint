import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientesApi } from "@/services";
import { accionVencida, infoEstadoComercial, labelTipo } from "@/lib/fincas";
import { hoyISO } from "@/lib/seed";
import { fechaCompleta } from "@/lib/format";
import { Badge, Cargando } from "@/components/ui";
import { IconPhone } from "@/components/icons";
import type { Cliente } from "@/lib/types";

export default function AdminSeguimiento() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [soloVencidas, setSoloVencidas] = useState(false);

  useEffect(() => {
    clientesApi.listClientes().then(setClientes);
  }, []);

  const hoy = hoyISO();

  const filas = useMemo(() => {
    if (!clientes) return [];
    return clientes
      .filter((c) => (c.tipo ?? "particular") !== "particular")
      .filter((c) => !!c.proximaAccion || !!c.fechaProximaAccion)
      .filter((c) => (soloVencidas ? accionVencida(c.fechaProximaAccion, hoy) : true))
      .sort((a, b) => (a.fechaProximaAccion ?? "9999").localeCompare(b.fechaProximaAccion ?? "9999"));
  }, [clientes, soloVencidas, hoy]);

  if (!clientes) return <Cargando />;

  const vencidas = clientes.filter((c) => accionVencida(c.fechaProximaAccion, hoy)).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          {filas.length} {filas.length === 1 ? "acción pendiente" : "acciones pendientes"}
          {vencidas > 0 && <span className="ml-2 font-semibold text-red-600">· {vencidas} vencidas</span>}
        </p>
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={soloVencidas} onChange={(e) => setSoloVencidas(e.target.checked)} />
          Solo vencidas
        </label>
      </div>

      {filas.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <IconPhone className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            Sin próximas acciones. Añade una desde la ficha de cada contacto.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {filas.map((c) => {
            const vencida = accionVencida(c.fechaProximaAccion, hoy);
            const est = c.estadoComercial ? infoEstadoComercial(c.estadoComercial) : null;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/admin/clientes/${c.id}`)}
                className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-slate-50/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-forge-dark">
                      {c.nombreAdministracion || `${c.nombre} ${c.apellidos}`.trim()}
                    </p>
                    <Badge color="slate">{labelTipo(c.tipo)}</Badge>
                    {est && <Badge color={est.badge}>{est.label}</Badge>}
                  </div>
                  {c.proximaAccion && (
                    <p className="mt-0.5 text-sm text-slate-500">{c.proximaAccion}</p>
                  )}
                </div>
                <div className="text-right">
                  {c.fechaProximaAccion && (
                    <p className={`text-sm font-semibold ${vencida ? "text-red-600" : "text-forge-dark"}`}>
                      {fechaCompleta(c.fechaProximaAccion)}
                    </p>
                  )}
                  {vencida && <Badge color="red">Vencida</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
