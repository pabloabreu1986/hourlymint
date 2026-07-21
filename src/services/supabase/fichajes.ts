import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { capturarGPS } from "@/lib/geo";
import { calcularJornada, type Jornada } from "@/lib/horas";
import type { Fichaje, TipoFichaje } from "@/lib/types";
import type { FicharOpts } from "../fichajes";
import { toFichaje, fromFichaje, check } from "./_map";

const HORA_ENTRADA_POR_DEFECTO = "09:00";

/** Rango ISO [inicio, fin) de un día en hora local. */
function rangoDia(fecha: Date): [string, string] {
  const ini = new Date(fecha);
  ini.setHours(0, 0, 0, 0);
  const fin = new Date(ini);
  fin.setDate(fin.getDate() + 1);
  return [ini.toISOString(), fin.toISOString()];
}

export async function listFichajes(): Promise<Fichaje[]> {
  const data = check(await sb().from("fichajes").select("*"));
  return (data ?? []).map(toFichaje);
}

export async function fichajesDeHoy(): Promise<Fichaje[]> {
  const [ini, fin] = rangoDia(new Date());
  const data = check(
    await sb().from("fichajes").select("*").gte("timestamp", ini).lt("timestamp", fin)
  );
  return (data ?? []).map(toFichaje);
}

export async function fichajesDeTrabajadorHoy(trabajadorId: string): Promise<Fichaje[]> {
  const [ini, fin] = rangoDia(new Date());
  const data = check(
    await sb()
      .from("fichajes")
      .select("*")
      .eq("trabajador_id", trabajadorId)
      .gte("timestamp", ini)
      .lt("timestamp", fin)
  );
  return (data ?? []).map(toFichaje);
}

export async function fichajesDeTrabajadorEnFecha(
  trabajadorId: string,
  fecha: string
): Promise<Fichaje[]> {
  const [ini, fin] = rangoDia(new Date(`${fecha}T00:00:00`));
  const data = check(
    await sb()
      .from("fichajes")
      .select("*")
      .eq("trabajador_id", trabajadorId)
      .gte("timestamp", ini)
      .lt("timestamp", fin)
  );
  return (data ?? []).map(toFichaje);
}

export async function fichajesDeTrabajadorEnRango(
  trabajadorId: string,
  desde: string,
  hasta: string
): Promise<Fichaje[]> {
  const ini = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  fin.setDate(fin.getDate() + 1);
  const data = check(
    await sb()
      .from("fichajes")
      .select("*")
      .eq("trabajador_id", trabajadorId)
      .gte("timestamp", ini.toISOString())
      .lt("timestamp", fin.toISOString())
  );
  return (data ?? []).map(toFichaje);
}

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

export async function fichar(
  trabajadorId: string,
  tipo: TipoFichaje,
  obraId: string | null,
  opts: FicharOpts = {}
): Promise<Fichaje> {
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
  check(await sb().from("fichajes").insert(fromFichaje(fichaje)));
  return fichaje;
}
