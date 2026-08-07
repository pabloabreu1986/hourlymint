// Presupuestos a clientes (con margen y disclaimers) y plantillas de
// disclaimer reutilizables.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { PlantillaDisclaimer, Presupuesto } from "@/lib/types";
import * as sb from "./supabase/presupuestos";

export async function listPresupuestos(): Promise<Presupuesto[]> {
  if (isSupabaseEnabled) return sb.listPresupuestos();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .presupuestos.filter((p) => p.tenantId === tid)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export async function getPresupuesto(id: string): Promise<Presupuesto | null> {
  if (isSupabaseEnabled) return sb.getPresupuesto(id);
  const tid = tenantActivoId();
  return delay(loadDB().presupuestos.find((p) => p.id === id && p.tenantId === tid) ?? null, 0);
}

export type NuevoPresupuesto = Omit<Presupuesto, "id" | "tenantId" | "createdAt">;

export async function crearPresupuesto(data: NuevoPresupuesto): Promise<Presupuesto> {
  if (isSupabaseEnabled) return sb.crearPresupuesto(data);
  const nuevo: Presupuesto = {
    id: uid("pre"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.presupuestos.push(nuevo));
  return delay(nuevo);
}

export async function actualizarPresupuesto(
  id: string,
  patch: Partial<Presupuesto>
): Promise<Presupuesto> {
  if (isSupabaseEnabled) return sb.actualizarPresupuesto(id, patch);
  let out: Presupuesto | undefined;
  updateDB((db) => {
    const p = db.presupuestos.find((x) => x.id === id);
    if (p) {
      Object.assign(p, patch);
      out = p;
    }
  });
  if (!out) throw new Error("Presupuesto no encontrado");
  return delay(out);
}

export async function eliminarPresupuesto(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarPresupuesto(id);
  updateDB((db) => {
    db.presupuestos = db.presupuestos.filter((p) => p.id !== id);
  });
  return delay(undefined);
}

// ── Plantillas de disclaimer ──
export async function listDisclaimers(): Promise<PlantillaDisclaimer[]> {
  if (isSupabaseEnabled) return sb.listDisclaimers();
  const tid = tenantActivoId();
  return delay(loadDB().disclaimers.filter((d) => d.tenantId === tid));
}

export type NuevoDisclaimer = Omit<PlantillaDisclaimer, "id" | "tenantId">;

export async function crearDisclaimer(data: NuevoDisclaimer): Promise<PlantillaDisclaimer> {
  if (isSupabaseEnabled) return sb.crearDisclaimer(data);
  const nuevo: PlantillaDisclaimer = { id: uid("dis"), tenantId: tenantActivoId(), ...data };
  updateDB((db) => db.disclaimers.push(nuevo));
  return delay(nuevo);
}

export async function eliminarDisclaimer(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarDisclaimer(id);
  updateDB((db) => {
    db.disclaimers = db.disclaimers.filter((d) => d.id !== id);
  });
  return delay(undefined);
}
