// Operaciones de plataforma (super-admin): hablan con las funciones
// serverless del propio proyecto (/api/*). Solo funcionan en producción
// (en local/mock no hay /api y devuelven un resultado no-ok sin romper).

export interface ResultadoSubdominio {
  ok: boolean;
  mensaje: string;
}

/** Publica `<slug>.fichaloop.com` en Vercel (idempotente). */
export async function publicarSubdominio(slug: string): Promise<ResultadoSubdominio> {
  try {
    const r = await fetch("/api/crear-subdominio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.ok) {
      return { ok: true, mensaje: `Subdominio ${data.dominio} publicado en Vercel.` };
    }
    return { ok: false, mensaje: data.error || "No se pudo publicar el subdominio." };
  } catch {
    return { ok: false, mensaje: "No se pudo contactar con el servidor de publicación." };
  }
}
