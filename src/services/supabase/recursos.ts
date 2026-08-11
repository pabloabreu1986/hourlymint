import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { AlmacenItem, Herramienta, Vehiculo } from "@/lib/types";
import type { NuevoVehiculo, NuevaHerramienta } from "../recursos";
import {
  toVehiculo,
  fromVehiculo,
  toHerramienta,
  fromHerramienta,
  toAlmacen,
  check,
} from "./_map";

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

// ── Vehículos ──
export async function crearVehiculo(data: NuevoVehiculo): Promise<Vehiculo> {
  const nuevo: Vehiculo = { id: uid("v"), tenantId: tenantActivoId(), ...data };
  check(await sb().from("vehiculos").insert(fromVehiculo(nuevo)));
  return nuevo;
}

export async function actualizarVehiculo(id: string, patch: Partial<Vehiculo>): Promise<Vehiculo> {
  const data = check(
    await sb().from("vehiculos").update(fromVehiculo(patch)).eq("id", id).select().single()
  );
  return toVehiculo(data);
}

export async function eliminarVehiculo(id: string): Promise<void> {
  const { error } = await sb().from("vehiculos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Herramientas ──
export async function crearHerramienta(data: NuevaHerramienta): Promise<Herramienta> {
  const nueva: Herramienta = { id: uid("h"), tenantId: tenantActivoId(), ...data };
  check(await sb().from("herramientas").insert(fromHerramienta(nueva)));
  return nueva;
}

export async function crearHerramientas(datos: NuevaHerramienta[]): Promise<Herramienta[]> {
  const tid = tenantActivoId();
  const nuevas: Herramienta[] = datos.map((d) => ({ id: uid("h"), tenantId: tid, ...d }));
  check(await sb().from("herramientas").insert(nuevas.map(fromHerramienta)));
  return nuevas;
}

export async function actualizarHerramienta(
  id: string,
  patch: Partial<Herramienta>
): Promise<Herramienta> {
  const data = check(
    await sb().from("herramientas").update(fromHerramienta(patch)).eq("id", id).select().single()
  );
  return toHerramienta(data);
}

export async function eliminarHerramienta(id: string): Promise<void> {
  const { error } = await sb().from("herramientas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
