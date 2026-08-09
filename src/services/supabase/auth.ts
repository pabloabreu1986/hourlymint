import { sb } from "@/lib/supabase";
import { usuarioPermitidoEnHost } from "@/lib/host";
import type { Usuario } from "@/lib/types";
import type { Credenciales } from "../auth";
import { toUsuario } from "./_map";

const norm = (s: string) => s.trim().toLowerCase();

export async function login({ usuario, password }: Credenciales): Promise<Usuario> {
  const { data, error } = await sb().from("usuarios").select("*").eq("activo", true);
  if (error) throw new Error(error.message);
  // Solo usuarios que pueden acceder por este dominio (su tenant, o el
  // super-admin en el apex). Evita el cruce entre clientes y desambigua
  // nombres repetidos entre distintos negocios.
  const q = norm(usuario);
  const permitidos = (data ?? []).map(toUsuario).filter(usuarioPermitidoEnHost);
  // Preferimos el usuario corto (handle); si no, el nombre completo (legacy).
  const u =
    permitidos.find((x) => x.usuario && norm(x.usuario) === q) ??
    permitidos.find((x) => norm(x.nombre) === q);
  if (!u || u.password !== password) throw new Error("Usuario o contraseña incorrectos");
  return u;
}

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  const { data, error } = await sb().from("usuarios").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toUsuario(data) : null;
}
