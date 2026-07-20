import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { hoyISO } from "@/lib/seed";
import { isSupabaseEnabled } from "@/lib/supabase";
import { capturarGPS } from "@/lib/geo";
import type { Fichaje, TipoFichaje } from "@/lib/types";
import * as sb from "./supabase/fichajes";

/** Hora límite de entrada. Después se marca "tarde". */
export const HORA_LIMITE_ENTRADA = 9; // 09:00

function esDeHoy(iso: string): boolean {
  return iso.slice(0, 10) === hoyISO();
}

export async function listFichajes(): Promise<Fichaje[]> {
  if (isSupabaseEnabled) return sb.listFichajes();
  return delay([...loadDB().fichajes]);
}

export async function fichajesDeHoy(): Promise<Fichaje[]> {
  if (isSupabaseEnabled) return sb.fichajesDeHoy();
  return delay(loadDB().fichajes.filter((f) => esDeHoy(f.timestamp)));
}

export async function fichajesDeTrabajadorHoy(trabajadorId: string): Promise<Fichaje[]> {
  if (isSupabaseEnabled) return sb.fichajesDeTrabajadorHoy(trabajadorId);
  return delay(
    loadDB().fichajes.filter(
      (f) => f.trabajadorId === trabajadorId && esDeHoy(f.timestamp)
    )
  );
}

export interface EstadoFichajeTrabajador {
  entrada: Fichaje | null;
  salida: Fichaje | null;
}

export async function estadoFichaje(trabajadorId: string): Promise<EstadoFichajeTrabajador> {
  if (isSupabaseEnabled) return sb.estadoFichaje(trabajadorId);
  const hoy = loadDB().fichajes.filter(
    (f) => f.trabajadorId === trabajadorId && esDeHoy(f.timestamp)
  );
  return delay({
    entrada: hoy.find((f) => f.tipo === "entrada") ?? null,
    salida: hoy.find((f) => f.tipo === "salida") ?? null,
  });
}

/** Registra un fichaje capturando GPS automáticamente. */
export async function fichar(
  trabajadorId: string,
  tipo: TipoFichaje,
  obraId: string | null
): Promise<Fichaje> {
  if (isSupabaseEnabled) return sb.fichar(trabajadorId, tipo, obraId);
  const gps = await capturarGPS();
  const now = new Date();
  const tarde = tipo === "entrada" && now.getHours() >= HORA_LIMITE_ENTRADA;
  const fichaje: Fichaje = {
    id: uid("f"),
    trabajadorId,
    obraId,
    tipo,
    timestamp: now.toISOString(),
    gps,
    estado: tarde ? "tarde" : "correcto",
  };
  updateDB((db) => db.fichajes.push(fichaje));
  return fichaje;
}
