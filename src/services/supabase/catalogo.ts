import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Articulo, Partida, Proveedor } from "@/lib/types";
import type { NuevoArticulo, NuevaPartida, NuevoProveedor } from "../catalogo";
import {
  toProveedor,
  fromProveedor,
  toArticulo,
  fromArticulo,
  toPartida,
  fromPartida,
  check,
} from "./_map";

// ── Proveedores ──
export async function listProveedores(): Promise<Proveedor[]> {
  const data = check(
    await sb().from("proveedores").select("*").eq("tenant_id", tenantActivoId()).order("nombre")
  );
  return (data ?? []).map(toProveedor);
}

export async function crearProveedor(input: NuevoProveedor): Promise<Proveedor> {
  const nuevo: Proveedor = {
    id: uid("prov"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("proveedores").insert(fromProveedor(nuevo)));
  return nuevo;
}

export async function actualizarProveedor(id: string, patch: Partial<Proveedor>): Promise<Proveedor> {
  const data = check(
    await sb().from("proveedores").update(fromProveedor(patch)).eq("id", id).select().single()
  );
  return toProveedor(data);
}

export async function eliminarProveedor(id: string): Promise<void> {
  const client = sb();
  check(await client.from("articulos").update({ proveedor_id: null }).eq("proveedor_id", id));
  check(await client.from("proveedores").delete().eq("id", id));
}

// ── Artículos ──
export async function listArticulos(): Promise<Articulo[]> {
  const data = check(
    await sb().from("articulos").select("*").eq("tenant_id", tenantActivoId()).order("nombre")
  );
  return (data ?? []).map(toArticulo);
}

export async function crearArticulo(input: NuevoArticulo): Promise<Articulo> {
  const nuevo: Articulo = {
    id: uid("art"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("articulos").insert(fromArticulo(nuevo)));
  return nuevo;
}

export async function actualizarArticulo(id: string, patch: Partial<Articulo>): Promise<Articulo> {
  const data = check(
    await sb().from("articulos").update(fromArticulo(patch)).eq("id", id).select().single()
  );
  return toArticulo(data);
}

export async function eliminarArticulo(id: string): Promise<void> {
  check(await sb().from("articulos").delete().eq("id", id));
}

// ── Partidas ──
export async function listPartidas(): Promise<Partida[]> {
  const data = check(
    await sb().from("partidas").select("*").eq("tenant_id", tenantActivoId()).order("nombre")
  );
  return (data ?? []).map(toPartida);
}

export async function crearPartida(input: NuevaPartida): Promise<Partida> {
  const nueva: Partida = {
    id: uid("part"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("partidas").insert(fromPartida(nueva)));
  return nueva;
}

export async function actualizarPartida(id: string, patch: Partial<Partida>): Promise<Partida> {
  const data = check(
    await sb().from("partidas").update(fromPartida(patch)).eq("id", id).select().single()
  );
  return toPartida(data);
}

export async function eliminarPartida(id: string): Promise<void> {
  check(await sb().from("partidas").delete().eq("id", id));
}
