import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usuariosApi } from "@/services";
import { Avatar, Modal, Spinner } from "@/components/ui";
import { IconLogout, IconUser } from "@/components/icons";

export default function AdminPerfil() {
  const { usuario, logout, refrescar } = useAuth();
  const [editar, setEditar] = useState(false);
  const [telefono, setTelefono] = useState(usuario?.telefono ?? "");
  const [pass, setPass] = useState("");
  const [guardando, setGuardando] = useState(false);

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
    <div className="max-w-md">
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

      <div className="card mt-4 divide-y divide-slate-100">
        <Row label="Usuario" value={usuario.nombre} />
        <Row label="Teléfono" value={usuario.telefono ?? "—"} />
        <Row label="Puesto" value={usuario.puesto ?? "—"} />
      </div>

      <button
        onClick={logout}
        className="btn mt-4 w-full border border-red-200 bg-white px-5 py-3 text-red-600 hover:bg-red-50"
      >
        <IconLogout className="h-5 w-5" /> Cerrar sesión
      </button>

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
