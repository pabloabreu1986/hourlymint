// ─────────────────────────────────────────────────────────────
// Cálculo de jornada a partir de los fichajes de un día. Lógica pura
// (sin fetch, sin estado) para que Home, Perfil, el Dashboard y el
// detalle de horas calculen exactamente lo mismo de la misma forma.
//
// Modelo: un día puede tener, en orden, entrada → [pausas] → salida
// (ordinaria o automática) → [horas extra, cada una con sus propias
// pausas]. El descanso siempre "gana" visualmente sobre trabajando/
// en_extra: si hay una pausa abierta, ese es el estado, sea cual sea
// el tramo (ordinario o extra) en el que se abrió.
// ─────────────────────────────────────────────────────────────
import type { Fichaje, Obra } from "./types";

export interface Tramo {
  inicio: Fichaje;
  /** null mientras el tramo sigue abierto. */
  fin: Fichaje | null;
}

export type EstadoJornada =
  | "sin_fichar"
  | "trabajando"
  | "descansando"
  | "en_extra"
  | "cerrado";

export interface Jornada {
  entrada: Fichaje | null;
  salida: Fichaje | null;
  pausas: Tramo[];
  extras: Tramo[];
  estado: EstadoJornada;
  /** Segundos trabajados en el tramo ordinario, ya sin las pausas. */
  segundosOrdinarios: number;
  /** Segundos totales de descanso (todas las pausas). */
  segundosPausa: number;
  /** Segundos de horas extra, ya sin las pausas que caigan dentro. */
  segundosExtra: number;
  /** true si la salida quedó registrada por el cierre automático. */
  salidaAutomatica: boolean;
}

function ms(f: Fichaje): number {
  return new Date(f.timestamp).getTime();
}

/** Empareja una secuencia de eventos tipo_inicio/tipo_fin en tramos, en orden. */
function emparejar(eventos: Fichaje[], tipoInicio: string, tipoFin: string): Tramo[] {
  const tramos: Tramo[] = [];
  let abierto: Fichaje | null = null;
  for (const f of eventos) {
    if (f.tipo === tipoInicio) {
      // Un inicio sin cierre previo cerraría un tramo huérfano; lo ignoramos
      // en vez de perder el evento (no debería pasar con el flujo normal).
      if (!abierto) abierto = f;
    } else if (f.tipo === tipoFin && abierto) {
      tramos.push({ inicio: abierto, fin: f });
      abierto = null;
    }
  }
  if (abierto) tramos.push({ inicio: abierto, fin: null });
  return tramos;
}

/** Segundos de [inicioMs, finMs) que NO caen dentro de ninguna pausa. */
function restarPausas(inicioMs: number, finMs: number, pausas: Tramo[], ahoraMs: number): number {
  if (finMs <= inicioMs) return 0;
  let ocupadoPorPausa = 0;
  for (const p of pausas) {
    const pIni = ms(p.inicio);
    const pFin = p.fin ? ms(p.fin) : ahoraMs;
    const solapeIni = Math.max(inicioMs, pIni);
    const solapeFin = Math.min(finMs, pFin);
    if (solapeFin > solapeIni) ocupadoPorPausa += solapeFin - solapeIni;
  }
  return Math.max(0, finMs - inicioMs - ocupadoPorPausa) / 1000;
}

/**
 * Calcula el estado y los totales del día a partir de sus fichajes
 * (ya filtrados a un trabajador y un día). `ahora` se pasa explícito
 * para que la UI pueda recalcular cada segundo sin que esta función
 * dependa de un reloj interno.
 */
export function calcularJornada(fichajesDia: Fichaje[], ahora: Date = new Date()): Jornada {
  const ordenados = [...fichajesDia].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const ahoraMs = ahora.getTime();

  const entrada = ordenados.find((f) => f.tipo === "entrada") ?? null;
  const salida = ordenados.find((f) => f.tipo === "salida") ?? null;
  const pausas = emparejar(ordenados, "pausa_inicio", "pausa_fin");
  const extras = emparejar(ordenados, "extra_inicio", "extra_fin");

  const pausaAbierta = pausas.some((p) => !p.fin);
  const extraAbierta = extras.some((e) => !e.fin);

  let estado: EstadoJornada;
  if (pausaAbierta) estado = "descansando";
  else if (extraAbierta) estado = "en_extra";
  else if (salida) estado = "cerrado";
  else if (entrada) estado = "trabajando";
  else estado = "sin_fichar";

  const segundosOrdinarios = entrada
    ? restarPausas(ms(entrada), salida ? ms(salida) : ahoraMs, pausas, ahoraMs)
    : 0;

  const segundosExtra = extras.reduce(
    (acc, e) => acc + restarPausas(ms(e.inicio), e.fin ? ms(e.fin) : ahoraMs, pausas, ahoraMs),
    0
  );

  const segundosPausa = pausas.reduce(
    (acc, p) => acc + (Math.max(0, (p.fin ? ms(p.fin) : ahoraMs) - ms(p.inicio)) / 1000),
    0
  );

  return {
    entrada,
    salida,
    pausas,
    extras,
    estado,
    segundosOrdinarios,
    segundosPausa,
    segundosExtra,
    salidaAutomatica: salida?.estado === "automatica",
  };
}

/** "H:MM:SS", para el cronómetro en vivo. */
export function formatDuracion(segundosTotales: number): string {
  const s = Math.max(0, Math.floor(segundosTotales));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** "7h 45m", para tablas e informes (no lleva segundos). */
export function formatHoras(segundosTotales: number): string {
  const s = Math.max(0, Math.floor(segundosTotales));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0 && m === 0) return "0m";
  return `${h > 0 ? `${h}h ` : ""}${m}m`.trim();
}

/** Segundos "del momento" relevantes para el estado actual (para el
 * cronómetro en vivo): trabajando cuenta lo ordinario, descansando la
 * pausa, en_extra las horas extra; el resto no tiene cronómetro. */
export function segundosDeEstadoActual(jornada: Jornada): number {
  switch (jornada.estado) {
    case "trabajando":
      return jornada.segundosOrdinarios;
    case "descansando":
      return jornada.segundosPausa;
    case "en_extra":
      return jornada.segundosExtra;
    default:
      return 0;
  }
}

export type ColorBadgeEstado = "green" | "amber" | "violet" | "slate";

/** Etiqueta y color para mostrar el estado actual (badges, filas en vivo). */
export const ESTILO_ESTADO_JORNADA: Record<
  EstadoJornada,
  { label: string; badge: ColorBadgeEstado; fondo: string }
> = {
  sin_fichar: { label: "Sin fichar", badge: "slate", fondo: "" },
  trabajando: { label: "Trabajando", badge: "green", fondo: "bg-green-50/60" },
  descansando: { label: "Descansando", badge: "amber", fondo: "bg-amber-50/60" },
  en_extra: { label: "Horas extra", badge: "violet", fondo: "bg-violet-50/60" },
  cerrado: { label: "Jornada cerrada", badge: "slate", fondo: "" },
};

/** Día ISO (1=lunes..7=domingo) de una fecha, para comparar con `diasLaborables`. */
export function isoDiaSemana(fecha: Date): number {
  const d = fecha.getDay();
  return d === 0 ? 7 : d;
}

export function esDiaLaborable(obra: Pick<Obra, "diasLaborables">, fecha: Date): boolean {
  return obra.diasLaborables.includes(isoDiaSemana(fecha));
}
