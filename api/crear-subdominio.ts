// Vercel Serverless Function (Node).
// Añade `<slug>.fichaloop.com` como dominio del proyecto en Vercel, para
// que un cliente nuevo tenga su subdominio publicado automáticamente, sin
// pasos manuales. El token de Vercel vive SOLO aquí (variable de entorno
// del servidor), nunca en el navegador.
//
// Requiere la variable de entorno VERCEL_TOKEN en el proyecto de Vercel.
// El id de proyecto/equipo no son secretos (van con defaults).

const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_MQ4rSkFppo1Yeq3v4MlxcfBrALbo";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || "team_r660HR8CG0R3zVEcd5UmVapM";
const DOMINIO = "fichaloop.com";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Falta configurar VERCEL_TOKEN en el servidor." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const slug = String(body.slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return res.status(400).json({ error: "Slug no válido." });
  }

  // Seguridad: solo publicamos subdominios de clientes que existen en la BD.
  const supaUrl = process.env.VITE_SUPABASE_URL;
  const supaKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (supaUrl && supaKey) {
    try {
      const r = await fetch(
        `${supaUrl}/rest/v1/tenants?select=slug&slug=eq.${encodeURIComponent(slug)}`,
        { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } }
      );
      const rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ error: "No existe un cliente con ese slug." });
      }
    } catch {
      // Si la comprobación falla, no bloqueamos el alta.
    }
  }

  const name = `${slug}.${DOMINIO}`;
  const resp = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }
  );
  const data = await resp.json().catch(() => ({} as any));

  // El dominio ya asignado a ESTE proyecto se trata como éxito (idempotente).
  const yaExiste =
    data?.error?.code === "domain_already_in_use" ||
    data?.error?.code === "domain_already_exists";

  if (resp.ok || yaExiste) {
    return res.status(200).json({ ok: true, dominio: name });
  }
  return res
    .status(resp.status || 500)
    .json({ error: data?.error?.message || "No se pudo añadir el dominio.", dominio: name });
}
