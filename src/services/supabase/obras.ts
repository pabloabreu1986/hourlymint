import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { Obra } from "@/lib/types";
import type { NuevaObra } from "../obras";
import { toObra, fromObra, check } from "./_map";

const COLORS = ["#BE6B39", "#2E6F8E", "#5B7A4B", "#8E4B6F", "#B08423"];

export async function listObras(): Promise<Obra[]> {
  const data = check(await sb().from("obras").select("*").order("created_at", { ascending: false }));
  return (data ?? []).map(toObra);
}

export async function getObra(id: string): Promise<Obra | null> {
  const { data, error } = await sb().from("obras").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toObra(data) : null;
}

export async function listObrasDeTrabajador(trabajadorId: string): Promise<Obra[]> {
  // Obras donde es encargado O está en el equipo (trabajador_ids contiene el id).
  const data = check(
    await sb()
      .from("obras")
      .select("*")
      .or(`encargado_id.eq.${trabajadorId},trabajador_ids.cs.{${trabajadorId}}`)
  );
  return (data ?? []).map(toObra);
}

export async function crearObra(input: NuevaObra): Promise<Obra> {
  const nueva: Obra = {
    id: uid("o"),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    createdAt: new Date().toISOString().slice(0, 10),
    ...input,
  };
  check(await sb().from("obras").insert(fromObra(nueva)));
  return nueva;
}

export async function actualizarObra(id: string, patch: Partial<Obra>): Promise<Obra> {
  const data = check(
    await sb().from("obras").update(fromObra(patch)).eq("id", id).select().single()
  );
  return toObra(data);
}

export async function eliminarObra(id: string): Promise<void> {
  const { error } = await sb().from("obras").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
