import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { DemoInput } from "../leads";
import { check } from "./_map";

export async function solicitarDemo(input: DemoInput): Promise<void> {
  check(
    await sb().from("demo_solicitudes").insert({
      id: uid("lead"),
      nombre: input.nombre,
      empresa: input.empresa || null,
      email: input.email || null,
      telefono: input.telefono,
      mensaje: input.mensaje || null,
      created_at: new Date().toISOString(),
    })
  );
}
