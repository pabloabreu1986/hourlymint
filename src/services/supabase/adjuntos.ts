import { sb, FOTOS_BUCKET } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { fileToThumbDataURL, dataURLtoBlob } from "@/lib/image";
import type { Adjunto, TipoAdjunto } from "@/lib/types";
import type { SubirAdjuntoInput } from "../adjuntos";
import { toAdjunto, check } from "./_map";

/** Calidad de referencia: más grande que las fotos de parte diario, pero
 * muy por debajo de una foto sin comprimir de un móvil moderno. */
const ADJUNTO_MAX_SIZE = 1600;
const ADJUNTO_CALIDAD = 0.82;

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

export type FaseSubida = "preparando" | "subiendo";

export async function subirAdjunto(
  file: File,
  input: SubirAdjuntoInput,
  onFase?: (fase: FaseSubida) => void
): Promise<Adjunto> {
  const id = uid("adj");
  const esImagen = input.tipo === "imagen";
  const path = `adjuntos/${input.obraId}/${id}.${esImagen ? "jpg" : extensionDe(file, input.tipo)}`;

  // El vídeo se sube tal cual (no hay forma razonable de comprimirlo en el
  // navegador); las imágenes sí se comprimen para que la subida sea rápida.
  onFase?.("preparando");
  const cuerpo = esImagen
    ? dataURLtoBlob(await fileToThumbDataURL(file, ADJUNTO_MAX_SIZE, ADJUNTO_CALIDAD))
    : file;

  onFase?.("subiendo");
  const up = await sb()
    .storage.from(FOTOS_BUCKET)
    .upload(path, cuerpo, {
      contentType: esImagen ? "image/jpeg" : file.type || undefined,
      upsert: false,
    });
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
