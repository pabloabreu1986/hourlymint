import { sb } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { AlmacenItem, Herramienta, Vehiculo } from "@/lib/types";
import { toVehiculo, toHerramienta, toAlmacen, check } from "./_map";

export async function listVehiculos(): Promise<Vehiculo[]> {
  const data = check(await sb().from("vehiculos").select("*").eq("tenant_id", tenantActivoId()));
  return (data ?? []).map(toVehiculo);
}

export async function listHerramientas(): Promise<Herramienta[]> {
  const data = check(await sb().from("herramientas").select("*").eq("tenant_id", tenantActivoId()));
  return (data ?? []).map(toHerramienta);
}

export async function listAlmacen(): Promise<AlmacenItem[]> {
  const data = check(await sb().from("almacen").select("*").eq("tenant_id", tenantActivoId()));
  return (data ?? []).map(toAlmacen);
}
