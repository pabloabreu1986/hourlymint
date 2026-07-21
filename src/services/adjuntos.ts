// Material de referencia de obra (fotos/vídeo) que sube el admin/encargado
// para que lo vea el equipo asignado. Enruta a Supabase Storage si está
// configurado; si no, guarda data URLs en localStorage (solo para
// archivos pequeños: es la capa mock/demo).
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { Adjunto, TipoAdjunto } from "@/lib/types";
import * as sb from "./supabase/adjuntos";

export interface SubirAdjuntoInput {
  obraId: string;
  tipo: TipoAdjunto;
  subidoPor: string | null;
}

export async function subirAdjunto(file: File, input: SubirAdjuntoInput): Promise<Adjunto> {
  if (isSupabaseEnabled) return sb.subirAdjunto(file, input);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const adjunto: Adjunto = {
    id: uid("adj"),
    obraId: input.obraId,
    tipo: input.tipo,
    subidoPor: input.subidoPor,
    path: dataUrl,
    url: dataUrl,
    createdAt: new Date().toISOString(),
  };
  updateDB((db) => db.adjuntos.push(adjunto));
  return delay(adjunto);
}

export async function listAdjuntosDeObra(obraId: string): Promise<Adjunto[]> {
  if (isSupabaseEnabled) return sb.listAdjuntosDeObra(obraId);
  return delay(
    [...loadDB().adjuntos]
      .filter((a) => a.obraId === obraId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => ({ ...a, url: a.url ?? a.path }))
  );
}

export async function eliminarAdjunto(adjunto: Adjunto): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarAdjunto(adjunto);
  updateDB((db) => {
    db.adjuntos = db.adjuntos.filter((a) => a.id !== adjunto.id);
  });
  return delay(undefined);
}
