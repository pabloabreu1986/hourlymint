// Vercel Serverless Function (Node).
// Previsualización al compartir (Open Graph) por cliente. Los crawlers de
// WhatsApp/Facebook/Telegram… no ejecutan JavaScript, así que la SPA
// siempre les daría los metadatos genéricos de fichaloop. vercel.json
// redirige aquí SOLO a esos bots (por user-agent): esta función lee el
// tenant del subdominio en Supabase y devuelve un HTML mínimo con su
// título, su descripción (qué hace la empresa) y su logo, más la mención
// a fichaloop como socio tecnológico.
//
// Requiere en Vercel: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (las
// mismas del build del cliente).

const DOMINIO = "fichaloop.com";
const OG_FICHALOOP = "https://www.fichaloop.com/og-fichaloop.png";

/* eslint-disable @typescript-eslint/no-explicit-any */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function slugDe(host: string): string | null {
  const h = (host || "").toLowerCase().split(":")[0];
  if (h === DOMINIO || h === `www.${DOMINIO}`) return null;
  if (h.endsWith(`.${DOMINIO}`)) return h.slice(0, -(DOMINIO.length + 1)).split(".")[0];
  return null;
}

async function tenantDe(slug: string): Promise<any | null> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const r = await fetch(
      `${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=nombre,nombre_corto,eslogan,web,logo_url&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!r.ok) return null;
    const filas = await r.json();
    return filas?.[0] ?? null;
  } catch {
    return null;
  }
}

function html(m: {
  titulo: string;
  descripcion: string;
  url: string;
  imagen: string;
  siteName: string;
}): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${esc(m.titulo)}</title>
<meta name="description" content="${esc(m.descripcion)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${esc(m.siteName)}" />
<meta property="og:title" content="${esc(m.titulo)}" />
<meta property="og:description" content="${esc(m.descripcion)}" />
<meta property="og:url" content="${esc(m.url)}" />
<meta property="og:image" content="${esc(m.imagen)}" />
<meta property="og:locale" content="es_ES" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(m.titulo)}" />
<meta name="twitter:description" content="${esc(m.descripcion)}" />
<meta name="twitter:image" content="${esc(m.imagen)}" />
</head>
<body>
<p><a href="${esc(m.url)}">${esc(m.titulo)}</a></p>
<script>location.replace("/");</script>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? DOMINIO);
  const urlPagina = `https://${host}/`;
  const slug = slugDe(host);

  // Metadatos de fichaloop (apex o fallback si el tenant no aparece).
  let salida = {
    titulo: "fichaloop · Control de obra y equipo",
    descripcion:
      "Fichajes con GPS, partes diarios, fotos y horas reales. Y la gestión de tu equipo: ausencias, turnos, gastos y nómina. Todo en una sola app. Sin papeles.",
    url: urlPagina,
    imagen: OG_FICHALOOP,
    siteName: "fichaloop",
  };

  if (slug) {
    const t = await tenantDe(slug);
    if (t) {
      const hero = Array.isArray(t.web) ? t.web.find((s: any) => s?.tipo === "hero") : null;
      const nombreCorto = t.nombre_corto || slug;
      const queHace: string =
        (hero?.subtitulo || hero?.titulo || t.eslogan || `Conoce a ${nombreCorto} y cuéntanos tu proyecto.`).trim();
      const descripcion = `${queHace.slice(0, 180)} — Impulsada por fichaloop, su socio tecnológico.`;
      salida = {
        titulo: t.eslogan ? `${nombreCorto} · ${t.eslogan}` : t.nombre || nombreCorto,
        descripcion,
        url: urlPagina,
        // Si el cliente tiene logo subido, lo servimos como miniatura;
        // si no, la imagen de fichaloop.
        imagen: t.logo_url ? `https://${host}/api/og-imagen` : OG_FICHALOOP,
        siteName: nombreCorto,
      };
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cache en el edge 10 min: los bots comparten la misma respuesta.
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
  return res.status(200).send(html(salida));
}
