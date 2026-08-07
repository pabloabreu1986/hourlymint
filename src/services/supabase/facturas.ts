import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Factura } from "@/lib/types";
import type { NuevaFactura } from "../facturas";
import { toFactura, fromFactura, check } from "./_map";

export async function listFacturas(): Promise<Factura[]> {
  const data = check(
    await sb()
      .from("facturas")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toFactura);
}

export async function crearFactura(input: NuevaFactura): Promise<Factura> {
  const nueva: Factura = {
    id: uid("f"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("facturas").insert(fromFactura(nueva)));
  return nueva;
}

export async function actualizarFactura(id: string, patch: Partial<Factura>): Promise<Factura> {
  const data = check(
    await sb().from("facturas").update(fromFactura(patch)).eq("id", id).select().single()
  );
  return toFactura(data);
}

export async function eliminarFactura(id: string): Promise<void> {
  check(await sb().from("facturas").delete().eq("id", id));
}
