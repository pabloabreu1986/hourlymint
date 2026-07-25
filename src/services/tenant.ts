// Servicio de tenants (marca/white-label). Hoy sobre el mock DB
// (localStorage); mañana este módulo hablará con la BD real y resolverá
// el tenant por subdominio, sin que la UI cambie. La UI lo consume desde
// el barrel (`tenantApi`).
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { resolverTenant } from "@/lib/branding";
import { COLORES_POR_DEFECTO } from "@/lib/tenant-default";
import { FUNCIONES_FIJAS } from "@/lib/funciones";
import type { Tenant } from "@/lib/types";

/** Tenant activo (según subdominio; en local, FORGEVIA). */
export async function getTenant(): Promise<Tenant> {
  return delay(resolverTenant());
}

/** Todos los clientes (para el panel super-admin). */
export async function listTenants(): Promise<Tenant[]> {
  return delay([...loadDB().tenants]);
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  return delay(loadDB().tenants.find((t) => t.id === id) ?? null, 0);
}

/** Slug URL-safe a partir del nombre corto. */
function aSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Crea un cliente nuevo con la plantilla por defecto y lo persiste. */
export async function crearTenant(nombreCorto: string): Promise<Tenant> {
  const base = nombreCorto.trim() || "Cliente";
  const db = loadDB();
  let slug = aSlug(base) || "cliente";
  // Evitar colisión de slug (= subdominio).
  if (db.tenants.some((t) => t.slug === slug)) slug = `${slug}-${uid("").slice(1, 5)}`;

  const tenant: Tenant = {
    id: uid("tn"),
    slug,
    nombre: `${base} · Control de Obra`,
    nombreCorto: base,
    eslogan: "",
    logoUrl: null,
    colores: { ...COLORES_POR_DEFECTO },
    funciones: [...FUNCIONES_FIJAS],
  };
  updateDB((d) => d.tenants.push(tenant));
  return delay(tenant);
}

/** Actualiza (upsert) un cliente existente. */
export async function guardarTenant(tenant: Tenant): Promise<Tenant> {
  updateDB((d) => {
    const i = d.tenants.findIndex((t) => t.id === tenant.id);
    if (i >= 0) d.tenants[i] = tenant;
    else d.tenants.push(tenant);
  });
  return delay(tenant);
}
