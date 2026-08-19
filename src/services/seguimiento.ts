// Seguimiento comercial (CRM): historial cronológico de interacciones
// (llamadas, emails, visitas, dossiers, notas…) con un contacto. Al registrar
// una interacción se actualiza la fecha de último contacto del cliente.
// Mock-first con seam a Supabase.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Interaccion } from "@/lib/types";
import * as sb from "./supabase/seguimiento";

/** Interacciones de un cliente (más recientes primero). */
export async function listInteracciones(clienteId: string): Promise<Interaccion[]> {
  if (isSupabaseEnabled) return sb.listInteracciones(clienteId);
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .interacciones.filter((i) => i.tenantId === tid && i.clienteId === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

/** Todas las interacciones del tenant (para paneles/KPIs). */
export async function listInteraccionesTenant(): Promise<Interaccion[]> {
  if (isSupabaseEnabled) return sb.listInteraccionesTenant();
  const tid = tenantActivoId();
  return delay(loadDB().interacciones.filter((i) => i.tenantId === tid));
}

export type NuevaInteraccion = Omit<Interaccion, "id" | "tenantId" | "createdAt">;

export async function crearInteraccion(data: NuevaInteraccion): Promise<Interaccion> {
  if (isSupabaseEnabled) return sb.crearInteraccion(data);
  const nueva: Interaccion = {
    id: uid("int"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => {
    db.interacciones.push(nueva);
    const c = db.clientes.find((x) => x.id === data.clienteId);
    if (c) c.fechaUltimoContacto = nueva.fecha.slice(0, 10);
  });
  return delay(nueva);
}

export async function eliminarInteraccion(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarInteraccion(id);
  updateDB((db) => {
    db.interacciones = db.interacciones.filter((i) => i.id !== id);
  });
  return delay(undefined);
}
