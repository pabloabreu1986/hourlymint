// Campañas de captación de la plataforma. El super-admin las crea desde
// su consola; cada una tiene un enlace propio (?c=<id>) para los anuncios.
// En producción se guardan en Supabase (tabla `campanas`); en mock, en
// localStorage.
import { loadDB, updateDB, delay, uid } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { Campana, PlataformaCampana } from "@/lib/types";
import * as sb from "./supabase/campanas";

export interface CampanaInput {
  nombre: string;
  plataforma: PlataformaCampana;
  presupuestoDia: number;
  activa: boolean;
}

/** Lista las campañas, de la más reciente a la más antigua. */
export async function listCampanas(): Promise<Campana[]> {
  if (isSupabaseEnabled) return sb.listCampanas();
  const campanas = [...loadDB().campanas].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  return delay(campanas);
}

/** Crea una campaña nueva y la devuelve (con su id, ya usable en el enlace). */
export async function crearCampana(input: CampanaInput): Promise<Campana> {
  if (isSupabaseEnabled) return sb.crearCampana(input);
  const campana: Campana = {
    id: uid("camp"),
    nombre: input.nombre,
    plataforma: input.plataforma,
    presupuestoDia: input.presupuestoDia,
    activa: input.activa,
    createdAt: new Date().toISOString(),
  };
  updateDB((db) => {
    db.campanas.unshift(campana);
  });
  return delay(campana, 300);
}

/** Actualiza campos de una campaña (p. ej. activar/pausar o editar). */
export async function actualizarCampana(
  id: string,
  patch: Partial<CampanaInput>
): Promise<void> {
  if (isSupabaseEnabled) return sb.actualizarCampana(id, patch);
  updateDB((db) => {
    const c = db.campanas.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
  });
  return delay(undefined, 0);
}

/** Elimina una campaña. Los leads ya captados se conservan. */
export async function eliminarCampana(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarCampana(id);
  updateDB((db) => {
    db.campanas = db.campanas.filter((x) => x.id !== id);
  });
  return delay(undefined, 0);
}
