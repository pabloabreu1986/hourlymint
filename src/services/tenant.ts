// Servicio de tenants (marca/white-label). Enruta a Supabase si está
// configurado; si no, al mock (localStorage). La UI lo consume desde el
// barrel (`tenantApi`).
import { loadDB, updateDB, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { resolverTenant } from "@/lib/branding";
import { nuevoTenant } from "@/lib/tenant-default";
import type { Tenant } from "@/lib/types";
import * as sb from "./supabase/tenant";

/** Tenant activo (según subdominio; en local, FORGEVIA). */
export async function getTenant(): Promise<Tenant> {
  if (isSupabaseEnabled) return sb.getTenant();
  return delay(resolverTenant());
}

/** Todos los clientes (para el panel super-admin). */
export async function listTenants(): Promise<Tenant[]> {
  if (isSupabaseEnabled) return sb.listTenants();
  return delay([...loadDB().tenants]);
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  if (isSupabaseEnabled) return sb.getTenantById(id);
  return delay(loadDB().tenants.find((t) => t.id === id) ?? null, 0);
}

/** Crea un cliente nuevo con la plantilla por defecto y lo persiste. */
export async function crearTenant(nombreCorto: string): Promise<Tenant> {
  if (isSupabaseEnabled) return sb.crearTenant(nombreCorto);
  const ocupados = loadDB().tenants.map((t) => t.slug);
  const tenant = nuevoTenant(nombreCorto, ocupados);
  updateDB((d) => d.tenants.push(tenant));
  return delay(tenant);
}

/** Actualiza (upsert) un cliente existente. */
export async function guardarTenant(tenant: Tenant): Promise<Tenant> {
  if (isSupabaseEnabled) return sb.guardarTenant(tenant);
  updateDB((d) => {
    const i = d.tenants.findIndex((t) => t.id === tenant.id);
    if (i >= 0) d.tenants[i] = tenant;
    else d.tenants.push(tenant);
  });
  return delay(tenant);
}
