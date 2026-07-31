import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { EstadoGasto, Gasto } from "@/lib/types";
import type { NuevoGasto } from "../gastos";
import { toGasto, fromGasto, check } from "./_map";

export async function listGastos(): Promise<Gasto[]> {
  const data = check(
    await sb()
      .from("gastos")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("creado_en", { ascending: false })
  );
  return (data ?? []).map(toGasto);
}

export async function gastosDe(trabajadorId: string): Promise<Gasto[]> {
  const data = check(
    await sb()
      .from("gastos")
      .select("*")
      .eq("trabajador_id", trabajadorId)
      .order("creado_en", { ascending: false })
  );
  return (data ?? []).map(toGasto);
}

export async function crearGasto(input: NuevoGasto): Promise<Gasto> {
  const nuevo: Gasto = {
    id: uid("g"),
    tenantId: tenantActivoId(),
    estado: "pendiente",
    creadoEn: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("gastos").insert(fromGasto(nuevo)));
  return nuevo;
}

export async function cambiarEstadoGasto(id: string, estado: EstadoGasto): Promise<Gasto> {
  const data = check(
    await sb().from("gastos").update({ estado }).eq("id", id).select().single()
  );
  return toGasto(data);
}
