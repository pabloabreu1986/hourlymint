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
import { FORGEVIA_TENANT } from "./tenant-default";

export { FORGEVIA_TENANT } from "./tenant-default";

/** Slug del subdominio actual, o null en localhost / dominio raíz.
 * `forgevia.fichaloop.com` → "forgevia"; `fichaloop.com` / `localhost` → null. */
function slugDeSubdominio(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host === "localhost" || /^[\d.]+$/.test(host)) return null;
  const partes = host.split(".");
  if (partes.length < 3) return null; // necesita sub.dominio.tld
  const sub = partes[0];
  return sub === "www" ? null : sub;
}

/** Resuelve el tenant activo desde la DB por subdominio, con fallback al
 * cliente por defecto (así en local siempre se ve FORGEVIA). */
export function resolverTenant(): Tenant {
  const tenants = loadDB().tenants ?? [];
  const slug = slugDeSubdominio();
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

/** Re-resuelve el tenant activo y re-aplica el tema. Llamar tras editar
 * la marca del tenant activo desde el panel super-admin. */
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

  document.title = t.nombre;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", t.colores.dark);
}
