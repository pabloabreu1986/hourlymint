import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Ausencia, EstadoAusencia } from "@/lib/types";
import type { NuevaAusencia, AdjuntoResolucion } from "../ausencias";
import { toAusencia, fromAusencia, check } from "./_map";

export async function listAusencias(): Promise<Ausencia[]> {
  const data = check(
    await sb()
      .from("ausencias")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("creada_en", { ascending: false })
  );
  return (data ?? []).map(toAusencia);
}

export async function ausenciasDe(trabajadorId: string): Promise<Ausencia[]> {
  const data = check(
    await sb()
      .from("ausencias")
      .select("*")
      .eq("trabajador_id", trabajadorId)
      .order("creada_en", { ascending: false })
  );
  return (data ?? []).map(toAusencia);
}

export async function solicitarAusencia(input: NuevaAusencia): Promise<Ausencia> {
  const nueva: Ausencia = {
    id: uid("au"),
    tenantId: tenantActivoId(),
    estado: "pendiente",
    respuesta: null,
    adjunto: null,
    adjuntoNombre: null,
    creadaEn: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("ausencias").insert(fromAusencia(nueva)));
  return nueva;
}

export async function resolverAusencia(
  id: string,
  estado: EstadoAusencia,
  respuesta: string,
  adjunto?: AdjuntoResolucion | null
): Promise<Ausencia> {
  const data = check(
    await sb()
      .from("ausencias")
      .update(
        fromAusencia({
          estado,
          respuesta: respuesta || null,
          ...(adjunto && { adjunto: adjunto.adjunto, adjuntoNombre: adjunto.adjuntoNombre }),
        })
      )
      .eq("id", id)
      .select()
      .single()
  );
  return toAusencia(data);
}
