// Vercel Serverless Function (Node).
// Quita `<slug>.fichaloop.com` del proyecto en Vercel (al eliminar un
// cliente). El token vive solo aquí (variable de entorno del servidor).

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

  const name = `${slug}.${DOMINIO}`;
  const resp = await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${name}?teamId=${VERCEL_TEAM_ID}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await resp.json().catch(() => ({} as any));

  // Si el dominio ya no estaba, lo tratamos como éxito (idempotente).
  const noExistia = resp.status === 404 || data?.error?.code === "not_found";
  if (resp.ok || noExistia) {
    return res.status(200).json({ ok: true, dominio: name });
  }
  return res
    .status(resp.status || 500)
    .json({ error: data?.error?.message || "No se pudo quitar el dominio.", dominio: name });
}
