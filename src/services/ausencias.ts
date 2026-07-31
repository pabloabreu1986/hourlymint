// Ausencias y vacaciones: el trabajador solicita, el admin resuelve.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Ausencia, EstadoAusencia } from "@/lib/types";
import * as sb from "./supabase/ausencias";

export async function listAusencias(): Promise<Ausencia[]> {
  if (isSupabaseEnabled) return sb.listAusencias();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .ausencias.filter((a) => a.tenantId === tid)
      .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
  );
}

export async function ausenciasDe(trabajadorId: string): Promise<Ausencia[]> {
  if (isSupabaseEnabled) return sb.ausenciasDe(trabajadorId);
  return delay(
    loadDB()
      .ausencias.filter((a) => a.trabajadorId === trabajadorId)
      .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
  );
}

export type NuevaAusencia = Omit<
  Ausencia,
  "id" | "tenantId" | "estado" | "respuesta" | "creadaEn"
>;

export async function solicitarAusencia(data: NuevaAusencia): Promise<Ausencia> {
  if (isSupabaseEnabled) return sb.solicitarAusencia(data);
  const nueva: Ausencia = {
    id: uid("au"),
    tenantId: tenantActivoId(),
    estado: "pendiente",
    respuesta: null,
    creadaEn: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.ausencias.push(nueva));
  return delay(nueva);
}

export async function resolverAusencia(
  id: string,
  estado: EstadoAusencia,
  respuesta: string
): Promise<Ausencia> {
  if (isSupabaseEnabled) return sb.resolverAusencia(id, estado, respuesta);
  let out: Ausencia | undefined;
  updateDB((db) => {
    const a = db.ausencias.find((x) => x.id === id);
    if (a) {
      a.estado = estado;
      a.respuesta = respuesta || null;
      out = a;
    }
  });
  if (!out) throw new Error("Ausencia no encontrada");
  return delay(out);
}

// ── Helpers puros (mismos en mock y Supabase) ──

/** Días naturales de la ausencia, ambos extremos incluidos. */
export function diasDeAusencia(a: Pick<Ausencia, "fechaInicio" | "fechaFin">): number {
  const ini = new Date(a.fechaInicio + "T00:00:00");
  const fin = new Date(a.fechaFin + "T00:00:00");
  return Math.max(1, Math.round((fin.getTime() - ini.getTime()) / 86400000) + 1);
}

/** Días de vacaciones aprobados de un trabajador en un año dado. */
export function diasVacacionesUsados(
  ausencias: Ausencia[],
  trabajadorId: string,
  anio: number
): number {
  return ausencias
    .filter(
      (a) =>
        a.trabajadorId === trabajadorId &&
        a.tipo === "vacaciones" &&
        a.estado === "aprobada" &&
        a.fechaInicio.startsWith(String(anio))
    )
    .reduce((acc, a) => acc + diasDeAusencia(a), 0);
}
