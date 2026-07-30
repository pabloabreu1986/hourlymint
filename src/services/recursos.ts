import { loadDB, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Vehiculo, Herramienta, AlmacenItem } from "@/lib/types";
import * as sb from "./supabase/recursos";

export async function listVehiculos(): Promise<Vehiculo[]> {
  if (isSupabaseEnabled) return sb.listVehiculos();
  const tid = tenantActivoId();
  return delay(loadDB().vehiculos.filter((v) => v.tenantId === tid));
}
export async function listHerramientas(): Promise<Herramienta[]> {
  if (isSupabaseEnabled) return sb.listHerramientas();
  const tid = tenantActivoId();
  return delay(loadDB().herramientas.filter((h) => h.tenantId === tid));
}
export async function listAlmacen(): Promise<AlmacenItem[]> {
  if (isSupabaseEnabled) return sb.listAlmacen();
  const tid = tenantActivoId();
  return delay(loadDB().almacen.filter((a) => a.tenantId === tid));
}
