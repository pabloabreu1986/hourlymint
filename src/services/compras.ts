// Facturas de proveedor (compras): entra el coste, alimenta el banco de
// precios al aprobarse.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Articulo, FacturaProveedor } from "@/lib/types";
import * as sb from "./supabase/compras";

/** Coste real por unidad de una línea: neto (con descuento) = total / cantidad. */
export const costeNetoLinea = (l: { cantidad: number; total: number; precioUnitario: number }) =>
  l.cantidad > 0 ? Math.round((l.total / l.cantidad) * 100) / 100 : l.precioUnitario;

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
 * Aprueba la compra y sube TODAS sus líneas al banco de precios: crea el
 * artículo si no existe (con su proveedor y coste neto) o actualiza su precio
 * si ya existe (mapeado o mismo nombre). Sin duplicar.
 */
export async function aprobarCompra(id: string): Promise<FacturaProveedor> {
  if (isSupabaseEnabled) return sb.aprobarCompra(id);
  let out: FacturaProveedor | undefined;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  updateDB((db) => {
    const c = db.comprasProveedor.find((x) => x.id === id);
    if (!c) return;
    c.estado = "aprobada";
    const porNombre = new Map(
      db.articulos.filter((a) => a.tenantId === c.tenantId).map((a) => [norm(a.nombre), a])
    );
    for (const l of c.lineas) {
      const neto = costeNetoLinea(l);
      const art = l.articuloId
        ? db.articulos.find((a) => a.id === l.articuloId)
        : porNombre.get(norm(l.descripcion));
      if (art) {
        if (neto > 0) art.coste = neto;
        if (!art.proveedorId && c.proveedorId) art.proveedorId = c.proveedorId;
        if (!art.especificaciones && l.especificaciones) art.especificaciones = l.especificaciones;
        l.articuloId = art.id;
      } else {
        const nuevo: Articulo = {
          id: uid("art"),
          tenantId: c.tenantId,
          referencia: "",
          nombre: l.descripcion || "Artículo",
          proveedorId: c.proveedorId ?? null,
          categoria: "material",
          unidad: l.unidad || "ud",
          coste: neto,
          especificaciones: l.especificaciones,
          createdAt: new Date().toISOString(),
        };
        db.articulos.push(nuevo);
        porNombre.set(norm(nuevo.nombre), nuevo);
        l.articuloId = nuevo.id;
      }
    }
    out = c;
  });
  if (!out) throw new Error("Compra no encontrada");
  return delay(out);
}
