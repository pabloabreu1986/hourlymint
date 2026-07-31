// Gestión de turnos: el admin planifica la semana; el trabajador la consulta.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Turno } from "@/lib/types";
import * as sb from "./supabase/turnos";

/** Turnos del tenant entre dos fechas YYYY-MM-DD, ambas incluidas. */
export async function turnosEnRango(desde: string, hasta: string): Promise<Turno[]> {
  if (isSupabaseEnabled) return sb.turnosEnRango(desde, hasta);
  const tid = tenantActivoId();
  return delay(
    loadDB().turnos.filter(
      (t) => t.tenantId === tid && t.fecha >= desde && t.fecha <= hasta
    )
  );
}

/** Turnos de un trabajador entre dos fechas. */
export async function turnosDe(
  trabajadorId: string,
  desde: string,
  hasta: string
): Promise<Turno[]> {
  if (isSupabaseEnabled) return sb.turnosDe(trabajadorId, desde, hasta);
  return delay(
    loadDB().turnos.filter(
      (t) => t.trabajadorId === trabajadorId && t.fecha >= desde && t.fecha <= hasta
    )
  );
}

export type NuevoTurno = Omit<Turno, "id" | "tenantId">;

/** Crea o reemplaza el turno de un trabajador en una fecha. */
export async function guardarTurno(data: NuevoTurno): Promise<Turno> {
  if (isSupabaseEnabled) return sb.guardarTurno(data);
  const nuevo: Turno = { id: uid("t"), tenantId: tenantActivoId(), ...data };
  updateDB((db) => {
    // Un turno por trabajador y día: si ya existe, se sustituye.
    db.turnos = db.turnos.filter(
      (t) => !(t.trabajadorId === data.trabajadorId && t.fecha === data.fecha)
    );
    db.turnos.push(nuevo);
  });
  return delay(nuevo);
}

export async function eliminarTurno(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarTurno(id);
  updateDB((db) => {
    db.turnos = db.turnos.filter((t) => t.id !== id);
  });
  return delay(undefined);
}
