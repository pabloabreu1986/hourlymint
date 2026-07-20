import { sb } from "@/lib/supabase";
import type { AlmacenItem, Herramienta, Vehiculo } from "@/lib/types";
import { toVehiculo, toHerramienta, toAlmacen, check } from "./_map";

export async function listVehiculos(): Promise<Vehiculo[]> {
  const data = check(await sb().from("vehiculos").select("*"));
  return (data ?? []).map(toVehiculo);
}

export async function listHerramientas(): Promise<Herramienta[]> {
  const data = check(await sb().from("herramientas").select("*"));
  return (data ?? []).map(toHerramienta);
}

export async function listAlmacen(): Promise<AlmacenItem[]> {
  const data = check(await sb().from("almacen").select("*"));
  return (data ?? []).map(toAlmacen);
}
