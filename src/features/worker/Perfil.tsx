import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fichajesApi, usuariosApi } from "@/services";
import type { Fichaje } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Avatar, Modal, Spinner } from "@/components/ui";
import { hora } from "@/lib/format";
import { IconLogout, IconClock, IconUser, IconMapPin } from "@/components/icons";

export default function Perfil() {
  const { usuario, logout, refrescar } = useAuth();
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  const [editar, setEditar] = useState(false);
  const [telefono, setTelefono] = useState(usuario?.telefono ?? "");
  const [pass, setPass] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    fichajesApi.fichajesDeTrabajadorHoy(usuario.id).then((f) =>
      setFichajes(f.sort((a, b) => a.timestamp.localeCompare(b.timestamp)))
    );
  }, [usuario]);

  if (!usuario) return null;

  async function guardar() {
    if (!usuario) return;
    setGuardando(true);
    try {
      await usuariosApi.actualizarUsuario(usuario.id, {
        telefono,
        ...(pass.trim() ? { password: pass.trim() } : {}),
      });
      await refrescar();
      setEditar(false);
      setPass("");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <WorkerHeader title="Mi perfil" back={false} />

      <div className="p-4">
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          <Avatar nombre={usuario.nombre} color={usuario.color} size={72} />
          <div>
            <h2 className="text-xl font-bold text-forge-dark">{usuario.nombre}</h2>
            <p className="text-sm text-slate-400">{usuario.puesto}</p>
          </div>
          <button onClick={() => setEditar(true)} className="btn-ghost px-4 py-2 text-sm">
            <IconUser className="h-4 w-4" /> Editar perfil
          </button>
        </div>

        {/* Datos */}
        <div className="card mt-4 divide-y divide-slate-100">
          <Row label="Usuario" value={usuario.nombre} />
          <Row label="Teléfono" value={usuario.telefono ?? "—"} />
          <Row label="Puesto" value={usuario.puesto ?? "—"} />
        </div>

        {/* Fichajes de hoy */}
        <div className="card mt-4 p-5">
          <p className="label mb-3">Mis fichajes de hoy</p>
          {fichajes.length === 0 ? (
            <p className="text-sm text-slate-400">Aún no has fichado hoy.</p>
          ) : (
            <div className="space-y-3">
              {fichajes.map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full ${
                      f.tipo === "entrada" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                    <IconClock className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold capitalize text-forge-dark">{f.tipo}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <IconMapPin className="h-3 w-3" />
                      {f.gps ? `${f.gps.lat.toFixed(4)}, ${f.gps.lng.toFixed(4)}` : "Sin GPS"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-forge-dark">{hora(f.timestamp)}</p>
                    {f.estado === "tarde" && (
                      <p className="text-xs font-semibold text-amber-600">Con retraso</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="btn mt-4 w-full border border-red-200 bg-white px-5 py-3 text-red-600 hover:bg-red-50"
        >
          <IconLogout className="h-5 w-5" /> Cerrar sesión
        </button>
      </div>

      <Modal open={editar} onClose={() => setEditar(false)} title="Editar perfil">
        <div className="space-y-4">
          <div>
            <label className="label">Teléfono</label>
            <input className="field mt-1.5" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div>
            <label className="label">Nueva contraseña</label>
            <input
              className="field mt-1.5"
              type="password"
              placeholder="Dejar vacío para no cambiar"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>
          <button onClick={guardar} disabled={guardando} className="btn-primary w-full">
            {guardando ? <Spinner className="h-5 w-5" /> : "Guardar cambios"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-forge-dark">{value}</span>
    </div>
  );
}
