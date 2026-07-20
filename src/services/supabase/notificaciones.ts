import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { Notificacion } from "@/lib/types";
import { toNotificacion, fromNotificacion, check } from "./_map";

export async function notificacionesDe(trabajadorId: string): Promise<Notificacion[]> {
  const data = check(
    await sb()
      .from("notificaciones")
      .select("*")
      .or(`trabajador_id.eq.${trabajadorId},trabajador_id.is.null`)
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toNotificacion);
}

export async function listNotificaciones(): Promise<Notificacion[]> {
  const data = check(
    await sb().from("notificaciones").select("*").order("fecha", { ascending: false })
  );
  return (data ?? []).map(toNotificacion);
}

export async function marcarLeida(id: string): Promise<void> {
  const { error } = await sb().from("notificaciones").update({ leida: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function marcarTodasLeidas(trabajadorId: string): Promise<void> {
  const { error } = await sb()
    .from("notificaciones")
    .update({ leida: true })
    .or(`trabajador_id.eq.${trabajadorId},trabajador_id.is.null`);
  if (error) throw new Error(error.message);
}

export async function crearNotificacion(
  input: Omit<Notificacion, "id" | "fecha" | "leida">
): Promise<Notificacion> {
  const nueva: Notificacion = {
    id: uid("n"),
    fecha: new Date().toISOString(),
    leida: false,
    ...input,
  };
  check(await sb().from("notificaciones").insert(fromNotificacion(nueva)));
  return nueva;
}
