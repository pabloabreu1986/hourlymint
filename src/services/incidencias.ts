import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { Incidencia } from "@/lib/types";
import * as sb from "./supabase/incidencias";

export async function listIncidencias(): Promise<Incidencia[]> {
  if (isSupabaseEnabled) return sb.listIncidencias();
  return delay(
    [...loadDB().incidencias].sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export type NuevaIncidencia = Omit<Incidencia, "id" | "fecha" | "estado"> &
  Partial<Pick<Incidencia, "estado">>;

export async function crearIncidencia(data: NuevaIncidencia): Promise<Incidencia> {
  if (isSupabaseEnabled) return sb.crearIncidencia(data);
  const nueva: Incidencia = {
    id: uid("i"),
    fecha: new Date().toISOString(),
    estado: "nueva",
    ...data,
  };
  updateDB((db) => db.incidencias.push(nueva));
  return delay(nueva);
}

export async function actualizarIncidencia(
  id: string,
  patch: Partial<Incidencia>
): Promise<Incidencia> {
  if (isSupabaseEnabled) return sb.actualizarIncidencia(id, patch);
  let out: Incidencia | undefined;
  updateDB((db) => {
    const i = db.incidencias.find((x) => x.id === id);
    if (i) {
      Object.assign(i, patch);
      out = i;
    }
  });
  if (!out) throw new Error("Incidencia no encontrada");
  return delay(out);
}
