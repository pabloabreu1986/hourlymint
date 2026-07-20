import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { Usuario } from "@/lib/types";
import * as sb from "./supabase/usuarios";

const COLORS = ["#BE6B39", "#2E6F8E", "#5B7A4B", "#8E4B6F", "#3B4756", "#B08423", "#4B5F8E"];

export async function listUsuarios(): Promise<Usuario[]> {
  if (isSupabaseEnabled) return sb.listUsuarios();
  return delay([...loadDB().usuarios]);
}

export async function listTrabajadores(): Promise<Usuario[]> {
  if (isSupabaseEnabled) return sb.listTrabajadores();
  return delay(loadDB().usuarios.filter((u) => u.rol === "trabajador"));
}

export type NuevoUsuario = Omit<Usuario, "id" | "color" | "activo"> &
  Partial<Pick<Usuario, "activo" | "color">>;

export async function crearUsuario(data: NuevoUsuario): Promise<Usuario> {
  if (isSupabaseEnabled) return sb.crearUsuario(data);
  const nuevo: Usuario = {
    id: uid("u"),
    activo: true,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    ...data,
  };
  updateDB((db) => {
    db.usuarios.push(nuevo);
  });
  return delay(nuevo);
}

export async function actualizarUsuario(
  id: string,
  patch: Partial<Usuario>
): Promise<Usuario> {
  if (isSupabaseEnabled) return sb.actualizarUsuario(id, patch);
  let out: Usuario | undefined;
  updateDB((db) => {
    const u = db.usuarios.find((x) => x.id === id);
    if (u) {
      Object.assign(u, patch);
      out = u;
    }
  });
  if (!out) throw new Error("Usuario no encontrado");
  return delay(out);
}

export async function eliminarUsuario(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarUsuario(id);
  updateDB((db) => {
    db.usuarios = db.usuarios.filter((u) => u.id !== id);
    // Desasignar de obras
    db.obras.forEach((o) => {
      o.trabajadorIds = o.trabajadorIds.filter((t) => t !== id);
      if (o.encargadoId === id) o.encargadoId = null;
    });
  });
  return delay(undefined);
}
