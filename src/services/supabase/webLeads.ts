import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { ProyectoInput } from "../webLeads";
import { check } from "./_map";

export async function enviarProyecto(input: ProyectoInput): Promise<void> {
  check(
    await sb().from("web_leads").insert({
      id: uid("wl"),
      tenant_id: tenantActivoId(),
      nombre: input.nombre,
      telefono: input.telefono,
      email: input.email || null,
      mensaje: input.mensaje || null,
      created_at: new Date().toISOString(),
    })
  );
}
