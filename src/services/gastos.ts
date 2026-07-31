// Gastos: el trabajador los presenta (con justificante); el admin los resuelve.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { EstadoGasto, Gasto } from "@/lib/types";
import * as sb from "./supabase/gastos";

export async function listGastos(): Promise<Gasto[]> {
  if (isSupabaseEnabled) return sb.listGastos();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .gastos.filter((g) => g.tenantId === tid)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
  );
}

export async function gastosDe(trabajadorId: string): Promise<Gasto[]> {
  if (isSupabaseEnabled) return sb.gastosDe(trabajadorId);
  return delay(
    loadDB()
      .gastos.filter((g) => g.trabajadorId === trabajadorId)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
  );
}

export type NuevoGasto = Omit<Gasto, "id" | "tenantId" | "estado" | "creadoEn">;

export async function crearGasto(data: NuevoGasto): Promise<Gasto> {
  if (isSupabaseEnabled) return sb.crearGasto(data);
  const nuevo: Gasto = {
    id: uid("g"),
    tenantId: tenantActivoId(),
    estado: "pendiente",
    creadoEn: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.gastos.push(nuevo));
  return delay(nuevo);
}

export async function cambiarEstadoGasto(id: string, estado: EstadoGasto): Promise<Gasto> {
  if (isSupabaseEnabled) return sb.cambiarEstadoGasto(id, estado);
  let out: Gasto | undefined;
  updateDB((db) => {
    const g = db.gastos.find((x) => x.id === id);
    if (g) {
      g.estado = estado;
      out = g;
    }
  });
  if (!out) throw new Error("Gasto no encontrado");
  return delay(out);
}
