import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Turno } from "@/lib/types";
import type { NuevoTurno } from "../turnos";
import { toTurno, fromTurno, check } from "./_map";

export async function turnosEnRango(desde: string, hasta: string): Promise<Turno[]> {
  const data = check(
    await sb()
      .from("turnos")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .gte("fecha", desde)
      .lte("fecha", hasta)
  );
  return (data ?? []).map(toTurno);
}

export async function turnosDe(
  trabajadorId: string,
  desde: string,
  hasta: string
): Promise<Turno[]> {
  const data = check(
    await sb()
      .from("turnos")
      .select("*")
      .eq("trabajador_id", trabajadorId)
      .gte("fecha", desde)
      .lte("fecha", hasta)
  );
  return (data ?? []).map(toTurno);
}

export async function guardarTurno(input: NuevoTurno): Promise<Turno> {
  // Un turno por trabajador y día: borra el existente antes de insertar.
  check(
    await sb()
      .from("turnos")
      .delete()
      .eq("trabajador_id", input.trabajadorId)
      .eq("fecha", input.fecha)
  );
  const nuevo: Turno = { id: uid("t"), tenantId: tenantActivoId(), ...input };
  check(await sb().from("turnos").insert(fromTurno(nuevo)));
  return nuevo;
}

export async function eliminarTurno(id: string): Promise<void> {
  check(await sb().from("turnos").delete().eq("id", id));
}
