import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Comunicado, Denuncia, EstadoDenuncia } from "@/lib/types";
import type { NuevaDenuncia, NuevoComunicado } from "../comunicados";
import {
  toComunicado,
  fromComunicado,
  toDenuncia,
  fromDenuncia,
  check,
} from "./_map";

// ── Comunicados ──

export async function listComunicados(): Promise<Comunicado[]> {
  const data = check(
    await sb()
      .from("comunicados")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("fijado", { ascending: false })
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toComunicado);
}

export async function publicarComunicado(input: NuevoComunicado): Promise<Comunicado> {
  const nuevo: Comunicado = {
    id: uid("c"),
    tenantId: tenantActivoId(),
    fecha: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("comunicados").insert(fromComunicado(nuevo)));
  return nuevo;
}

export async function actualizarComunicado(
  id: string,
  patch: Partial<Comunicado>
): Promise<Comunicado> {
  const data = check(
    await sb()
      .from("comunicados")
      .update(fromComunicado(patch))
      .eq("id", id)
      .select()
      .single()
  );
  return toComunicado(data);
}

export async function eliminarComunicado(id: string): Promise<void> {
  check(await sb().from("comunicados").delete().eq("id", id));
}

// ── Canal de denuncias ──

export async function listDenuncias(): Promise<Denuncia[]> {
  const data = check(
    await sb()
      .from("denuncias")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toDenuncia);
}

export async function presentarDenuncia(input: NuevaDenuncia): Promise<Denuncia> {
  const nueva: Denuncia = {
    id: uid("dn"),
    tenantId: tenantActivoId(),
    estado: "nueva",
    fecha: new Date().toISOString(),
    ...input,
    trabajadorId: input.anonima ? null : input.trabajadorId,
  };
  check(await sb().from("denuncias").insert(fromDenuncia(nueva)));
  return nueva;
}

export async function cambiarEstadoDenuncia(
  id: string,
  estado: EstadoDenuncia
): Promise<Denuncia> {
  const data = check(
    await sb().from("denuncias").update({ estado }).eq("id", id).select().single()
  );
  return toDenuncia(data);
}
