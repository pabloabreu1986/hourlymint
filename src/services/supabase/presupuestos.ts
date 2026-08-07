import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { PlantillaDisclaimer, Presupuesto } from "@/lib/types";
import type { NuevoPresupuesto, NuevoDisclaimer } from "../presupuestos";
import {
  toPresupuesto,
  fromPresupuesto,
  toDisclaimer,
  fromDisclaimer,
  check,
} from "./_map";

export async function listPresupuestos(): Promise<Presupuesto[]> {
  const data = check(
    await sb()
      .from("presupuestos")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toPresupuesto);
}

export async function getPresupuesto(id: string): Promise<Presupuesto | null> {
  const { data, error } = await sb().from("presupuestos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPresupuesto(data) : null;
}

export async function crearPresupuesto(input: NuevoPresupuesto): Promise<Presupuesto> {
  const nuevo: Presupuesto = {
    id: uid("pre"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("presupuestos").insert(fromPresupuesto(nuevo)));
  return nuevo;
}

export async function actualizarPresupuesto(
  id: string,
  patch: Partial<Presupuesto>
): Promise<Presupuesto> {
  const data = check(
    await sb().from("presupuestos").update(fromPresupuesto(patch)).eq("id", id).select().single()
  );
  return toPresupuesto(data);
}

export async function eliminarPresupuesto(id: string): Promise<void> {
  check(await sb().from("presupuestos").delete().eq("id", id));
}

// ── Disclaimers ──
export async function listDisclaimers(): Promise<PlantillaDisclaimer[]> {
  const data = check(
    await sb().from("disclaimers").select("*").eq("tenant_id", tenantActivoId()).order("titulo")
  );
  return (data ?? []).map(toDisclaimer);
}

export async function crearDisclaimer(input: NuevoDisclaimer): Promise<PlantillaDisclaimer> {
  const nuevo: PlantillaDisclaimer = { id: uid("dis"), tenantId: tenantActivoId(), ...input };
  check(await sb().from("disclaimers").insert(fromDisclaimer(nuevo)));
  return nuevo;
}

export async function eliminarDisclaimer(id: string): Promise<void> {
  check(await sb().from("disclaimers").delete().eq("id", id));
}
