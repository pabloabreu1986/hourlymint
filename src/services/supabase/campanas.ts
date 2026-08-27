import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { Campana } from "@/lib/types";
import type { CampanaInput } from "../campanas";
import { CAMPANA_GENERAL_ID, campanaGeneral } from "../campanas";
import { check } from "./_map";

const toCampana = (r: any): Campana => ({
  id: r.id,
  nombre: r.nombre,
  plataforma: r.plataforma,
  presupuestoDia: Number(r.presupuesto_dia) || 0,
  activa: Boolean(r.activa),
  fechaFin: r.fecha_fin || undefined,
  objetivoLeads: r.objetivo_leads ?? undefined,
  notaInterna: r.nota_interna || undefined,
  createdAt: r.created_at,
});

export async function asegurarGeneral(): Promise<void> {
  const g = campanaGeneral();
  try {
    // Inserta la general solo si no existe; si ya está, no la toca.
    await sb()
      .from("campanas")
      .upsert(
        {
          id: g.id,
          nombre: g.nombre,
          plataforma: g.plataforma,
          presupuesto_dia: g.presupuestoDia,
          activa: g.activa,
          created_at: g.createdAt,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
  } catch {
    /* si falla, la vista sigue funcionando con las demás campañas */
  }
}

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
    id: input.id || uid("camp"),
    nombre: input.nombre,
    plataforma: input.plataforma,
    presupuesto_dia: input.presupuestoDia,
    activa: input.activa,
    fecha_fin: input.fechaFin || null,
    objetivo_leads: input.objetivoLeads ?? null,
    nota_interna: input.notaInterna || null,
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
  if (patch.fechaFin !== undefined) row.fecha_fin = patch.fechaFin || null;
  if (patch.objetivoLeads !== undefined) row.objetivo_leads = patch.objetivoLeads ?? null;
  if (patch.notaInterna !== undefined) row.nota_interna = patch.notaInterna || null;
  check(await sb().from("campanas").update(row).eq("id", id));
}

export async function eliminarCampana(id: string): Promise<void> {
  if (id === CAMPANA_GENERAL_ID) return; // la general no se borra
  check(await sb().from("campanas").delete().eq("id", id));
}
