// Operaciones de plataforma (super-admin): hablan con las funciones
// serverless del propio proyecto (/api/*). Solo funcionan en producción
// (en local/mock no hay /api y devuelven un resultado no-ok sin romper).

export interface ResultadoSubdominio {
  ok: boolean;
  mensaje: string;
}

async function llamar(endpoint: string, slug: string, exito: string): Promise<ResultadoSubdominio> {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.ok) return { ok: true, mensaje: `${exito}: ${data.dominio}` };
    return { ok: false, mensaje: data.error || "Operación no completada." };
  } catch {
    return { ok: false, mensaje: "No se pudo contactar con el servidor." };
  }
}

/** Publica `<slug>.fichaloop.com` en Vercel (idempotente). */
export function publicarSubdominio(slug: string): Promise<ResultadoSubdominio> {
  return llamar("/api/crear-subdominio", slug, "Subdominio publicado");
}

/** Quita `<slug>.fichaloop.com` de Vercel (idempotente). */
export function eliminarSubdominio(slug: string): Promise<ResultadoSubdominio> {
  return llamar("/api/eliminar-subdominio", slug, "Subdominio eliminado");
}
