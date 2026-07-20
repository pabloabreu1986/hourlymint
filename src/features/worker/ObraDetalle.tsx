import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { obrasApi, usuariosApi, partesApi } from "@/services";
import type { Obra, ParteDiario, Usuario } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import {
  Cargando,
  EmptyState,
  EstadoObraBadge,
  ProgressBar,
  Avatar,
  Badge,
} from "@/components/ui";
import { hoyISO } from "@/lib/seed";
import {
  IconClipboard,
  IconCheck,
  IconMapPin,
  IconObras,
  IconChevronRight,
} from "@/components/icons";

export default function ObraDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [obra, setObra] = useState<Obra | null>(null);
  const [equipo, setEquipo] = useState<Usuario[]>([]);
  const [parte, setParte] = useState<ParteDiario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [o, us] = await Promise.all([obrasApi.getObra(id), usuariosApi.listUsuarios()]);
      setObra(o);
      if (o) {
        setEquipo(us.filter((u) => o.trabajadorIds.includes(u.id)));
        const partes = await partesApi.partesDeObra(o.id);
        setParte(partes.find((p) => p.fecha === hoyISO()) ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <Cargando />;
  if (!obra)
    return (
      <>
        <WorkerHeader title="Obra" />
        <EmptyState titulo="Obra no encontrada" />
      </>
    );

  const esEncargado = obra.encargadoId === usuario?.id;
  const encargado = equipo.find((u) => u.id === obra.encargadoId);
  const parteCerrado = parte?.estado === "cerrado";

  return (
    <div>
      <WorkerHeader title={obra.nombre} subtitle={obra.direccion} />

      {/* Cabecera de obra */}
      <div className="p-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <span
              className="grid h-12 w-12 place-items-center rounded-xl text-white"
              style={{ background: obra.color }}
            >
              <IconObras className="h-6 w-6" />
            </span>
            <EstadoObraBadge estado={obra.estado} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-forge-dark">{obra.nombre}</h2>
          <p className="flex items-center gap-1 text-sm text-slate-400">
            <IconMapPin className="h-4 w-4" /> {obra.direccion}
          </p>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-500">Avance de obra</span>
              <span className="font-bold text-forge-dark">{obra.avance}%</span>
            </div>
            <ProgressBar value={obra.avance} />
          </div>
        </div>
      </div>

      {/* Equipo */}
      <div className="px-4">
        <div className="card p-5">
          <p className="label mb-3">Equipo de hoy</p>
          {encargado && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-orange-50 p-3">
              <Avatar nombre={encargado.nombre} color={encargado.color} size={36} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-forge-dark">{encargado.nombre}</p>
                <p className="text-xs text-slate-400">{encargado.puesto}</p>
              </div>
              <Badge color="orange">ENCARGADO</Badge>
            </div>
          )}
          <div className="space-y-2">
            {equipo
              .filter((u) => u.id !== obra.encargadoId)
              .map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar nombre={u.nombre} color={u.color} size={32} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-forge-dark">{u.nombre}</p>
                    <p className="text-xs text-slate-400">{u.puesto}</p>
                  </div>
                </div>
              ))}
            {equipo.length === 0 && (
              <p className="text-sm text-slate-400">Sin trabajadores asignados.</p>
            )}
          </div>
        </div>
      </div>

      {/* Acciones parte */}
      <div className="space-y-3 p-4">
        <button
          onClick={() => navigate(`/obras/${obra.id}/parte`)}
          className="card flex w-full items-center gap-3 p-4 text-left transition active:scale-[.99]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-forge-orange/10 text-forge-orange">
            <IconClipboard className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-forge-dark">Parte diario</p>
            <p className="text-xs text-slate-400">
              {parte
                ? parteCerrado
                  ? "Parte cerrado hoy"
                  : "Borrador en curso · toca para continuar"
                : "Registrar trabajo, fotos y material"}
            </p>
          </div>
          {parteCerrado ? (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-green-100 text-green-600">
              <IconCheck className="h-4 w-4" />
            </span>
          ) : (
            <IconChevronRight className="h-5 w-5 text-slate-300" />
          )}
        </button>

        {esEncargado && (
          <button
            onClick={() => navigate(`/obras/${obra.id}/cierre`)}
            className="btn-dark w-full"
            disabled={parteCerrado}
          >
            {parteCerrado ? "Parte cerrado" : "Cerrar parte del día"}
          </button>
        )}
      </div>
    </div>
  );
}
