// ─────────────────────────────────────────────────────────────
// Marca por cliente (white-label). La configuración de cada tenant
// vive como DATO (mock DB hoy, BD mañana) y la administra el super-admin
// desde su panel. La UI la consume siempre por aquí / `tenantApi`, nunca
// hardcodeando la marca.
//
// `resolverTenant()` elige el tenant activo por subdominio
// (forgevia.fichaloop.com); en localhost / dominio raíz cae al cliente
// por defecto. La resolución es perezosa y cacheada para que componentes
// síncronos (el logo) no tengan que ser async.
// ─────────────────────────────────────────────────────────────
import type { Tenant } from "./types";
import { loadDB } from "./db";
import { isSupabaseEnabled } from "./supabase";
import { FORGEVIA_TENANT } from "./tenant-default";
import { slugTenant, esApex } from "./host";

export { FORGEVIA_TENANT } from "./tenant-default";

// En modo Supabase el tenant llega de forma asíncrona (fetch por
// subdominio). Para que `tenantActual()` siga siendo síncrono (lo usan
// el logo y demás), cacheamos el último tenant conocido en localStorage,
// por slug. Así el tema correcto se aplica al instante en visitas
// siguientes; en la primera se ve el tema por defecto un instante.
const CLAVE_CACHE = "fichaloop.tenant";

function claveDe(slug: string | null): string {
  return `${CLAVE_CACHE}.${slug ?? "_apex"}`;
}

function leerCache(slug: string | null): Tenant | null {
  try {
    const raw = localStorage.getItem(claveDe(slug));
    return raw ? (JSON.parse(raw) as Tenant) : null;
  } catch {
    return null;
  }
}

function escribirCache(t: Tenant): void {
  try {
    localStorage.setItem(claveDe(t.slug), JSON.stringify(t));
  } catch {
    /* cuota / modo privado: ignoramos */
  }
}

/** Resuelve el tenant activo (síncrono). En Supabase, desde la caché
 * local con fallback al cliente por defecto; en mock, desde el mock DB. */
export function resolverTenant(): Tenant {
  const slug = slugTenant();

  if (isSupabaseEnabled) {
    return leerCache(slug) ?? FORGEVIA_TENANT;
  }

  const tenants = loadDB().tenants ?? [];
  if (slug) {
    const porSlug = tenants.find((t) => t.slug === slug);
    if (porSlug) return porSlug;
  }
  return (
    tenants.find((t) => t.id === FORGEVIA_TENANT.id) ??
    tenants[0] ??
    FORGEVIA_TENANT
  );
}

// Cache perezosa: se resuelve en el primer uso (no al cargar el módulo,
// para no tocar la DB durante la evaluación de imports).
let _cache: Tenant | null = null;

export function tenantActual(): Tenant {
  if (!_cache) _cache = resolverTenant();
  return _cache;
}

/** Fija el tenant activo (tras hidratar desde Supabase o guardar en el
 * panel): actualiza la caché en memoria y localStorage, y re-aplica el
 * tema si es el tenant que se está mostrando. */
export function fijarTenant(t: Tenant): Tenant {
  escribirCache(t);
  if (t.slug === (slugTenant() ?? t.slug)) {
    _cache = t;
    aplicarTema(t);
  }
  return t;
}

/** Re-resuelve el tenant activo y re-aplica el tema. */
export function refrescarTenant(): Tenant {
  _cache = resolverTenant();
  aplicarTema(_cache);
  return _cache;
}

/** "#232B36" → "35 43 54" (canales RGB, para `rgb(var() / <alpha>)`). */
function canales(hex: string): string {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Inyecta la paleta del tenant como variables CSS en :root y ajusta
 * título y color de tema. Debe llamarse antes del primer render. */
export function aplicarTema(t: Tenant = tenantActual()): void {
  if (typeof document === "undefined") return;
  const raiz = document.documentElement.style;
  const c = t.colores;
  raiz.setProperty("--brand-dark", canales(c.dark));
  raiz.setProperty("--brand-slate", canales(c.slate));
  raiz.setProperty("--brand-steel", canales(c.steel));
  raiz.setProperty("--brand-orange", canales(c.orange));
  raiz.setProperty("--brand-orange-600", canales(c.orange600));
  raiz.setProperty("--brand-orange-400", canales(c.orange400));
  raiz.setProperty("--brand-canvas", canales(c.canvas));

  // En el dominio raíz (marketing) el título es de la plataforma; en el
  // subdominio de un cliente, el de su marca.
  document.title = esApex() ? "fichaloop · Control de obra y equipo" : t.nombre;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", t.colores.dark);
}
