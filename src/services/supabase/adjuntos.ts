import { sb, FOTOS_BUCKET } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { Adjunto, TipoAdjunto } from "@/lib/types";
import type { SubirAdjuntoInput } from "../adjuntos";
import { toAdjunto, check } from "./_map";

/** Añade URLs firmadas temporales (1h) a un lote de adjuntos del bucket privado. */
async function withUrls(adjuntos: Adjunto[]): Promise<Adjunto[]> {
  if (!adjuntos.length) return adjuntos;
  const { data, error } = await sb()
    .storage.from(FOTOS_BUCKET)
    .createSignedUrls(
      adjuntos.map((a) => a.path),
      3600
    );
  if (error) throw new Error(error.message);
  const map = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return adjuntos.map((a) => ({ ...a, url: map.get(a.path) ?? undefined }));
}

function extensionDe(file: File, tipo: TipoAdjunto): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return tipo === "video" ? "mp4" : "jpg";
}

export async function subirAdjunto(file: File, input: SubirAdjuntoInput): Promise<Adjunto> {
  const id = uid("adj");
  const path = `adjuntos/${input.obraId}/${id}.${extensionDe(file, input.tipo)}`;

  const up = await sb()
    .storage.from(FOTOS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (up.error) throw new Error(up.error.message);

  const adjunto: Adjunto = {
    id,
    obraId: input.obraId,
    tipo: input.tipo,
    subidoPor: input.subidoPor,
    path,
    createdAt: new Date().toISOString(),
  };
  check(
    await sb().from("obra_adjuntos").insert({
      id,
      obra_id: adjunto.obraId,
      tipo: adjunto.tipo,
      subido_por: adjunto.subidoPor,
      path,
      created_at: adjunto.createdAt,
    })
  );
  const [conUrl] = await withUrls([adjunto]);
  return conUrl;
}

export async function listAdjuntosDeObra(obraId: string): Promise<Adjunto[]> {
  const data = check(
    await sb()
      .from("obra_adjuntos")
      .select("*")
      .eq("obra_id", obraId)
      .order("created_at", { ascending: false })
  );
  return withUrls((data ?? []).map(toAdjunto));
}

export async function eliminarAdjunto(adjunto: Adjunto): Promise<void> {
  await sb().storage.from(FOTOS_BUCKET).remove([adjunto.path]);
  const { error } = await sb().from("obra_adjuntos").delete().eq("id", adjunto.id);
  if (error) throw new Error(error.message);
}
