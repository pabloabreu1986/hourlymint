// Módulo hoja para que tanto `seed.ts` como `branding.ts` puedan usar el
// tenant por defecto (y el constructor de tenants nuevos) sin crear un
// ciclo de imports (branding → db → seed → …).
import type { Tenant } from "./types";
import { FUNCIONES_DISPONIBLES, FUNCIONES_FIJAS } from "./funciones";

/** Cliente #1 (FORGEVIA). Sus valores son EXACTAMENTE los que la app
 * tenía hardcodeados, para que el aspecto no cambie. Es también la
 * plantilla base al crear un cliente nuevo. */
export const FORGEVIA_TENANT: Tenant = {
  id: "forgevia",
  slug: "forgevia",
  nombre: "FORGEVIA · Control de Obra",
  nombreCorto: "FORGEVIA",
  eslogan: "PROYECTOS INTEGRALES",
  logotipo: { base: "FORGE", acento: "VIA" },
  logoUrl: null,
  colores: {
    dark: "#232B36",
    slate: "#2E3846",
    steel: "#3B4756",
    orange: "#BE6B39",
    orange600: "#A85B2E",
    orange400: "#D08853",
    canvas: "#F4F5F7",
  },
  // Todas las funciones activas: FORGEVIA es el cliente completo y, además,
  // este objeto es el FALLBACK si la tabla de tenants aún no existe en
  // Supabase; con la lista completa el menú nunca se queda corto.
  funciones: FUNCIONES_DISPONIBLES.map((f) => f.clave),
};

/** Colores de partida al crear un cliente nuevo (paleta neutra). */
export const COLORES_POR_DEFECTO = {
  dark: "#1E293B",
  slate: "#334155",
  steel: "#475569",
  orange: "#2563EB",
  orange600: "#1D4ED8",
  orange400: "#60A5FA",
  canvas: "#F4F5F7",
};

/** id aleatorio corto, sin depender de la capa mock. */
function rid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

/** Nombre → slug URL/subdominio seguro. */
export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Construye un tenant nuevo con la plantilla por defecto, evitando
 * colisiones de slug con los ya ocupados. Compartido por mock y Supabase. */
export function nuevoTenant(nombreCorto: string, slugsOcupados: string[] = []): Tenant {
  const base = nombreCorto.trim() || "Cliente";
  let slug = slugify(base) || "cliente";
  if (slugsOcupados.includes(slug)) slug = `${slug}-${rid().slice(0, 4)}`;
  return {
    // El id coincide con el slug: así el aislamiento de datos por tenant se
    // resuelve de forma síncrona desde el subdominio (ver host.tenantActivoId).
    id: slug,
    slug,
    nombre: `${base} · Control de Obra`,
    nombreCorto: base,
    eslogan: "",
    logoUrl: null,
    colores: { ...COLORES_POR_DEFECTO },
    funciones: [...FUNCIONES_FIJAS],
  };
}
