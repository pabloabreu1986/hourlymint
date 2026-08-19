// Oportunidades comerciales (CRM vertical fincas): trabajos que parten de una
// comunidad y se atribuyen a su administración. Mock-first con seam a Supabase.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Oportunidad } from "@/lib/types";
import * as sb from "./supabase/oportunidades";

export async function listOportunidades(): Promise<Oportunidad[]> {
  if (isSupabaseEnabled) return sb.listOportunidades();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .oportunidades.filter((o) => o.tenantId === tid)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export async function getOportunidad(id: string): Promise<Oportunidad | null> {
  if (isSupabaseEnabled) return sb.getOportunidad(id);
  const tid = tenantActivoId();
  return delay(
    loadDB().oportunidades.find((o) => o.id === id && o.tenantId === tid) ?? null,
    0
  );
}

export type NuevaOportunidad = Omit<Oportunidad, "id" | "tenantId" | "createdAt">;

export async function crearOportunidad(data: NuevaOportunidad): Promise<Oportunidad> {
  if (isSupabaseEnabled) return sb.crearOportunidad(data);
  const nueva: Oportunidad = {
    id: uid("op"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.oportunidades.push(nueva));
  return delay(nueva);
}

export async function actualizarOportunidad(
  id: string,
  patch: Partial<Oportunidad>
): Promise<Oportunidad> {
  if (isSupabaseEnabled) return sb.actualizarOportunidad(id, patch);
  let out: Oportunidad | undefined;
  updateDB((db) => {
    const o = db.oportunidades.find((x) => x.id === id);
    if (o) {
      Object.assign(o, patch);
      out = o;
    }
  });
  if (!out) throw new Error("Oportunidad no encontrada");
  return delay(out);
}

export async function eliminarOportunidad(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarOportunidad(id);
  updateDB((db) => {
    db.oportunidades = db.oportunidades.filter((o) => o.id !== id);
    // Las interacciones ligadas a la oportunidad quedan sin ella (no se borran).
    db.interacciones.forEach((i) => {
      if (i.oportunidadId === id) i.oportunidadId = null;
    });
  });
  return delay(undefined);
}
