import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ausenciasApi } from "@/services";
import { diasDeAusencia, diasVacacionesUsados } from "@/services/ausencias";
import type { Ausencia, EstadoAusencia, TipoAusencia } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Badge, Cargando, EmptyState, Modal, Spinner } from "@/components/ui";
import { fechaLarga } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { IconCalendar, IconPlus } from "@/components/icons";

const TIPOS: { value: TipoAusencia; label: string }[] = [
  { value: "vacaciones", label: "Vacaciones" },
  { value: "permiso", label: "Permiso" },
  { value: "baja_medica", label: "Baja médica" },
  { value: "otro", label: "Otro" },
];

const COLOR_ESTADO: Record<EstadoAusencia, "amber" | "green" | "red"> = {
  pendiente: "amber",
  aprobada: "green",
  rechazada: "red",
};

const ETIQUETA_ESTADO: Record<EstadoAusencia, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const DIAS_VACACIONES_DEFECTO = 22;

export default function MisAusencias() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Ausencia[] | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoAusencia>("vacaciones");
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    if (!usuario) return;
    setItems(await ausenciasApi.ausenciasDe(usuario.id));
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  if (!usuario) return null;

  const anio = new Date().getFullYear();
  const total = usuario.diasVacaciones ?? DIAS_VACACIONES_DEFECTO;
  const usados = items ? diasVacacionesUsados(items, usuario.id, anio) : 0;

  async function solicitar() {
    if (!usuario) return;
    if (fechaFin < fechaInicio) {
      setError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await ausenciasApi.solicitarAusencia({
        trabajadorId: usuario.id,
        tipo,
        fechaInicio,
        fechaFin,
        motivo: motivo.trim(),
      });
      setAbierto(false);
      setMotivo("");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <WorkerHeader
        title="Mis ausencias"
        action={
          <button onClick={() => setAbierto(true)} className="btn-primary px-3 py-2 text-sm">
            <IconPlus className="h-4 w-4" /> Solicitar
          </button>
        }
      />

      <div className="p-4">
        {/* Saldo de vacaciones */}
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="label">Vacaciones {anio}</p>
            <p className="mt-1 text-sm text-slate-400">
              {usados} usados de {total} días
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-forge-orange">{total - usados}</p>
            <p className="text-xs text-slate-400">disponibles</p>
          </div>
        </div>

        {!items ? (
          <Cargando />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IconCalendar className="h-12 w-12" />}
            titulo="Sin solicitudes"
            texto="Pide vacaciones o permisos con el botón Solicitar."
          />
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-forge-dark">
                    {TIPOS.find((t) => t.value === a.tipo)?.label}
                  </p>
                  <Badge color={COLOR_ESTADO[a.estado]}>
                    {ETIQUETA_ESTADO[a.estado].toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {fechaLarga(a.fechaInicio)} → {fechaLarga(a.fechaFin)} ·{" "}
                  <span className="font-semibold">{diasDeAusencia(a)} días</span>
                </p>
                {a.respuesta && (
                  <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Respuesta: {a.respuesta}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={abierto} onClose={() => setAbierto(false)} title="Solicitar ausencia">
        <div className="space-y-4">
          <div>
            <label className="label">Tipo</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTipo(t.value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    tipo === t.value
                      ? "border-forge-orange bg-forge-orange/10 text-forge-orange"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Desde</label>
              <input
                type="date"
                className="field mt-1.5"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input
                type="date"
                className="field mt-1.5"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Motivo (opcional)</label>
            <textarea
              className="field mt-1.5"
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button onClick={solicitar} disabled={guardando} className="btn-primary w-full py-3">
            {guardando ? <Spinner className="h-5 w-5" /> : "Enviar solicitud"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
