import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { capturarGPS } from "@/lib/geo";
import type { Fichaje, TipoFichaje } from "@/lib/types";
import type { EstadoFichajeTrabajador } from "../fichajes";
import { toFichaje, fromFichaje, check } from "./_map";

const HORA_LIMITE_ENTRADA = 9;

/** Rango ISO [inicio, fin) del día de hoy en hora local. */
function rangoHoy(): [string, string] {
  const ini = new Date();
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
  const [ini, fin] = rangoHoy();
  const data = check(
    await sb().from("fichajes").select("*").gte("timestamp", ini).lt("timestamp", fin)
  );
  return (data ?? []).map(toFichaje);
}

export async function fichajesDeTrabajadorHoy(trabajadorId: string): Promise<Fichaje[]> {
  const [ini, fin] = rangoHoy();
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

export async function estadoFichaje(trabajadorId: string): Promise<EstadoFichajeTrabajador> {
  const hoy = await fichajesDeTrabajadorHoy(trabajadorId);
  return {
    entrada: hoy.find((f) => f.tipo === "entrada") ?? null,
    salida: hoy.find((f) => f.tipo === "salida") ?? null,
  };
}

export async function fichar(
  trabajadorId: string,
  tipo: TipoFichaje,
  obraId: string | null
): Promise<Fichaje> {
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
  check(await sb().from("fichajes").insert(fromFichaje(fichaje)));
  return fichaje;
}
