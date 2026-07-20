import { loadDB, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { Vehiculo, Herramienta, AlmacenItem } from "@/lib/types";
import * as sb from "./supabase/recursos";

export async function listVehiculos(): Promise<Vehiculo[]> {
  if (isSupabaseEnabled) return sb.listVehiculos();
  return delay([...loadDB().vehiculos]);
}
export async function listHerramientas(): Promise<Herramienta[]> {
  if (isSupabaseEnabled) return sb.listHerramientas();
  return delay([...loadDB().herramientas]);
}
export async function listAlmacen(): Promise<AlmacenItem[]> {
  if (isSupabaseEnabled) return sb.listAlmacen();
  return delay([...loadDB().almacen]);
}
