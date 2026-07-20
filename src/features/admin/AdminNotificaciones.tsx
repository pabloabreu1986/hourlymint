import { useEffect, useState } from "react";
import { notificacionesApi, usuariosApi } from "@/services";
import type { Notificacion, Usuario } from "@/lib/types";
import { Cargando, EmptyState } from "@/components/ui";
import { hace } from "@/lib/format";
import { IconBell, IconClock, IconAlert, IconBox } from "@/components/icons";

const ICONO = {
  fichaje: IconClock,
  incidencia: IconAlert,
  material: IconBox,
  aviso: IconBell,
};

export default function AdminNotificaciones() {
  const [items, setItems] = useState<Notificacion[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  async function cargar() {
    setItems(await notificacionesApi.listNotificaciones());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  if (!items) return <Cargando />;

  const nombreDe = (id: string | null) =>
    id ? usuarios.find((u) => u.id === id)?.nombre ?? "—" : "Todos";

  async function abrir(n: Notificacion) {
    if (!n.leida) {
      await notificacionesApi.marcarLeida(n.id);
      cargar();
    }
  }

  async function marcarTodas() {
    await Promise.all(
      items!.filter((n) => !n.leida).map((n) => notificacionesApi.marcarLeida(n.id))
    );
    cargar();
  }

  const sinLeer = items.filter((n) => !n.leida).length;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {sinLeer > 0 ? `${sinLeer} sin leer` : "Todo leído"}
        </p>
        {sinLeer > 0 && (
          <button onClick={marcarTodas} className="text-sm font-semibold text-forge-orange">
            Marcar todas leídas
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<IconBell className="h-12 w-12" />} titulo="Sin notificaciones" />
      ) : (
        <div className="space-y-2">
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
                  <p className="mt-1 text-xs text-slate-400">
                    {nombreDe(n.trabajadorId)} · {hace(n.fecha)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
