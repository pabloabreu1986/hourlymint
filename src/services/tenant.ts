// Servicio de tenants (marca/white-label). Enruta a Supabase si está
// configurado; si no, al mock (localStorage). La UI lo consume desde el
// barrel (`tenantApi`).
import { loadDB, updateDB, delay, uid } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { resolverTenant } from "@/lib/branding";
import { nuevoTenant } from "@/lib/tenant-default";
import type { Dosier, Tenant } from "@/lib/types";
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

/** Busca un cliente por su slug (para el "entra en tu espacio" del apex). */
export async function getTenantPorSlug(slug: string): Promise<Tenant | null> {
  if (isSupabaseEnabled) return sb.getTenantPorSlug(slug);
  return delay(loadDB().tenants.find((t) => t.slug === slug) ?? null, 0);
}

/**
 * El admin del cliente actualiza los datos de contacto de su web pública
 * (la sección "cta"): teléfono, WhatsApp y email del formulario
 * "Cuéntanos tu proyecto". Devuelve el tenant actualizado, o null si el
 * cliente no tiene web configurada (nada que actualizar).
 */
export async function actualizarContactoWeb(datos: {
  telefono: string;
  email: string;
  whatsapp: string;
}): Promise<Tenant | null> {
  const t = await getTenant();
  if (!t.web || t.web.length === 0) return null;
  const hayCta = t.web.some((s) => s.tipo === "cta");
  const web = hayCta
    ? t.web.map((s) => (s.tipo === "cta" ? { ...s, ...datos } : s))
    : [
        ...t.web,
        {
          id: uid("ws"),
          tipo: "cta" as const,
          titulo: "¿Hablamos?",
          subtitulo: "",
          items: [],
          ...datos,
        },
      ];
  return guardarTenant({ ...t, web });
}

/**
 * El admin del cliente guarda su dosier corporativo (lo edita entero
 * desde su panel). Persiste sobre el tenant actual y devuelve el tenant
 * actualizado para refrescar la caché de marca local.
 */
export async function actualizarDosier(dosier: Dosier): Promise<Tenant> {
  const t = await getTenant();
  return guardarTenant({ ...t, dosier });
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

/**
 * Elimina un cliente y TODOS sus datos (obras, usuarios, fichajes, partes,
 * fotos, adjuntos, incidencias, notificaciones y recursos). Operación
 * destructiva e irreversible. NO borra el subdominio de Vercel: eso lo
 * orquesta el panel aparte (plataformaApi.eliminarSubdominio).
 */
export async function eliminarTenant(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarTenant(id);
  updateDB((d) => {
    d.fichajes = d.fichajes.filter((x) => x.tenantId !== id);
    d.fotos = d.fotos.filter((x) => x.tenantId !== id);
    d.adjuntos = d.adjuntos.filter((x) => x.tenantId !== id);
    d.partes = d.partes.filter((x) => x.tenantId !== id);
    d.incidencias = d.incidencias.filter((x) => x.tenantId !== id);
    d.notificaciones = d.notificaciones.filter((x) => x.tenantId !== id);
    d.vehiculos = d.vehiculos.filter((x) => x.tenantId !== id);
    d.herramientas = d.herramientas.filter((x) => x.tenantId !== id);
    d.almacen = d.almacen.filter((x) => x.tenantId !== id);
    d.obras = d.obras.filter((x) => x.tenantId !== id);
    d.usuarios = d.usuarios.filter((x) => x.tenantId !== id);
    d.tenants = d.tenants.filter((x) => x.id !== id);
  });
  return delay(undefined);
}
