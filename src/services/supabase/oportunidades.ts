import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Oportunidad } from "@/lib/types";
import type { NuevaOportunidad } from "../oportunidades";
import { toOportunidad, fromOportunidad, check } from "./_map";

export async function listOportunidades(): Promise<Oportunidad[]> {
  const data = check(
    await sb()
      .from("oportunidades")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toOportunidad);
}

export async function getOportunidad(id: string): Promise<Oportunidad | null> {
  const { data, error } = await sb().from("oportunidades").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toOportunidad(data) : null;
}

export async function crearOportunidad(input: NuevaOportunidad): Promise<Oportunidad> {
  const nueva: Oportunidad = {
    id: uid("op"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("oportunidades").insert(fromOportunidad(nueva)));
  return nueva;
}

export async function actualizarOportunidad(
  id: string,
  patch: Partial<Oportunidad>
): Promise<Oportunidad> {
  const data = check(
    await sb().from("oportunidades").update(fromOportunidad(patch)).eq("id", id).select().single()
  );
  return toOportunidad(data);
}

export async function eliminarOportunidad(id: string): Promise<void> {
  const client = sb();
  check(await client.from("interacciones").update({ oportunidad_id: null }).eq("oportunidad_id", id));
  check(await client.from("oportunidades").delete().eq("id", id));
}
