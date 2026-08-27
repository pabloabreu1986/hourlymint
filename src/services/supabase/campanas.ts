import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { Campana } from "@/lib/types";
import type { CampanaInput } from "../campanas";
import { check } from "./_map";

const toCampana = (r: any): Campana => ({
  id: r.id,
  nombre: r.nombre,
  plataforma: r.plataforma,
  presupuestoDia: Number(r.presupuesto_dia) || 0,
  activa: Boolean(r.activa),
  createdAt: r.created_at,
});

export async function listCampanas(): Promise<Campana[]> {
  try {
    const { data, error } = await sb()
      .from("campanas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(toCampana);
  } catch {
    return [];
  }
}

export async function crearCampana(input: CampanaInput): Promise<Campana> {
  const campana = {
    id: uid("camp"),
    nombre: input.nombre,
    plataforma: input.plataforma,
    presupuesto_dia: input.presupuestoDia,
    activa: input.activa,
    created_at: new Date().toISOString(),
  };
  check(await sb().from("campanas").insert(campana));
  return toCampana(campana);
}

export async function actualizarCampana(
  id: string,
  patch: Partial<CampanaInput>
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.plataforma !== undefined) row.plataforma = patch.plataforma;
  if (patch.presupuestoDia !== undefined) row.presupuesto_dia = patch.presupuestoDia;
  if (patch.activa !== undefined) row.activa = patch.activa;
  check(await sb().from("campanas").update(row).eq("id", id));
}

export async function eliminarCampana(id: string): Promise<void> {
  check(await sb().from("campanas").delete().eq("id", id));
}
