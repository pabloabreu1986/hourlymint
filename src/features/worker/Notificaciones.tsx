import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { notificacionesApi } from "@/services";
import type { Notificacion } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Cargando, EmptyState } from "@/components/ui";
import { confirmar } from "@/components/confirm";
import { hace } from "@/lib/format";
import { IconBell, IconClock, IconAlert, IconBox } from "@/components/icons";

const ICONO = {
  fichaje: IconClock,
  incidencia: IconAlert,
  material: IconBox,
  aviso: IconBell,
};

export default function Notificaciones() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Notificacion[] | null>(null);

  async function cargar() {
    if (!usuario) return;
    setItems(await notificacionesApi.notificacionesDe(usuario.id));
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  async function marcarTodas() {
    if (!usuario) return;
    await notificacionesApi.marcarTodasLeidas(usuario.id);
    cargar();
  }

  async function borrarTodas() {
    if (!usuario) return;
    if (
      !(await confirmar({
        titulo: "Borrar notificaciones",
        mensaje: "Se eliminarán tus notificaciones. Esta acción no se puede deshacer.",
        confirmar: "Borrar",
        peligro: true,
      }))
    )
      return;
    await notificacionesApi.eliminarTodasDe(usuario.id);
    cargar();
  }

  async function abrir(n: Notificacion) {
    if (!n.leida) {
      await notificacionesApi.marcarLeida(n.id);
      cargar();
    }
  }

  return (
    <div>
      <WorkerHeader
        title="Notificaciones"
        back={false}
        action={
          <div className="flex items-center gap-4">
            <button onClick={marcarTodas} className="text-sm font-semibold text-forge-orange">
              Marcar leídas
            </button>
            {items && items.length > 0 && (
              <button onClick={borrarTodas} className="text-sm font-semibold text-red-500">
                Borrar
              </button>
            )}
          </div>
        }
      />

      {!items ? (
        <Cargando />
      ) : items.length === 0 ? (
        <EmptyState icon={<IconBell className="h-12 w-12" />} titulo="Sin notificaciones" />
      ) : (
        <div className="space-y-2 p-4">
          {items.map((n) => {
            const Icon = ICONO[n.tipo];
            return (
              <button
                key={n.id}
                onClick={() => abrir(n)}
                className={`card flex w-full items-start gap-3 p-4 text-left transition ${
                  n.leida ? "opacity-70" : ""
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forge-orange/10 text-forge-orange">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-forge-dark">{n.titulo}</p>
                    {!n.leida && <span className="h-2 w-2 rounded-full bg-forge-orange" />}
                  </div>
                  <p className="text-sm text-slate-500">{n.mensaje}</p>
                  <p className="mt-1 text-xs text-slate-400">{hace(n.fecha)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
