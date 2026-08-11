import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Notificacion } from "@/lib/types";
import { toNotificacion, fromNotificacion, check } from "./_map";

export async function notificacionesDe(trabajadorId: string): Promise<Notificacion[]> {
  const data = check(
    await sb()
      .from("notificaciones")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .or(`trabajador_id.eq.${trabajadorId},trabajador_id.is.null`)
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toNotificacion);
}

export async function listNotificaciones(): Promise<Notificacion[]> {
  const data = check(
    await sb()
      .from("notificaciones")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("fecha", { ascending: false })
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

export async function eliminarNotificacion(id: string): Promise<void> {
  const { error } = await sb().from("notificaciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Borra TODAS las notificaciones del tenant activo (acción del admin). */
export async function eliminarTodas(): Promise<void> {
  const { error } = await sb()
    .from("notificaciones")
    .delete()
    .eq("tenant_id", tenantActivoId());
  if (error) throw new Error(error.message);
}

/** Borra las notificaciones personales de un trabajador (no las globales). */
export async function eliminarTodasDe(trabajadorId: string): Promise<void> {
  const { error } = await sb()
    .from("notificaciones")
    .delete()
    .eq("tenant_id", tenantActivoId())
    .eq("trabajador_id", trabajadorId);
  if (error) throw new Error(error.message);
}

export async function crearNotificacion(
  input: Omit<Notificacion, "id" | "tenantId" | "fecha" | "leida">
): Promise<Notificacion> {
  const nueva: Notificacion = {
    id: uid("n"),
    tenantId: tenantActivoId(),
    fecha: new Date().toISOString(),
    leida: false,
    ...input,
  };
  check(await sb().from("notificaciones").insert(fromNotificacion(nueva)));
  return nueva;
}
