// Servicio de fotos. Enruta a Supabase Storage (bucket privado + URLs
// firmadas) si está configurado; si no, guarda data URLs comprimidos en
// localStorage. La visibilidad (encargado ve las fotos de su equipo,
// admin todas) es idéntica en ambos modos.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { fileToThumbDataURL } from "@/lib/image";
import type { Foto, Usuario } from "@/lib/types";
import * as sb from "./supabase/fotos";

export interface SubirFotoInput {
  obraId: string;
  parteId: string | null;
  subidaPor: string | null;
}

export async function subirFoto(file: File, input: SubirFotoInput): Promise<Foto> {
  if (isSupabaseEnabled) return sb.subirFoto(file, input);
  const dataUrl = await fileToThumbDataURL(file);
  const foto: Foto = {
    id: uid("ft"),
    obraId: input.obraId,
    parteId: input.parteId,
    subidaPor: input.subidaPor,
    path: dataUrl,
    url: dataUrl,
    createdAt: new Date().toISOString(),
  };
  updateDB((db) => db.fotos.push(foto));
  return delay(foto);
}

export async function listFotosDeParte(parteId: string): Promise<Foto[]> {
  if (isSupabaseEnabled) return sb.listFotosDeParte(parteId);
  return delay(conUrlMock(loadDB().fotos.filter((f) => f.parteId === parteId)));
}

export async function listFotosDeObra(obraId: string): Promise<Foto[]> {
  if (isSupabaseEnabled) return sb.listFotosDeObra(obraId);
  return delay(
    conUrlMock(
      [...loadDB().fotos]
        .filter((f) => f.obraId === obraId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    )
  );
}

export async function listFotosVisibles(usuario: Usuario): Promise<Foto[]> {
  if (isSupabaseEnabled) return sb.listFotosVisibles(usuario);
  const db = loadDB();
  let fotos = db.fotos;
  if (usuario.rol !== "admin") {
    const visibles = new Set(
      db.obras
        .filter((o) => o.encargadoId === usuario.id || o.trabajadorIds.includes(usuario.id))
        .map((o) => o.id)
    );
    fotos = fotos.filter((f) => visibles.has(f.obraId) || f.subidaPor === usuario.id);
  }
  return delay(
    conUrlMock([...fotos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  );
}

export async function eliminarFoto(foto: Foto): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarFoto(foto);
  updateDB((db) => {
    db.fotos = db.fotos.filter((f) => f.id !== foto.id);
  });
  return delay(undefined);
}

/** En mock, la URL es el propio data URL guardado en `path`. */
function conUrlMock(fotos: Foto[]): Foto[] {
  return fotos.map((f) => ({ ...f, url: f.url ?? f.path }));
}
