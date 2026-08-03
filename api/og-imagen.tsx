// Vercel Edge Function. Genera la tarjeta 1200×630 de previsualización
// (og:image) de cada cliente con SU marca: colores, logotipo/nombre,
// eslogan y su logo si lo tiene subido. Es la imagen que sale al
// compartir empresa.fichaloop.com por WhatsApp/redes.
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const DOMINIO = "fichaloop.com";
const OG_FICHALOOP = "https://www.fichaloop.com/og-fichaloop.png";

async function tenantDe(slug: string) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const r = await fetch(
      `${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=nombre_corto,eslogan,logotipo,logo_url,colores&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!r.ok) return null;
    return (await r.json())?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req: Request) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .toLowerCase()
    .split(":")[0];
  const slug = host.endsWith(`.${DOMINIO}`) ? host.slice(0, -(DOMINIO.length + 1)).split(".")[0] : null;
  const t = slug ? await tenantDe(slug) : null;
  if (!t) return Response.redirect(OG_FICHALOOP, 302);

  const c = t.colores ?? {};
  const dark = c.dark ?? "#232B36";
  const orange = c.orange ?? "#BE6B39";
  const nombre = t.nombre_corto ?? slug;
  const base = t.logotipo?.base ?? nombre;
  const acento = t.logotipo?.acento ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: dark,
          color: "#fff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Halo de acento arriba a la derecha */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: orange,
            opacity: 0.25,
            filter: "blur(90px)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Logotipo del cliente */}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {t.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.logo_url} width={96} height={96} style={{ objectFit: "contain" }} />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
                <span>{base}</span>
                {acento ? <span style={{ color: orange }}>{acento}</span> : null}
              </div>
              {t.eslogan ? (
                <div style={{ fontSize: 22, letterSpacing: 8, color: "rgba(255,255,255,0.55)" }}>
                  {String(t.eslogan).toUpperCase()}
                </div>
              ) : null}
            </div>
          </div>

          {/* Mensaje */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ width: 88, height: 8, background: orange, display: "flex" }} />
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1, display: "flex" }}>
              Cuéntanos tu proyecto.
            </div>
          </div>

          {/* Pie: dominio + fichaloop */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 24,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.85)" }}>{host}</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>impulsada por fichaloop</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
