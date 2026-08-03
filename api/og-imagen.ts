// Vercel Serverless Function (Node).
// Sirve el logo del tenant como imagen real para la miniatura de
// compartir (og:image). El logo vive como data URL en la BD (subido
// desde el panel del super-admin); los crawlers necesitan una URL http
// de verdad, así que aquí lo decodificamos y lo devolvemos como imagen.
// Sin logo → redirige a la imagen de fichaloop.

const DOMINIO = "fichaloop.com";
const OG_FICHALOOP = "https://www.fichaloop.com/og-fichaloop.png";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function handler(req: any, res: any) {
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").toLowerCase().split(":")[0];
  const slug = host.endsWith(`.${DOMINIO}`) ? host.slice(0, -(DOMINIO.length + 1)).split(".")[0] : null;

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!slug || !url || !key) return res.redirect(302, OG_FICHALOOP);

  try {
    const r = await fetch(
      `${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=logo_url&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const logo: string | null = (await r.json())?.[0]?.logo_url ?? null;
    const m = logo?.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
    if (!m) return res.redirect(302, OG_FICHALOOP);

    const buf = Buffer.from(m[2], "base64");
    res.setHeader("Content-Type", m[1]);
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(buf);
  } catch {
    return res.redirect(302, OG_FICHALOOP);
  }
}
