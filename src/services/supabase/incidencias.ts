import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { Incidencia } from "@/lib/types";
import type { NuevaIncidencia } from "../incidencias";
import { toIncidencia, fromIncidencia, check } from "./_map";

export async function listIncidencias(): Promise<Incidencia[]> {
  const data = check(
    await sb().from("incidencias").select("*").order("fecha", { ascending: false })
  );
  return (data ?? []).map(toIncidencia);
}

export async function crearIncidencia(input: NuevaIncidencia): Promise<Incidencia> {
  const nueva: Incidencia = {
    id: uid("i"),
    fecha: new Date().toISOString(),
    estado: "nueva",
    ...input,
  };
  check(await sb().from("incidencias").insert(fromIncidencia(nueva)));
  return nueva;
}

export async function actualizarIncidencia(
  id: string,
  patch: Partial<Incidencia>
): Promise<Incidencia> {
  const data = check(
    await sb().from("incidencias").update(fromIncidencia(patch)).eq("id", id).select().single()
  );
  return toIncidencia(data);
}
