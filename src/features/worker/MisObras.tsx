import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { obrasApi, usuariosApi } from "@/services";
import type { Obra, Usuario } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Cargando, EmptyState, EstadoObraBadge, Badge } from "@/components/ui";
import { fechaLarga } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { IconObras, IconChevronRight, IconMapPin } from "@/components/icons";

export default function MisObras() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    if (!usuario) return;
    obrasApi.listObrasDeTrabajador(usuario.id).then(setObras);
    usuariosApi.listUsuarios().then(setUsuarios);
  }, [usuario]);

  const nombreDe = (id: string | null) =>
    usuarios.find((u) => u.id === id)?.nombre ?? "Sin asignar";

  return (
    <div>
      <WorkerHeader title="Mis obras" subtitle={fechaLarga(hoyISO())} back={false} />

      {!obras ? (
        <Cargando />
      ) : obras.length === 0 ? (
        <EmptyState
          icon={<IconObras className="h-12 w-12" />}
          titulo="Sin obras asignadas"
          texto="Hoy no tienes ninguna obra asignada."
        />
      ) : (
        <div className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hoy</p>
          {obras.map((o) => {
            const esEncargado = o.encargadoId === usuario?.id;
            return (
              <button
                key={o.id}
                onClick={() => navigate(`/obras/${o.id}`)}
                className="card flex w-full items-center gap-3 p-4 text-left transition active:scale-[.99]"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                  style={{ background: o.color }}
                >
                  <IconObras className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-forge-dark">{o.nombre}</p>
                    {esEncargado && <Badge color="orange">ENCARGADO</Badge>}
                  </div>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                    <IconMapPin className="h-3.5 w-3.5" /> {o.direccion}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Encargado: {nombreDe(o.encargadoId)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <EstadoObraBadge estado={o.estado} />
                  <IconChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
