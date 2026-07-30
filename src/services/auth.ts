import { loadDB, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { usuarioPermitidoEnHost } from "@/lib/host";
import type { Usuario } from "@/lib/types";
import * as sb from "./supabase/auth";

export interface Credenciales {
  usuario: string;
  password: string;
}

/**
 * Valida usuario/contraseña. Coincidencia por nombre (insensible a
 * mayúsculas/espacios). Usa Supabase si está configurado; si no, mock.
 */
export async function login({ usuario, password }: Credenciales): Promise<Usuario> {
  if (isSupabaseEnabled) return sb.login({ usuario, password });
  const db = loadDB();
  const norm = (s: string) => s.trim().toLowerCase();
  // Solo usuarios que pueden acceder por este dominio (su tenant, o el
  // super-admin en el apex): así se busca al usuario correcto aunque dos
  // clientes tengan un trabajador con el mismo nombre.
  const u = db.usuarios.find(
    (x) => x.activo && usuarioPermitidoEnHost(x) && norm(x.nombre) === norm(usuario)
  );
  if (!u || u.password !== password) {
    await delay(null, 250);
    throw new Error("Usuario o contraseña incorrectos");
  }
  return delay(u, 250);
}

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  if (isSupabaseEnabled) return sb.getUsuarioById(id);
  const db = loadDB();
  return delay(db.usuarios.find((u) => u.id === id) ?? null, 0);
}
