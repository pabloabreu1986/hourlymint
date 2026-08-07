import { useEffect, useState } from "react";
import { obrasApi, usuariosApi } from "@/services";
import type { Obra, Usuario } from "@/lib/types";
import { Avatar, Cargando } from "@/components/ui";
import { IconSitemap } from "@/components/icons";

/**
 * Organigrama derivado de los datos reales: administración arriba,
 * debajo cada obra en curso con su encargado y su equipo, y al final
 * la gente sin obra asignada. No hay que mantener nada a mano.
 */
export default function AdminOrganigrama() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => {
    usuariosApi.listUsuarios().then(setUsuarios);
    obrasApi.listObras().then(setObras);
  }, []);

  if (!usuarios) return <Cargando />;

  const admins = usuarios.filter((u) => (u.rol === "admin" || u.rol === "directivo") && u.activo);
  const trabajadores = usuarios.filter((u) => u.rol === "trabajador" && u.activo);
  const activas = obras.filter((o) => o.estado !== "finalizada");
  const asignados = new Set(activas.flatMap((o) => [...o.trabajadorIds, o.encargadoId ?? ""]));
  const sinAsignar = trabajadores.filter((t) => !asignados.has(t.id));

  return (
    <div className="mx-auto max-w-4xl">
      {/* Dirección */}
      <div className="flex justify-center gap-4">
        {admins.map((a) => (
          <Tarjeta key={a.id} usuario={a} destacada />
        ))}
      </div>

      <div className="mx-auto my-2 h-6 w-px bg-slate-200" />

      {/* Equipos por obra */}
      <div className="grid gap-4 md:grid-cols-2">
        {activas.map((o) => {
          const encargado = trabajadores.find((t) => t.id === o.encargadoId);
          const equipo = trabajadores.filter(
            (t) => o.trabajadorIds.includes(t.id) && t.id !== o.encargadoId
          );
          return (
            <div key={o.id} className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: o.color }} />
                <p className="font-bold text-forge-dark">{o.nombre}</p>
              </div>
              {encargado ? (
                <div className="mb-2 rounded-xl bg-slate-50 p-2.5">
                  <Persona usuario={encargado} rol="Encargado" />
                </div>
              ) : (
                <p className="mb-2 text-xs text-slate-400">Sin encargado asignado</p>
              )}
              <div className="space-y-1.5 pl-4">
                {equipo.map((t) => (
                  <Persona key={t.id} usuario={t} />
                ))}
                {equipo.length === 0 && (
                  <p className="text-xs text-slate-400">Sin más equipo asignado</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sin obra */}
      {sinAsignar.length > 0 && (
        <div className="card mt-4 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <IconSitemap className="h-4 w-4" />
            <p className="text-sm font-semibold">Sin obra asignada hoy</p>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {sinAsignar.map((t) => (
              <Persona key={t.id} usuario={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tarjeta({ usuario, destacada }: { usuario: Usuario; destacada?: boolean }) {
  return (
    <div
      className={`card flex items-center gap-3 px-5 py-3 ${
        destacada ? "border-2 border-forge-orange/40" : ""
      }`}
    >
      <Avatar nombre={usuario.nombre} color={usuario.color} size={44} />
      <div>
        <p className="font-bold text-forge-dark">{usuario.nombre}</p>
        <p className="text-xs text-slate-400">{usuario.puesto ?? "Administración"}</p>
      </div>
    </div>
  );
}

function Persona({ usuario, rol }: { usuario: Usuario; rol?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar nombre={usuario.nombre} color={usuario.color} size={30} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-forge-dark">{usuario.nombre}</p>
        <p className="text-xs text-slate-400">{rol ?? usuario.puesto}</p>
      </div>
    </div>
  );
}
