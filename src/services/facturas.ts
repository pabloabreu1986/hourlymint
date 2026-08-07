// Facturas emitidas a los clientes (opcionalmente ligadas a una obra).
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Factura } from "@/lib/types";
import * as sb from "./supabase/facturas";

export async function listFacturas(): Promise<Factura[]> {
  if (isSupabaseEnabled) return sb.listFacturas();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .facturas.filter((f) => f.tenantId === tid)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export type NuevaFactura = Omit<Factura, "id" | "tenantId" | "createdAt">;

export async function crearFactura(data: NuevaFactura): Promise<Factura> {
  if (isSupabaseEnabled) return sb.crearFactura(data);
  const nueva: Factura = {
    id: uid("f"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.facturas.push(nueva));
  return delay(nueva);
}

export async function actualizarFactura(id: string, patch: Partial<Factura>): Promise<Factura> {
  if (isSupabaseEnabled) return sb.actualizarFactura(id, patch);
  let out: Factura | undefined;
  updateDB((db) => {
    const f = db.facturas.find((x) => x.id === id);
    if (f) {
      Object.assign(f, patch);
      out = f;
    }
  });
  if (!out) throw new Error("Factura no encontrada");
  return delay(out);
}

export async function eliminarFactura(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarFactura(id);
  updateDB((db) => {
    db.facturas = db.facturas.filter((f) => f.id !== id);
  });
  return delay(undefined);
}
