import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Documento } from "@/lib/types";
import type { NuevoDocumento } from "../documentos";
import { toDocumento, fromDocumento, check } from "./_map";

export async function listDocumentos(): Promise<Documento[]> {
  const data = check(
    await sb()
      .from("documentos")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("created_at", { ascending: false })
  );
  return (data ?? []).map(toDocumento);
}

export async function documentosDe(usuarioId: string): Promise<Documento[]> {
  const data = check(
    await sb()
      .from("documentos")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .or(`usuario_id.eq.${usuarioId},usuario_id.is.null`)
      .order("created_at", { ascending: false })
  );
  return (data ?? []).map(toDocumento);
}

export async function subirDocumento(input: NuevoDocumento): Promise<Documento> {
  const nuevo: Documento = {
    id: uid("d"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("documentos").insert(fromDocumento(nuevo)));
  return nuevo;
}

export async function eliminarDocumento(id: string): Promise<void> {
  check(await sb().from("documentos").delete().eq("id", id));
}
