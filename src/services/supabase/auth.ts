import { sb } from "@/lib/supabase";
import type { Usuario } from "@/lib/types";
import type { Credenciales } from "../auth";
import { toUsuario } from "./_map";

const norm = (s: string) => s.trim().toLowerCase();

export async function login({ usuario, password }: Credenciales): Promise<Usuario> {
  const { data, error } = await sb().from("usuarios").select("*").eq("activo", true);
  if (error) throw new Error(error.message);
  const u = (data ?? []).map(toUsuario).find((x) => norm(x.nombre) === norm(usuario));
  if (!u || u.password !== password) throw new Error("Usuario o contraseña incorrectos");
  return u;
}

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  const { data, error } = await sb().from("usuarios").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toUsuario(data) : null;
}
