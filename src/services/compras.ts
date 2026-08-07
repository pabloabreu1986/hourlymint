// Facturas de proveedor (compras): entra el coste, alimenta el banco de
// precios al aprobarse.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { FacturaProveedor } from "@/lib/types";
import * as sb from "./supabase/compras";

export async function listCompras(): Promise<FacturaProveedor[]> {
  if (isSupabaseEnabled) return sb.listCompras();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .comprasProveedor.filter((c) => c.tenantId === tid)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export async function getCompra(id: string): Promise<FacturaProveedor | null> {
  if (isSupabaseEnabled) return sb.getCompra(id);
  const tid = tenantActivoId();
  return delay(
    loadDB().comprasProveedor.find((c) => c.id === id && c.tenantId === tid) ?? null,
    0
  );
}

export type NuevaCompra = Omit<FacturaProveedor, "id" | "tenantId" | "createdAt">;

export async function crearCompra(data: NuevaCompra): Promise<FacturaProveedor> {
  if (isSupabaseEnabled) return sb.crearCompra(data);
  const nueva: FacturaProveedor = {
    id: uid("cmp"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.comprasProveedor.push(nueva));
  return delay(nueva);
}

export async function actualizarCompra(
  id: string,
  patch: Partial<FacturaProveedor>
): Promise<FacturaProveedor> {
  if (isSupabaseEnabled) return sb.actualizarCompra(id, patch);
  let out: FacturaProveedor | undefined;
  updateDB((db) => {
    const c = db.comprasProveedor.find((x) => x.id === id);
    if (c) {
      Object.assign(c, patch);
      out = c;
    }
  });
  if (!out) throw new Error("Compra no encontrada");
  return delay(out);
}

export async function eliminarCompra(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarCompra(id);
  updateDB((db) => {
    db.comprasProveedor = db.comprasProveedor.filter((c) => c.id !== id);
  });
  return delay(undefined);
}

/**
 * Aprueba la compra y actualiza el coste de los artículos del catálogo que
 * estén mapeados en sus líneas (último precio conocido).
 */
export async function aprobarCompra(id: string): Promise<FacturaProveedor> {
  if (isSupabaseEnabled) return sb.aprobarCompra(id);
  let out: FacturaProveedor | undefined;
  updateDB((db) => {
    const c = db.comprasProveedor.find((x) => x.id === id);
    if (!c) return;
    c.estado = "aprobada";
    for (const l of c.lineas) {
      if (l.articuloId) {
        const art = db.articulos.find((a) => a.id === l.articuloId);
        if (art && l.precioUnitario > 0) art.coste = l.precioUnitario;
      }
    }
    out = c;
  });
  if (!out) throw new Error("Compra no encontrada");
  return delay(out);
}
