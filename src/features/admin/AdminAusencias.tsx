import { useEffect, useMemo, useState } from "react";
import { ausenciasApi, notificacionesApi, usuariosApi } from "@/services";
import { diasDeAusencia, diasVacacionesUsados } from "@/services/ausencias";
import type { Ausencia, EstadoAusencia, TipoAusencia, Usuario } from "@/lib/types";
import { Avatar, Badge, Cargando, EmptyState, Modal } from "@/components/ui";
import { fechaLarga, fechaHora } from "@/lib/format";
import { IconCalendar, IconCheck, IconX, IconShield } from "@/components/icons";
import GuiaLaboral from "./GuiaLaboral";

export const ETIQUETA_TIPO_AUSENCIA: Record<TipoAusencia, string> = {
  vacaciones: "Vacaciones",
  baja_medica: "Baja médica",
  permiso: "Permiso",
  otro: "Otro",
};

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

export default function AdminAusencias() {
  const [items, setItems] = useState<Ausencia[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState<EstadoAusencia | "todas">("todas");
  const [verGuia, setVerGuia] = useState(false);
  // Ausencia que se está resolviendo (modal de aprobar/rechazar).
  const [resolviendo, setResolviendo] = useState<{
    ausencia: Ausencia;
    estado: EstadoAusencia;
  } | null>(null);
  const [respuesta, setRespuesta] = useState("");

  async function cargar() {
    setItems(await ausenciasApi.listAusencias());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  const trabajadores = useMemo(
    () => usuarios.filter((u) => u.rol === "trabajador" && u.activo),
    [usuarios]
  );

  if (!items) return <Cargando />;

  const usuarioDe = (id: string) => usuarios.find((u) => u.id === id);
  const visibles = filtro === "todas" ? items : items.filter((a) => a.estado === filtro);
  const pendientes = items.filter((a) => a.estado === "pendiente").length;

  async function confirmarResolucion() {
    if (!resolviendo) return;
    const { ausencia, estado } = resolviendo;
    await ausenciasApi.resolverAusencia(ausencia.id, estado, respuesta.trim());
    // Aviso al trabajador con el resultado.
    await notificacionesApi.crearNotificacion({
      trabajadorId: ausencia.trabajadorId,
      tipo: "aviso",
      titulo: `Solicitud de ${ETIQUETA_TIPO_AUSENCIA[ausencia.tipo].toLowerCase()} ${
        estado === "aprobada" ? "aprobada" : "rechazada"
      }`,
      mensaje: `Del ${fechaLarga(ausencia.fechaInicio)} al ${fechaLarga(ausencia.fechaFin)}.${
        respuesta.trim() ? ` "${respuesta.trim()}"` : ""
      }`,
    });
    setResolviendo(null);
    setRespuesta("");
    cargar();
  }

  const anio = new Date().getFullYear();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Solicitudes de vacaciones, permisos y bajas de tu equipo.</p>
        <button onClick={() => setVerGuia(true)} className="btn-ghost px-4 py-2.5 text-sm">
          <IconShield className="h-4 w-4" /> Guía laboral
        </button>
      </div>
      <GuiaLaboral open={verGuia} onClose={() => setVerGuia(false)} />

      {/* Saldo de vacaciones por trabajador */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {trabajadores.map((t) => {
          const total = t.diasVacaciones ?? DIAS_VACACIONES_DEFECTO;
          const usados = diasVacacionesUsados(items, t.id, anio);
          return (
            <div key={t.id} className="card flex items-center gap-3 p-4">
              <Avatar nombre={t.nombre} color={t.color} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-forge-dark">{t.nombre}</p>
                <p className="text-xs text-slate-400">
                  Vacaciones {anio}: <span className="font-semibold">{usados}</span> de {total}{" "}
                  días
                </p>
              </div>
              <span
                className={`text-lg font-extrabold ${
                  total - usados <= 3 ? "text-estado-alerta" : "text-forge-dark"
                }`}
              >
                {total - usados}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(["todas", "pendiente", "aprobada", "rechazada"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filtro === f ? "bg-forge-dark text-white" : "bg-white text-slate-500 hover:bg-slate-100"
            }`}
          >
            {f === "todas" ? "Todas" : ETIQUETA_ESTADO[f]}
            {f === "pendiente" && pendientes > 0 && ` (${pendientes})`}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon={<IconCalendar className="h-12 w-12" />}
          titulo="Sin solicitudes"
          texto="Las solicitudes de ausencia de tu equipo aparecerán aquí."
        />
      ) : (
        <div className="space-y-3">
          {visibles.map((a) => {
            const u = usuarioDe(a.trabajadorId);
            return (
              <div key={a.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Avatar nombre={u?.nombre ?? "?"} color={u?.color} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-forge-dark">{u?.nombre ?? "—"}</p>
                    <Badge color="blue">{ETIQUETA_TIPO_AUSENCIA[a.tipo].toUpperCase()}</Badge>
                    <Badge color={COLOR_ESTADO[a.estado]}>
                      {ETIQUETA_ESTADO[a.estado].toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {fechaLarga(a.fechaInicio)} → {fechaLarga(a.fechaFin)} ·{" "}
                    <span className="font-semibold">{diasDeAusencia(a)} días</span>
                  </p>
                  {a.motivo && <p className="text-sm text-slate-500">“{a.motivo}”</p>}
                  {a.respuesta && (
                    <p className="mt-1 text-xs text-slate-400">Respuesta: {a.respuesta}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Solicitada el {fechaHora(a.creadaEn)}</p>
                </div>
                {a.estado === "pendiente" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResolviendo({ ausencia: a, estado: "aprobada" })}
                      className="btn bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                    >
                      <IconCheck className="h-4 w-4" /> Aprobar
                    </button>
                    <button
                      onClick={() => setResolviendo({ ausencia: a, estado: "rechazada" })}
                      className="btn border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <IconX className="h-4 w-4" /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!resolviendo}
        onClose={() => setResolviendo(null)}
        title={resolviendo?.estado === "aprobada" ? "Aprobar solicitud" : "Rechazar solicitud"}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {resolviendo &&
              `${usuarioDe(resolviendo.ausencia.trabajadorId)?.nombre ?? ""} · ${
                ETIQUETA_TIPO_AUSENCIA[resolviendo.ausencia.tipo]
              } · ${diasDeAusencia(resolviendo.ausencia)} días`}
          </p>
          <div>
            <label className="label">Comentario (opcional)</label>
            <textarea
              className="field mt-1.5"
              rows={3}
              placeholder="Se enviará al trabajador junto con la resolución"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
            />
          </div>
          <button
            onClick={confirmarResolucion}
            className={`btn w-full py-3 text-white ${
              resolviendo?.estado === "aprobada"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {resolviendo?.estado === "aprobada" ? "Confirmar aprobación" : "Confirmar rechazo"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
