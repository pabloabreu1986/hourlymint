// Banco de precios: proveedores, artículos (coste unitario) y partidas
// (recetas descompuestas). Base para presupuestar sin saber pricing.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import { fileToThumbDataURL } from "@/lib/image";
import type { Articulo, Partida, Proveedor } from "@/lib/types";
import * as sb from "./supabase/catalogo";

/**
 * Sube (o convierte, en mock) la foto de un artículo y devuelve su URL.
 * En producción va a un bucket público de Storage; en mock se guarda como
 * data URL comprimido. Acepta un File (subida) o un Blob (pegado del
 * portapapeles).
 */
export async function subirImagenArticulo(file: File | Blob): Promise<string> {
  if (isSupabaseEnabled) return sb.subirImagenArticulo(file);
  return fileToThumbDataURL(file as File, 800, 0.82);
}

// ── Proveedores ──
export async function listProveedores(): Promise<Proveedor[]> {
  if (isSupabaseEnabled) return sb.listProveedores();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .proveedores.filter((p) => p.tenantId === tid)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  );
}

export type NuevoProveedor = Omit<Proveedor, "id" | "tenantId" | "createdAt">;

export async function crearProveedor(data: NuevoProveedor): Promise<Proveedor> {
  if (isSupabaseEnabled) return sb.crearProveedor(data);
  const nuevo: Proveedor = {
    id: uid("prov"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.proveedores.push(nuevo));
  return delay(nuevo);
}

export async function actualizarProveedor(id: string, patch: Partial<Proveedor>): Promise<Proveedor> {
  if (isSupabaseEnabled) return sb.actualizarProveedor(id, patch);
  let out: Proveedor | undefined;
  updateDB((db) => {
    const p = db.proveedores.find((x) => x.id === id);
    if (p) {
      Object.assign(p, patch);
      out = p;
    }
  });
  if (!out) throw new Error("Proveedor no encontrado");
  return delay(out);
}

export async function eliminarProveedor(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarProveedor(id);
  updateDB((db) => {
    db.proveedores = db.proveedores.filter((p) => p.id !== id);
    db.articulos.forEach((a) => {
      if (a.proveedorId === id) a.proveedorId = null;
    });
  });
  return delay(undefined);
}

// ── Artículos ──
export async function listArticulos(): Promise<Articulo[]> {
  if (isSupabaseEnabled) return sb.listArticulos();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .articulos.filter((a) => a.tenantId === tid)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  );
}

export type NuevoArticulo = Omit<Articulo, "id" | "tenantId" | "createdAt">;

export async function crearArticulo(data: NuevoArticulo): Promise<Articulo> {
  if (isSupabaseEnabled) return sb.crearArticulo(data);
  const nuevo: Articulo = {
    id: uid("art"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.articulos.push(nuevo));
  return delay(nuevo);
}

/** Alta en lote (importación de Excel). */
export async function crearArticulos(datos: NuevoArticulo[]): Promise<Articulo[]> {
  if (isSupabaseEnabled) return sb.crearArticulos(datos);
  const tid = tenantActivoId();
  const now = new Date().toISOString();
  const nuevos: Articulo[] = datos.map((d) => ({ id: uid("art"), tenantId: tid, createdAt: now, ...d }));
  updateDB((db) => db.articulos.push(...nuevos));
  return delay(nuevos);
}

export async function actualizarArticulo(id: string, patch: Partial<Articulo>): Promise<Articulo> {
  if (isSupabaseEnabled) return sb.actualizarArticulo(id, patch);
  let out: Articulo | undefined;
  updateDB((db) => {
    const a = db.articulos.find((x) => x.id === id);
    if (a) {
      Object.assign(a, patch);
      out = a;
    }
  });
  if (!out) throw new Error("Artículo no encontrado");
  return delay(out);
}

export async function eliminarArticulo(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarArticulo(id);
  updateDB((db) => {
    db.articulos = db.articulos.filter((a) => a.id !== id);
    // Quitar el artículo de las recetas que lo usen.
    db.partidas.forEach((p) => {
      p.componentes = p.componentes.filter((c) => c.articuloId !== id);
    });
  });
  return delay(undefined);
}

// ── Partidas (recetas) ──
export async function listPartidas(): Promise<Partida[]> {
  if (isSupabaseEnabled) return sb.listPartidas();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .partidas.filter((p) => p.tenantId === tid)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  );
}

export type NuevaPartida = Omit<Partida, "id" | "tenantId" | "createdAt">;

export async function crearPartida(data: NuevaPartida): Promise<Partida> {
  if (isSupabaseEnabled) return sb.crearPartida(data);
  const nueva: Partida = {
    id: uid("part"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.partidas.push(nueva));
  return delay(nueva);
}

export async function actualizarPartida(id: string, patch: Partial<Partida>): Promise<Partida> {
  if (isSupabaseEnabled) return sb.actualizarPartida(id, patch);
  let out: Partida | undefined;
  updateDB((db) => {
    const p = db.partidas.find((x) => x.id === id);
    if (p) {
      Object.assign(p, patch);
      out = p;
    }
  });
  if (!out) throw new Error("Partida no encontrada");
  return delay(out);
}

export async function eliminarPartida(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarPartida(id);
  updateDB((db) => {
    db.partidas = db.partidas.filter((p) => p.id !== id);
  });
  return delay(undefined);
}
