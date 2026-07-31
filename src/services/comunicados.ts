// Comunicación interna: tablón de comunicados de empresa y canal de
// denuncias (confidencial, con opción de anonimato).
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Comunicado, Denuncia, EstadoDenuncia } from "@/lib/types";
import * as sb from "./supabase/comunicados";

// ── Comunicados ──

export async function listComunicados(): Promise<Comunicado[]> {
  if (isSupabaseEnabled) return sb.listComunicados();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .comunicados.filter((c) => c.tenantId === tid)
      .sort((a, b) =>
        a.fijado !== b.fijado ? (a.fijado ? -1 : 1) : b.fecha.localeCompare(a.fecha)
      )
  );
}

export type NuevoComunicado = Omit<Comunicado, "id" | "tenantId" | "fecha">;

export async function publicarComunicado(data: NuevoComunicado): Promise<Comunicado> {
  if (isSupabaseEnabled) return sb.publicarComunicado(data);
  const nuevo: Comunicado = {
    id: uid("c"),
    tenantId: tenantActivoId(),
    fecha: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.comunicados.push(nuevo));
  return delay(nuevo);
}

export async function actualizarComunicado(
  id: string,
  patch: Partial<Comunicado>
): Promise<Comunicado> {
  if (isSupabaseEnabled) return sb.actualizarComunicado(id, patch);
  let out: Comunicado | undefined;
  updateDB((db) => {
    const c = db.comunicados.find((x) => x.id === id);
    if (c) {
      Object.assign(c, patch);
      out = c;
    }
  });
  if (!out) throw new Error("Comunicado no encontrado");
  return delay(out);
}

export async function eliminarComunicado(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarComunicado(id);
  updateDB((db) => {
    db.comunicados = db.comunicados.filter((c) => c.id !== id);
  });
  return delay(undefined);
}

// ── Canal de denuncias ──

export async function listDenuncias(): Promise<Denuncia[]> {
  if (isSupabaseEnabled) return sb.listDenuncias();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .denuncias.filter((d) => d.tenantId === tid)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export type NuevaDenuncia = Omit<Denuncia, "id" | "tenantId" | "estado" | "fecha">;

export async function presentarDenuncia(data: NuevaDenuncia): Promise<Denuncia> {
  if (isSupabaseEnabled) return sb.presentarDenuncia(data);
  const nueva: Denuncia = {
    id: uid("dn"),
    tenantId: tenantActivoId(),
    estado: "nueva",
    fecha: new Date().toISOString(),
    ...data,
    // Si es anónima, nunca guardamos quién la envió.
    trabajadorId: data.anonima ? null : data.trabajadorId,
  };
  updateDB((db) => db.denuncias.push(nueva));
  return delay(nueva);
}

export async function cambiarEstadoDenuncia(
  id: string,
  estado: EstadoDenuncia
): Promise<Denuncia> {
  if (isSupabaseEnabled) return sb.cambiarEstadoDenuncia(id, estado);
  let out: Denuncia | undefined;
  updateDB((db) => {
    const d = db.denuncias.find((x) => x.id === id);
    if (d) {
      d.estado = estado;
      out = d;
    }
  });
  if (!out) throw new Error("Denuncia no encontrada");
  return delay(out);
}
