import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { hoyISO } from "@/lib/seed";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { ParteDiario } from "@/lib/types";
import * as sb from "./supabase/partes";

export async function listPartes(): Promise<ParteDiario[]> {
  if (isSupabaseEnabled) return sb.listPartes();
  return delay([...loadDB().partes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function getParte(id: string): Promise<ParteDiario | null> {
  if (isSupabaseEnabled) return sb.getParte(id);
  return delay(loadDB().partes.find((p) => p.id === id) ?? null, 0);
}

/** Devuelve el parte de una obra para una fecha (por defecto hoy),
 * creándolo como borrador si aún no existe. */
export async function getOrCreateParteDelDia(
  obraId: string,
  encargadoId: string | null,
  fecha = hoyISO()
): Promise<ParteDiario> {
  if (isSupabaseEnabled) return sb.getOrCreateParteDelDia(obraId, encargadoId, fecha);
  const existente = loadDB().partes.find(
    (p) => p.obraId === obraId && p.fecha === fecha
  );
  if (existente) return delay(existente, 0);

  const nuevo: ParteDiario = {
    id: uid("p"),
    obraId,
    fecha,
    encargadoId,
    trabajoRealizado: "",
    materialesPendientes: [],
    observaciones: "",
    incidencias: "",
    avance: 0,
    firma: null,
    estado: "borrador",
    createdAt: new Date().toISOString(),
    closedAt: null,
  };
  updateDB((db) => db.partes.push(nuevo));
  return delay(nuevo, 0);
}

export async function partesDeObra(obraId: string): Promise<ParteDiario[]> {
  if (isSupabaseEnabled) return sb.partesDeObra(obraId);
  return delay(
    loadDB()
      .partes.filter((p) => p.obraId === obraId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  );
}

export async function guardarParte(
  id: string,
  patch: Partial<ParteDiario>
): Promise<ParteDiario> {
  if (isSupabaseEnabled) return sb.guardarParte(id, patch);
  let out: ParteDiario | undefined;
  updateDB((db) => {
    const p = db.partes.find((x) => x.id === id);
    if (p) {
      Object.assign(p, patch);
      out = p;
    }
  });
  if (!out) throw new Error("Parte no encontrado");
  return delay(out);
}

/** Cierra el parte y sincroniza el % de avance en la obra. */
export async function cerrarParte(
  id: string,
  patch: Partial<ParteDiario>
): Promise<ParteDiario> {
  if (isSupabaseEnabled) return sb.cerrarParte(id, patch);
  let out: ParteDiario | undefined;
  updateDB((db) => {
    const p = db.partes.find((x) => x.id === id);
    if (!p) return;
    Object.assign(p, patch, {
      estado: "cerrado",
      closedAt: new Date().toISOString(),
    });
    out = p;
    const o = db.obras.find((x) => x.id === p.obraId);
    if (o) o.avance = p.avance;
  });
  if (!out) throw new Error("Parte no encontrado");
  return delay(out);
}
