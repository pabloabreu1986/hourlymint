import { sb, FOTOS_BUCKET } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { fileToThumbDataURL, dataURLtoBlob } from "@/lib/image";
import type { Foto, Usuario } from "@/lib/types";
import type { SubirFotoInput } from "../fotos";
import { toFoto, check } from "./_map";

/** Añade URLs firmadas temporales (1h) a un lote de fotos del bucket privado. */
async function withUrls(fotos: Foto[]): Promise<Foto[]> {
  if (!fotos.length) return fotos;
  const { data, error } = await sb()
    .storage.from(FOTOS_BUCKET)
    .createSignedUrls(
      fotos.map((f) => f.path),
      3600
    );
  if (error) throw new Error(error.message);
  const map = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return fotos.map((f) => ({ ...f, url: map.get(f.path) ?? undefined }));
}

export async function subirFoto(file: File, input: SubirFotoInput): Promise<Foto> {
  const dataUrl = await fileToThumbDataURL(file);
  const blob = dataURLtoBlob(dataUrl);
  const id = uid("ft");
  const path = `${input.obraId}/${id}.jpg`;

  const up = await sb()
    .storage.from(FOTOS_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (up.error) throw new Error(up.error.message);

  const foto: Foto = {
    id,
    obraId: input.obraId,
    parteId: input.parteId,
    subidaPor: input.subidaPor,
    path,
    createdAt: new Date().toISOString(),
  };
  check(
    await sb().from("fotos").insert({
      id,
      obra_id: foto.obraId,
      parte_id: foto.parteId,
      subida_por: foto.subidaPor,
      path,
      created_at: foto.createdAt,
    })
  );
  const [conUrl] = await withUrls([foto]);
  return conUrl;
}

export async function listFotosDeParte(parteId: string): Promise<Foto[]> {
  const data = check(
    await sb().from("fotos").select("*").eq("parte_id", parteId).order("created_at")
  );
  return withUrls((data ?? []).map(toFoto));
}

export async function listFotosDeObra(obraId: string): Promise<Foto[]> {
  const data = check(
    await sb()
      .from("fotos")
      .select("*")
      .eq("obra_id", obraId)
      .order("created_at", { ascending: false })
  );
  return withUrls((data ?? []).map(toFoto));
}

/**
 * Fotos visibles para un usuario:
 * - admin: todas
 * - trabajador/encargado: las de sus obras (donde es encargado o del equipo)
 *   + las subidas por él. Un encargado ve así las fotos de sus trabajadores.
 */
export async function listFotosVisibles(usuario: Usuario): Promise<Foto[]> {
  const client = sb();
  let rows: unknown[] | null;

  if (usuario.rol === "admin") {
    rows = check(await client.from("fotos").select("*").order("created_at", { ascending: false }));
  } else {
    const obras =
      check(await client.from("obras").select("id, encargado_id, trabajador_ids")) ?? [];
    const visibles = obras
      .filter(
        (o: { id: string; encargado_id: string | null; trabajador_ids: string[] | null }) =>
          o.encargado_id === usuario.id || (o.trabajador_ids ?? []).includes(usuario.id)
      )
      .map((o: { id: string }) => o.id);

    const orExpr = [
      visibles.length ? `obra_id.in.(${visibles.join(",")})` : null,
      `subida_por.eq.${usuario.id}`,
    ]
      .filter(Boolean)
      .join(",");

    rows = check(
      await client.from("fotos").select("*").or(orExpr).order("created_at", { ascending: false })
    );
  }
  return withUrls((rows ?? []).map(toFoto));
}

export async function eliminarFoto(foto: Foto): Promise<void> {
  await sb().storage.from(FOTOS_BUCKET).remove([foto.path]);
  const { error } = await sb().from("fotos").delete().eq("id", foto.id);
  if (error) throw new Error(error.message);
}
