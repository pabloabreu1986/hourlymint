import { useState } from "react";
import { resetDB } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui";
import { IconSettings, IconTrash, IconBox } from "@/components/icons";

export default function AdminConfiguracion() {
  const { logout } = useAuth();
  const [confirmar, setConfirmar] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <section className="card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-forge-dark/5 text-forge-dark">
            <IconSettings className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-bold text-forge-dark">FORGEVIA · Control de Obra</h2>
            <p className="text-sm text-slate-400">Versión 0.1.0 — Demo con datos mock (localStorage)</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-slate-500">
          <li className="flex items-center gap-2">
            <IconBox className="h-4 w-4 text-forge-orange" /> Los datos se guardan en el navegador
            (localStorage) y persisten entre sesiones.
          </li>
          <li className="flex items-center gap-2">
            <IconBox className="h-4 w-4 text-forge-orange" /> Al conectar la base de datos real solo
            cambia la capa <code className="rounded bg-slate-100 px-1">services/</code>.
          </li>
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="font-bold text-forge-dark">Datos de demostración</h2>
        <p className="mt-1 text-sm text-slate-500">
          Restablece todos los datos (usuarios, obras, fichajes, partes…) a los valores de ejemplo.
          Útil para volver a un estado limpio durante las pruebas.
        </p>
        <button
          onClick={() => setConfirmar(true)}
          className="btn mt-4 border border-red-200 bg-white px-5 py-3 text-red-600 hover:bg-red-50"
        >
          <IconTrash className="h-5 w-5" /> Restablecer datos
        </button>
      </section>

      <Modal open={confirmar} onClose={() => setConfirmar(false)} title="Restablecer datos">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Se borrarán todos los cambios y se volverá a los datos de ejemplo. Se cerrará la sesión.
            ¿Continuar?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmar(false)} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button
              onClick={() => {
                resetDB();
                logout();
              }}
              className="btn flex-1 bg-red-500 px-5 py-3 text-white hover:bg-red-600"
            >
              Restablecer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
