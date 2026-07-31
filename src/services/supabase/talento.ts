import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Evaluacion, Meta, ProcesoOnboarding } from "@/lib/types";
import type { NuevaEvaluacion, NuevaMeta } from "../talento";
import { PLANTILLA_ONBOARDING } from "../talento";
import {
  toEvaluacion,
  fromEvaluacion,
  toMeta,
  fromMeta,
  toOnboarding,
  fromOnboarding,
  check,
} from "./_map";

// ── Evaluaciones ──

export async function listEvaluaciones(): Promise<Evaluacion[]> {
  const data = check(
    await sb()
      .from("evaluaciones")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("created_at", { ascending: false })
  );
  return (data ?? []).map(toEvaluacion);
}

export async function evaluacionesDe(trabajadorId: string): Promise<Evaluacion[]> {
  const data = check(
    await sb()
      .from("evaluaciones")
      .select("*")
      .eq("trabajador_id", trabajadorId)
      .order("created_at", { ascending: false })
  );
  return (data ?? []).map(toEvaluacion);
}

export async function crearEvaluacion(input: NuevaEvaluacion): Promise<Evaluacion> {
  const nueva: Evaluacion = {
    id: uid("e"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("evaluaciones").insert(fromEvaluacion(nueva)));
  return nueva;
}

// ── Metas ──

export async function listMetas(): Promise<Meta[]> {
  const data = check(
    await sb()
      .from("metas")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("fecha_objetivo", { ascending: true })
  );
  return (data ?? []).map(toMeta);
}

export async function metasDe(trabajadorId: string): Promise<Meta[]> {
  const data = check(
    await sb()
      .from("metas")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .or(`trabajador_id.eq.${trabajadorId},trabajador_id.is.null`)
      .order("fecha_objetivo", { ascending: true })
  );
  return (data ?? []).map(toMeta);
}

export async function crearMeta(input: NuevaMeta): Promise<Meta> {
  const nueva: Meta = {
    id: uid("me"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("metas").insert(fromMeta(nueva)));
  return nueva;
}

export async function actualizarMeta(id: string, patch: Partial<Meta>): Promise<Meta> {
  const data = check(
    await sb().from("metas").update(fromMeta(patch)).eq("id", id).select().single()
  );
  return toMeta(data);
}

export async function eliminarMeta(id: string): Promise<void> {
  check(await sb().from("metas").delete().eq("id", id));
}

// ── Onboarding ──

export async function listOnboardings(): Promise<ProcesoOnboarding[]> {
  const data = check(
    await sb()
      .from("onboardings")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("created_at", { ascending: false })
  );
  return (data ?? []).map(toOnboarding);
}

export async function crearOnboarding(
  usuarioId: string,
  tipo: "alta" | "baja"
): Promise<ProcesoOnboarding> {
  const nuevo: ProcesoOnboarding = {
    id: uid("ob"),
    tenantId: tenantActivoId(),
    usuarioId,
    tipo,
    tareas: PLANTILLA_ONBOARDING[tipo].map((texto) => ({
      id: uid("ot"),
      texto,
      hecha: false,
    })),
    createdAt: new Date().toISOString(),
  };
  check(await sb().from("onboardings").insert(fromOnboarding(nuevo)));
  return nuevo;
}

export async function marcarTareaOnboarding(
  procesoId: string,
  tareaId: string,
  hecha: boolean
): Promise<ProcesoOnboarding> {
  const row = check(
    await sb().from("onboardings").select("*").eq("id", procesoId).single()
  );
  const proceso = toOnboarding(row);
  const tareas = proceso.tareas.map((t) => (t.id === tareaId ? { ...t, hecha } : t));
  const data = check(
    await sb()
      .from("onboardings")
      .update({ tareas })
      .eq("id", procesoId)
      .select()
      .single()
  );
  return toOnboarding(data);
}

export async function eliminarOnboarding(id: string): Promise<void> {
  check(await sb().from("onboardings").delete().eq("id", id));
}
