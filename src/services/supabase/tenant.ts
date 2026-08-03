// Servicio de tenants sobre Supabase. Resiliente: si la tabla `tenants`
// aún no existe (deploy anterior a aplicar la migración), devuelve el
// cliente por defecto para que la app NO se rompa. La marca real de cada
// cliente aparece en cuanto se aplica el SQL y se crean los tenants.
import { sb } from "@/lib/supabase";
import { slugTenant } from "@/lib/host";
import { FORGEVIA_TENANT, nuevoTenant } from "@/lib/tenant-default";
import type { Tenant } from "@/lib/types";
import { toTenant, fromTenant, check } from "./_map";

/** Tenant activo, resuelto por subdominio. Apex → cliente por defecto. */
export async function getTenant(): Promise<Tenant> {
  const slug = slugTenant();
  if (!slug) return FORGEVIA_TENANT;
  try {
    const { data, error } = await sb()
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return FORGEVIA_TENANT;
    return toTenant(data);
  } catch {
    return FORGEVIA_TENANT;
  }
}

/** Busca un cliente por slug (tenant discovery del apex). */
export async function getTenantPorSlug(slug: string): Promise<Tenant | null> {
  try {
    const { data, error } = await sb()
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return toTenant(data);
  } catch {
    return null;
  }
}

export async function listTenants(): Promise<Tenant[]> {
  try {
    const { data, error } = await sb().from("tenants").select("*").order("nombre");
    if (error || !data) return [FORGEVIA_TENANT];
    return data.map(toTenant);
  } catch {
    return [FORGEVIA_TENANT];
  }
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  try {
    const { data, error } = await sb().from("tenants").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return toTenant(data);
  } catch {
    return null;
  }
}

export async function crearTenant(nombreCorto: string): Promise<Tenant> {
  const ocupados = (await listTenants()).map((t) => t.slug);
  const tenant = nuevoTenant(nombreCorto, ocupados);
  check(await sb().from("tenants").insert(fromTenant(tenant)));
  return tenant;
}

export async function guardarTenant(tenant: Tenant): Promise<Tenant> {
  check(await sb().from("tenants").upsert(fromTenant(tenant)));
  return tenant;
}

/** Borra el cliente y todos sus datos. Orden: primero las tablas que
 * referencian a obras/usuarios, luego obras, luego usuarios, luego el
 * propio tenant (para no chocar con claves foráneas). */
export async function eliminarTenant(id: string): Promise<void> {
  const client = sb();
  const hijas = [
    "fichajes",
    "fotos",
    "obra_adjuntos",
    "partes",
    "incidencias",
    "notificaciones",
    "vehiculos",
    "herramientas",
    "almacen",
  ];
  for (const tabla of [...hijas, "obras", "usuarios"]) {
    const { error } = await client.from(tabla).delete().eq("tenant_id", id);
    if (error) throw new Error(`Error al borrar ${tabla}: ${error.message}`);
  }
  const { error } = await client.from("tenants").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
