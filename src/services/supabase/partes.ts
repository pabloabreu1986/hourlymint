import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { hoyISO } from "@/lib/seed";
import type { ParteDiario } from "@/lib/types";
import { toParte, fromParte, check } from "./_map";

export async function listPartes(): Promise<ParteDiario[]> {
  const data = check(
    await sb().from("partes").select("*").order("created_at", { ascending: false })
  );
  return (data ?? []).map(toParte);
}

export async function getParte(id: string): Promise<ParteDiario | null> {
  const { data, error } = await sb().from("partes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toParte(data) : null;
}

export async function getOrCreateParteDelDia(
  obraId: string,
  encargadoId: string | null,
  fecha = hoyISO()
): Promise<ParteDiario> {
  const { data: existente, error } = await sb()
    .from("partes")
    .select("*")
    .eq("obra_id", obraId)
    .eq("fecha", fecha)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (existente) return toParte(existente);

  const nuevo: ParteDiario = {
    id: uid("p"),
    obraId,
    fecha,
    encargadoId,
    trabajoRealizado: "",
    materialesPendientes: [],
    observaciones: "",
    incidencias: "",
    avance: 0,
    firma: null,
    estado: "borrador",
    createdAt: new Date().toISOString(),
    closedAt: null,
  };
  check(await sb().from("partes").insert(fromParte(nuevo)));
  return nuevo;
}

export async function partesDeObra(obraId: string): Promise<ParteDiario[]> {
  const data = check(
    await sb().from("partes").select("*").eq("obra_id", obraId).order("fecha", { ascending: false })
  );
  return (data ?? []).map(toParte);
}

export async function guardarParte(id: string, patch: Partial<ParteDiario>): Promise<ParteDiario> {
  const data = check(
    await sb().from("partes").update(fromParte(patch)).eq("id", id).select().single()
  );
  return toParte(data);
}

export async function cerrarParte(id: string, patch: Partial<ParteDiario>): Promise<ParteDiario> {
  const data = check(
    await sb()
      .from("partes")
      .update(fromParte({ ...patch, estado: "cerrado", closedAt: new Date().toISOString() }))
      .eq("id", id)
      .select()
      .single()
  );
  const parte = toParte(data);
  // Sincroniza el % de avance en la obra.
  const { error } = await sb().from("obras").update({ avance: parte.avance }).eq("id", parte.obraId);
  if (error) throw new Error(error.message);
  return parte;
}
