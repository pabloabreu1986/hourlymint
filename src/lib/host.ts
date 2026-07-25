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
