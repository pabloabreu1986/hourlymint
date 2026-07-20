import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { Usuario } from "@/lib/types";
import type { NuevoUsuario } from "../usuarios";
import { toUsuario, fromUsuario, check } from "./_map";

const COLORS = ["#BE6B39", "#2E6F8E", "#5B7A4B", "#8E4B6F", "#3B4756", "#B08423", "#4B5F8E"];

export async function listUsuarios(): Promise<Usuario[]> {
  const data = check(await sb().from("usuarios").select("*").order("nombre"));
  return (data ?? []).map(toUsuario);
}

export async function listTrabajadores(): Promise<Usuario[]> {
  const data = check(
    await sb().from("usuarios").select("*").eq("rol", "trabajador").order("nombre")
  );
  return (data ?? []).map(toUsuario);
}

export async function crearUsuario(input: NuevoUsuario): Promise<Usuario> {
  const nuevo: Usuario = {
    id: uid("u"),
    activo: true,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    ...input,
  };
  check(await sb().from("usuarios").insert(fromUsuario(nuevo)));
  return nuevo;
}

export async function actualizarUsuario(id: string, patch: Partial<Usuario>): Promise<Usuario> {
  const data = check(
    await sb().from("usuarios").update(fromUsuario(patch)).eq("id", id).select().single()
  );
  return toUsuario(data);
}

export async function eliminarUsuario(id: string): Promise<void> {
  const client = sb();
  // Desasignar de obras (trabajador_ids es un array; lo actualizamos en código).
  const obras = check(await client.from("obras").select("id, encargado_id, trabajador_ids"));
  for (const o of obras ?? []) {
    const prev: string[] = o.trabajador_ids ?? [];
    const trab = prev.filter((t) => t !== id);
    const patch: Record<string, unknown> = {};
    if (trab.length !== prev.length) patch.trabajador_ids = trab;
    if (o.encargado_id === id) patch.encargado_id = null;
    if (Object.keys(patch).length) {
      const { error } = await client.from("obras").update(patch).eq("id", o.id);
      if (error) throw new Error(error.message);
    }
  }
  const { error } = await client.from("usuarios").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
