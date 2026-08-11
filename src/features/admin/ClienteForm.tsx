import { useState } from "react";
import { clientesApi } from "@/services";
import { CANALES } from "@/lib/finanzas";
import { Modal, Spinner } from "@/components/ui";
import type { CanalCaptacion, Cliente } from "@/lib/types";

type Draft = {
  nombre: string;
  apellidos: string;
  cif: string;
  telefono: string;
  email: string;
  direccion: string;
  cp: string;
  ciudad: string;
  poblacion: string;
  canal: CanalCaptacion;
  canalDetalle: string;
  notas: string;
  activo: boolean;
};

function draftDe(c: Cliente | null): Draft {
  return {
    nombre: c?.nombre ?? "",
    apellidos: c?.apellidos ?? "",
    cif: c?.cif ?? "",
    telefono: c?.telefono ?? "",
    email: c?.email ?? "",
    direccion: c?.direccion ?? "",
    cp: c?.cp ?? "",
    ciudad: c?.ciudad ?? "",
    poblacion: c?.poblacion ?? "",
    canal: c?.canal ?? "referencia",
    canalDetalle: c?.canalDetalle ?? "",
    notas: c?.notas ?? "",
    activo: c?.activo ?? true,
  };
}

/** Alta/edición de cliente. `onSaved` recibe el cliente guardado. */
export default function ClienteForm({
  cliente,
  onClose,
  onSaved,
}: {
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: (c: Cliente) => void;
}) {
  const [d, setD] = useState<Draft>(draftDe(cliente));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!d.nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    try {
      const saved = cliente
        ? await clientesApi.actualizarCliente(cliente.id, d)
        : await clientesApi.crearCliente(d);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={cliente ? "Editar cliente" : "Nuevo cliente"}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nombre</label>
            <input
              className="field mt-1.5"
              value={d.nombre}
              onChange={(e) => setD({ ...d, nombre: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Apellidos</label>
            <input
              className="field mt-1.5"
              value={d.apellidos}
              onChange={(e) => setD({ ...d, apellidos: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">CIF / NIF</label>
          <input
            className="field mt-1.5 uppercase"
            placeholder="B12345678 / 12345678Z"
            value={d.cif}
            onChange={(e) => setD({ ...d, cif: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Teléfono</label>
            <input
              className="field mt-1.5"
              value={d.telefono}
              onChange={(e) => setD({ ...d, telefono: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="field mt-1.5"
              value={d.email}
              onChange={(e) => setD({ ...d, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Dirección (calle y número)</label>
          <input
            className="field mt-1.5"
            value={d.direccion}
            onChange={(e) => setD({ ...d, direccion: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Código postal</label>
            <input
              className="field mt-1.5"
              inputMode="numeric"
              placeholder="28001"
              value={d.cp}
              onChange={(e) => setD({ ...d, cp: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input
              className="field mt-1.5"
              value={d.ciudad}
              onChange={(e) => setD({ ...d, ciudad: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Población</label>
            <input
              className="field mt-1.5"
              value={d.poblacion}
              onChange={(e) => setD({ ...d, poblacion: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">¿Cómo llegó?</label>
            <select
              className="field mt-1.5"
              value={d.canal}
              onChange={(e) => setD({ ...d, canal: e.target.value as CanalCaptacion })}
            >
              {CANALES.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Detalle de captación</label>
            <input
              className="field mt-1.5"
              placeholder="Qué red, quién lo refirió…"
              value={d.canalDetalle}
              onChange={(e) => setD({ ...d, canalDetalle: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Notas</label>
          <textarea
            className="field mt-1.5"
            rows={2}
            value={d.notas}
            onChange={(e) => setD({ ...d, notas: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

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
