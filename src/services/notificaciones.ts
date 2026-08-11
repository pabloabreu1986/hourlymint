import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Notificacion } from "@/lib/types";
import * as sb from "./supabase/notificaciones";

/** Notificaciones para un trabajador (las suyas + las globales). */
export async function notificacionesDe(trabajadorId: string): Promise<Notificacion[]> {
  if (isSupabaseEnabled) return sb.notificacionesDe(trabajadorId);
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .notificaciones.filter(
        (n) =>
          n.tenantId === tid &&
          (n.trabajadorId === trabajadorId || n.trabajadorId === null)
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export async function listNotificaciones(): Promise<Notificacion[]> {
  if (isSupabaseEnabled) return sb.listNotificaciones();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .notificaciones.filter((n) => n.tenantId === tid)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export async function marcarLeida(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.marcarLeida(id);
  updateDB((db) => {
    const n = db.notificaciones.find((x) => x.id === id);
    if (n) n.leida = true;
  });
  return delay(undefined, 0);
}

export async function marcarTodasLeidas(trabajadorId: string): Promise<void> {
  if (isSupabaseEnabled) return sb.marcarTodasLeidas(trabajadorId);
  updateDB((db) => {
    db.notificaciones.forEach((n) => {
      if (n.trabajadorId === trabajadorId || n.trabajadorId === null) n.leida = true;
    });
  });
  return delay(undefined, 0);
}

export async function eliminarNotificacion(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarNotificacion(id);
  updateDB((db) => {
    db.notificaciones = db.notificaciones.filter((n) => n.id !== id);
  });
  return delay(undefined, 0);
}

/** Borra TODAS las notificaciones del tenant activo (acción del admin). */
export async function eliminarTodas(): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarTodas();
  const tid = tenantActivoId();
  updateDB((db) => {
    db.notificaciones = db.notificaciones.filter((n) => n.tenantId !== tid);
  });
  return delay(undefined, 0);
}

/** Borra las notificaciones personales de un trabajador (no las globales,
 *  que son de todo el equipo). */
export async function eliminarTodasDe(trabajadorId: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarTodasDe(trabajadorId);
  const tid = tenantActivoId();
  updateDB((db) => {
    db.notificaciones = db.notificaciones.filter(
      (n) => !(n.tenantId === tid && n.trabajadorId === trabajadorId)
    );
  });
  return delay(undefined, 0);
}

export async function crearNotificacion(
  data: Omit<Notificacion, "id" | "tenantId" | "fecha" | "leida">
): Promise<Notificacion> {
  if (isSupabaseEnabled) return sb.crearNotificacion(data);
  const nueva: Notificacion = {
    id: uid("n"),
    tenantId: tenantActivoId(),
    fecha: new Date().toISOString(),
    leida: false,
    ...data,
  };
  updateDB((db) => db.notificaciones.push(nueva));
  return delay(nueva);
}
