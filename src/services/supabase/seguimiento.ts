import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Interaccion } from "@/lib/types";
import type { NuevaInteraccion } from "../seguimiento";
import { toInteraccion, fromInteraccion, check } from "./_map";

export async function listInteracciones(clienteId: string): Promise<Interaccion[]> {
  const data = check(
    await sb()
      .from("interacciones")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .eq("cliente_id", clienteId)
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toInteraccion);
}

export async function listInteraccionesTenant(): Promise<Interaccion[]> {
  const data = check(
    await sb().from("interacciones").select("*").eq("tenant_id", tenantActivoId())
  );
  return (data ?? []).map(toInteraccion);
}

export async function crearInteraccion(input: NuevaInteraccion): Promise<Interaccion> {
  const nueva: Interaccion = {
    id: uid("int"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("interacciones").insert(fromInteraccion(nueva)));
  // Actualiza el último contacto del cliente (best-effort).
  check(
    await sb()
      .from("clientes")
      .update({ fecha_ultimo_contacto: nueva.fecha.slice(0, 10) })
      .eq("id", nueva.clienteId)
  );
  return nueva;
}

export async function eliminarInteraccion(id: string): Promise<void> {
  check(await sb().from("interacciones").delete().eq("id", id));
}
