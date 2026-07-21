import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { hoyISO } from "@/lib/seed";
import { isSupabaseEnabled } from "@/lib/supabase";
import { capturarGPS } from "@/lib/geo";
import { calcularJornada, type Jornada } from "@/lib/horas";
import type { Fichaje, TipoFichaje } from "@/lib/types";
import * as sb from "./supabase/fichajes";

/** Hora de entrada por defecto cuando no se indica la de la obra. */
export const HORA_ENTRADA_POR_DEFECTO = "09:00";

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

export async function fichajesDeTrabajadorEnFecha(
  trabajadorId: string,
  fecha: string
): Promise<Fichaje[]> {
  if (isSupabaseEnabled) return sb.fichajesDeTrabajadorEnFecha(trabajadorId, fecha);
  return delay(
    loadDB().fichajes.filter(
      (f) => f.trabajadorId === trabajadorId && f.timestamp.slice(0, 10) === fecha
    )
  );
}

/** Fichajes de un trabajador entre dos fechas YYYY-MM-DD, ambas incluidas. */
export async function fichajesDeTrabajadorEnRango(
  trabajadorId: string,
  desde: string,
  hasta: string
): Promise<Fichaje[]> {
  if (isSupabaseEnabled) return sb.fichajesDeTrabajadorEnRango(trabajadorId, desde, hasta);
  return delay(
    loadDB().fichajes.filter(
      (f) =>
        f.trabajadorId === trabajadorId &&
        f.timestamp.slice(0, 10) >= desde &&
        f.timestamp.slice(0, 10) <= hasta
    )
  );
}

/**
 * Jornada de hoy de un trabajador: incluye `entrada`/`salida` (igual que
 * antes, para no romper a quien ya lee esos dos campos) más pausas, horas
 * extra y el estado actual (sin_fichar/trabajando/descansando/en_extra/cerrado).
 */
export async function estadoFichaje(trabajadorId: string): Promise<Jornada> {
  const hoy = await fichajesDeTrabajadorHoy(trabajadorId);
  return calcularJornada(hoy);
}

function esTarde(tipo: TipoFichaje, horaEntradaObra: string): boolean {
  if (tipo !== "entrada") return false;
  const [h, m] = horaEntradaObra.split(":").map(Number);
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
}

export interface FicharOpts {
  /** Hora de entrada del cuadrante de la obra ("HH:MM"), para saber si es "tarde". */
  horaEntradaObra?: string;
}

/** Registra un fichaje (entrada/salida/pausa/hora extra) capturando GPS. */
export async function fichar(
  trabajadorId: string,
  tipo: TipoFichaje,
  obraId: string | null,
  opts: FicharOpts = {}
): Promise<Fichaje> {
  if (isSupabaseEnabled) return sb.fichar(trabajadorId, tipo, obraId, opts);
  const gps = await capturarGPS();
  const now = new Date();
  const tarde = esTarde(tipo, opts.horaEntradaObra ?? HORA_ENTRADA_POR_DEFECTO);
  const nowIso = now.toISOString();
  const fichaje: Fichaje = {
    id: uid("f"),
    trabajadorId,
    obraId,
    tipo,
    timestamp: nowIso,
    gps,
    estado: tarde ? "tarde" : "correcto",
    creadoEn: nowIso,
    corrigeA: null,
  };
  updateDB((db) => db.fichajes.push(fichaje));
  return fichaje;
}
