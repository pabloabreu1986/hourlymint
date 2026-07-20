import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { Obra } from "@/lib/types";
import * as sb from "./supabase/obras";

const COLORS = ["#BE6B39", "#2E6F8E", "#5B7A4B", "#8E4B6F", "#B08423"];

export async function listObras(): Promise<Obra[]> {
  if (isSupabaseEnabled) return sb.listObras();
  return delay([...loadDB().obras]);
}

export async function getObra(id: string): Promise<Obra | null> {
  if (isSupabaseEnabled) return sb.getObra(id);
  return delay(loadDB().obras.find((o) => o.id === id) ?? null, 0);
}

/** Obras en las que participa un trabajador HOY (incluye si es encargado). */
export async function listObrasDeTrabajador(trabajadorId: string): Promise<Obra[]> {
  if (isSupabaseEnabled) return sb.listObrasDeTrabajador(trabajadorId);
  return delay(
    loadDB().obras.filter(
      (o) => o.trabajadorIds.includes(trabajadorId) || o.encargadoId === trabajadorId
    )
  );
}

export type NuevaObra = Omit<Obra, "id" | "color" | "createdAt">;

export async function crearObra(data: NuevaObra): Promise<Obra> {
  if (isSupabaseEnabled) return sb.crearObra(data);
  const nueva: Obra = {
    id: uid("o"),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    createdAt: new Date().toISOString().slice(0, 10),
    ...data,
  };
  updateDB((db) => db.obras.push(nueva));
  return delay(nueva);
}

export async function actualizarObra(id: string, patch: Partial<Obra>): Promise<Obra> {
  if (isSupabaseEnabled) return sb.actualizarObra(id, patch);
  let out: Obra | undefined;
  updateDB((db) => {
    const o = db.obras.find((x) => x.id === id);
    if (o) {
      Object.assign(o, patch);
      out = o;
    }
  });
  if (!out) throw new Error("Obra no encontrada");
  return delay(out);
}

export async function eliminarObra(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarObra(id);
  updateDB((db) => {
    db.obras = db.obras.filter((o) => o.id !== id);
  });
  return delay(undefined);
}
