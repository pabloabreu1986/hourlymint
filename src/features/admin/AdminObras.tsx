import { useEffect, useState } from "react";
import { obrasApi, usuariosApi } from "@/services";
import type { EstadoObra, Obra, Usuario } from "@/lib/types";
import {
  Avatar,
  Cargando,
  EstadoObraBadge,
  Modal,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { IconPlus, IconEdit, IconTrash, IconObras, IconMapPin } from "@/components/icons";

export default function AdminObras() {
  const [obras, setObras] = useState<Obra[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editar, setEditar] = useState<Obra | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [borrar, setBorrar] = useState<Obra | null>(null);

  async function cargar() {
    const [os, us] = await Promise.all([obrasApi.listObras(), usuariosApi.listTrabajadores()]);
    setObras(os);
    setUsuarios(us);
  }
  useEffect(() => {
    cargar();
  }, []);

  if (!obras) return <Cargando />;
  const nombreDe = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre ?? "Sin asignar";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">{obras.length} obras</p>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nueva obra
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {obras.map((o) => (
          <div key={o.id} className="card p-5">
            <div className="flex items-start justify-between">
              <span
                className="grid h-11 w-11 place-items-center rounded-xl text-white"
                style={{ background: o.color }}
              >
                <IconObras className="h-6 w-6" />
              </span>
              <EstadoObraBadge estado={o.estado} />
            </div>
            <h3 className="mt-3 font-bold text-forge-dark">{o.nombre}</h3>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <IconMapPin className="h-3.5 w-3.5" /> {o.direccion}
            </p>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-400">Avance</span>
                <span className="font-semibold text-forge-dark">{o.avance}%</span>
              </div>
              <ProgressBar value={o.avance} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs">
                <p className="text-slate-400">Encargado</p>
                <p className="font-semibold text-forge-dark">{nombreDe(o.encargadoId)}</p>
              </div>
              <div className="flex -space-x-2">
                {o.trabajadorIds.slice(0, 4).map((id) => {
                  const u = usuarios.find((x) => x.id === id);
                  return u ? (
                    <span key={id} className="ring-2 ring-white rounded-full">
                      <Avatar nombre={u.nombre} color={u.color} size={26} />
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditar(o)} className="btn-ghost flex-1 px-3 py-2 text-sm">
                <IconEdit className="h-4 w-4" /> Editar
              </button>
              <button
                onClick={() => setBorrar(o)}
                className="btn border border-slate-200 bg-white px-3 py-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(nuevo || editar) && (
        <ObraForm
          obra={editar}
          trabajadores={usuarios}
          onClose={() => {
            setNuevo(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNuevo(false);
            setEditar(null);
            cargar();
          }}
        />
      )}

      <Modal open={!!borrar} onClose={() => setBorrar(null)} title="Eliminar obra">
        {borrar && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ¿Eliminar <b>{borrar.nombre}</b>? Sus partes quedarán sin obra asociada.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBorrar(null)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await obrasApi.eliminarObra(borrar.id);
                  setBorrar(null);
                  cargar();
                }}
                className="btn flex-1 bg-red-500 px-5 py-3 text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ObraForm({
  obra,
  trabajadores,
  onClose,
  onSaved,
}: {
  obra: Obra | null;
  trabajadores: Usuario[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(obra?.nombre ?? "");
  const [direccion, setDireccion] = useState(obra?.direccion ?? "");
  const [estado, setEstado] = useState<EstadoObra>(obra?.estado ?? "pendiente");
  const [avance, setAvance] = useState(obra?.avance ?? 0);
  const [encargadoId, setEncargadoId] = useState<string | null>(obra?.encargadoId ?? null);
  const [equipo, setEquipo] = useState<string[]>(obra?.trabajadorIds ?? []);
  const [guardando, setGuardando] = useState(false);

  function toggle(id: string) {
    setEquipo((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  }

  async function guardar() {
    if (!nombre.trim()) return;
    setGuardando(true);
    // El encargado siempre forma parte del equipo asignado.
    const trabajadorIds = encargadoId && !equipo.includes(encargadoId) ? [encargadoId, ...equipo] : equipo;
    try {
      const payload = { nombre, direccion, estado, avance, encargadoId, trabajadorIds };
      if (obra) await obrasApi.actualizarObra(obra.id, payload);
      else await obrasApi.crearObra(payload);
      onSaved();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={obra ? "Editar obra" : "Nueva obra"}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre de la obra</label>
          <input className="field mt-1.5" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div>
          <label className="label">Dirección</label>
          <input className="field mt-1.5" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Estado</label>
            <select
              className="field mt-1.5"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoObra)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
          <div>
            <label className="label">Avance: {avance}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={avance}
              onChange={(e) => setAvance(Number(e.target.value))}
              className="mt-4 w-full accent-forge-orange"
            />
          </div>
        </div>

        <div>
          <label className="label">Encargado del día</label>
          <select
            className="field mt-1.5"
            value={encargadoId ?? ""}
            onChange={(e) => setEncargadoId(e.target.value || null)}
          >
            <option value="">Sin asignar</option>
            {trabajadores.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            El encargado puede cambiar cada día según a quién asignes a la obra.
          </p>
        </div>

        <div>
          <label className="label">Equipo asignado</label>
          <div className="mt-1.5 grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {trabajadores.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-forge-orange"
                  checked={equipo.includes(u.id)}
                  onChange={() => toggle(u.id)}
                />
                <Avatar nombre={u.nombre} color={u.color} size={26} />
                <span className="text-sm text-forge-dark">{u.nombre}</span>
                {encargadoId === u.id && (
                  <span className="ml-auto text-xs font-semibold text-forge-orange">Encargado</span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex-1">
            {guardando ? <Spinner className="h-5 w-5" /> : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
