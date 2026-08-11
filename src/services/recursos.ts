import { loadDB, updateDB, uid, delay } from "@/lib/db";
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

// ── Vehículos: alta / edición / baja ──
export type NuevoVehiculo = Omit<Vehiculo, "id" | "tenantId">;

export async function crearVehiculo(data: NuevoVehiculo): Promise<Vehiculo> {
  if (isSupabaseEnabled) return sb.crearVehiculo(data);
  const nuevo: Vehiculo = { id: uid("v"), tenantId: tenantActivoId(), ...data };
  updateDB((db) => db.vehiculos.push(nuevo));
  return delay(nuevo);
}

export async function actualizarVehiculo(id: string, patch: Partial<Vehiculo>): Promise<Vehiculo> {
  if (isSupabaseEnabled) return sb.actualizarVehiculo(id, patch);
  let out: Vehiculo | undefined;
  updateDB((db) => {
    const v = db.vehiculos.find((x) => x.id === id);
    if (v) {
      Object.assign(v, patch);
      out = v;
    }
  });
  if (!out) throw new Error("Vehículo no encontrado");
  return delay(out);
}

export async function eliminarVehiculo(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarVehiculo(id);
  updateDB((db) => {
    db.vehiculos = db.vehiculos.filter((v) => v.id !== id);
  });
  return delay(undefined);
}

// ── Herramientas: alta (incl. importación en lote) / edición / baja ──
export type NuevaHerramienta = Omit<Herramienta, "id" | "tenantId">;

export async function crearHerramienta(data: NuevaHerramienta): Promise<Herramienta> {
  if (isSupabaseEnabled) return sb.crearHerramienta(data);
  const nueva: Herramienta = { id: uid("h"), tenantId: tenantActivoId(), ...data };
  updateDB((db) => db.herramientas.push(nueva));
  return delay(nueva);
}

/** Alta en lote (importación desde Excel/PDF/CSV). */
export async function crearHerramientas(datos: NuevaHerramienta[]): Promise<Herramienta[]> {
  if (isSupabaseEnabled) return sb.crearHerramientas(datos);
  const tid = tenantActivoId();
  const nuevas: Herramienta[] = datos.map((d) => ({ id: uid("h"), tenantId: tid, ...d }));
  updateDB((db) => db.herramientas.push(...nuevas));
  return delay(nuevas);
}

export async function actualizarHerramienta(
  id: string,
  patch: Partial<Herramienta>
): Promise<Herramienta> {
  if (isSupabaseEnabled) return sb.actualizarHerramienta(id, patch);
  let out: Herramienta | undefined;
  updateDB((db) => {
    const h = db.herramientas.find((x) => x.id === id);
    if (h) {
      Object.assign(h, patch);
      out = h;
    }
  });
  if (!out) throw new Error("Herramienta no encontrada");
  return delay(out);
}

export async function eliminarHerramienta(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarHerramienta(id);
  updateDB((db) => {
    db.herramientas = db.herramientas.filter((h) => h.id !== id);
  });
  return delay(undefined);
}
