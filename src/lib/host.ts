// ─────────────────────────────────────────────────────────────
// Resolución de host: distinguir el dominio raíz (marketing,
// fichaloop.com) de un subdominio de cliente (nombreempresa.fichaloop.com).
//
// Reglas:
//   - fichaloop.com / www.fichaloop.com  → apex (web de marketing).
//   - <slug>.fichaloop.com               → cliente con ese slug.
//   - Cualquier otro host (localhost, *.vercel.app, ngrok, IP…) → por
//     defecto la app del cliente FORGEVIA, para NO romper el acceso actual
//     mientras el DNS de fichaloop.com no esté configurado.
//
// Overrides para previsualizar sin DNS:  ?t=apex (marketing) · ?t=<slug>.
// ─────────────────────────────────────────────────────────────

export const DOMINIO_PLATAFORMA = "fichaloop.com";

/** Cliente por defecto en hosts que no son fichaloop.com (dev/preview). */
const SLUG_POR_DEFECTO = "forgevia";

/** Slug del cliente activo, o null si estamos en el apex (marketing). */
export function slugTenant(): string | null {
  if (typeof window === "undefined") return SLUG_POR_DEFECTO;

  // Override para previsualizar en local / preview / ngrok.
  const q = new URLSearchParams(window.location.search).get("t");
  if (q) return q === "apex" ? null : q.toLowerCase();

  const host = window.location.hostname.toLowerCase();

  // Dominio real de la plataforma.
  if (host === DOMINIO_PLATAFORMA || host === `www.${DOMINIO_PLATAFORMA}`) {
    return null; // apex → marketing
  }
  if (host.endsWith(`.${DOMINIO_PLATAFORMA}`)) {
    return host.slice(0, -`.${DOMINIO_PLATAFORMA}`.length).split(".")[0];
  }

  // Resto de hosts (dev/preview): app del cliente por defecto.
  return SLUG_POR_DEFECTO;
}

/** true si estamos en el dominio raíz (web de marketing), no en un cliente. */
export function esApex(): boolean {
  return slugTenant() === null;
}

/**
 * Id del tenant activo, para filtrar y estampar datos (aislamiento
 * multi-tenant). El id de cada tenant coincide con su slug (subdominio).
 * En el apex no se consultan datos de cliente; devolvemos el por defecto.
 */
export function tenantActivoId(): string {
  return slugTenant() ?? SLUG_POR_DEFECTO;
}

/**
 * ¿Puede este usuario acceder por el dominio actual?
 * - En el apex (fichaloop.com): solo el super-admin de la plataforma.
 * - En un subdominio de cliente: solo usuarios de ESE cliente (nunca el
 *   super-admin). Es la barrera clave contra el cruce entre clientes.
 */
export function usuarioPermitidoEnHost(u: { rol: string; tenantId: string }): boolean {
  if (esApex()) return u.rol === "superadmin";
  return u.rol !== "superadmin" && u.tenantId === tenantActivoId();
}

// ─── "Recordar mi espacio" (tenant discovery en el apex) ─────
// El subdominio de cada cliente guarda su slug en una cookie del dominio
// padre (.fichaloop.com). Así, cuando alguien vuelve a fichaloop.com, la
// web puede ofrecerle "Continuar a tuempresa →" sin exponer la lista de
// clientes.

const COOKIE_ESPACIO = "fichaloop_espacio";

/** Llamar al arrancar la app: si estamos en un subdominio real de la
 * plataforma, recuerda este espacio en la cookie compartida. */
export function recordarEspacio(): void {
  if (typeof document === "undefined") return;
  const slug = slugTenant();
  const host = window.location.hostname.toLowerCase();
  if (!slug || !host.endsWith(`.${DOMINIO_PLATAFORMA}`)) return;
  const seisMeses = 60 * 60 * 24 * 180;
  document.cookie =
    `${COOKIE_ESPACIO}=${slug}; domain=.${DOMINIO_PLATAFORMA}; path=/; ` +
    `max-age=${seisMeses}; SameSite=Lax; Secure`;
}

/** Último espacio visitado (o null si no hay cookie). */
export function ultimoEspacio(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)fichaloop_espacio=([a-z0-9-]+)/);
  return m ? m[1] : null;
}

/** URL del espacio de un cliente. En el dominio real → su subdominio;
 * en dev/preview (localhost, *.vercel.app) → override `?t=` local. */
export function urlDeEspacio(slug: string): string {
  const host = window.location.hostname.toLowerCase();
  const esDominioReal =
    host === DOMINIO_PLATAFORMA || host === `www.${DOMINIO_PLATAFORMA}` ||
    host.endsWith(`.${DOMINIO_PLATAFORMA}`);
  if (esDominioReal) return `https://${slug}.${DOMINIO_PLATAFORMA}/`;
  return `${window.location.origin}/?t=${slug}`;
}
