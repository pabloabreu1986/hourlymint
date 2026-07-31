// Gestión del talento: evaluaciones de desempeño, metas/objetivos y
// procesos de onboarding/offboarding.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Evaluacion, Meta, ProcesoOnboarding } from "@/lib/types";
import * as sb from "./supabase/talento";

// ── Evaluaciones ──

export async function listEvaluaciones(): Promise<Evaluacion[]> {
  if (isSupabaseEnabled) return sb.listEvaluaciones();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .evaluaciones.filter((e) => e.tenantId === tid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export async function evaluacionesDe(trabajadorId: string): Promise<Evaluacion[]> {
  if (isSupabaseEnabled) return sb.evaluacionesDe(trabajadorId);
  return delay(
    loadDB()
      .evaluaciones.filter((e) => e.trabajadorId === trabajadorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export type NuevaEvaluacion = Omit<Evaluacion, "id" | "tenantId" | "createdAt">;

export async function crearEvaluacion(data: NuevaEvaluacion): Promise<Evaluacion> {
  if (isSupabaseEnabled) return sb.crearEvaluacion(data);
  const nueva: Evaluacion = {
    id: uid("e"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.evaluaciones.push(nueva));
  return delay(nueva);
}

/** Media 1–5 de una evaluación. */
export function notaMedia(e: Evaluacion): number {
  const p = e.puntuaciones;
  return (p.puntualidad + p.calidad + p.seguridad + p.equipo) / 4;
}

// ── Metas / objetivos ──

export async function listMetas(): Promise<Meta[]> {
  if (isSupabaseEnabled) return sb.listMetas();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .metas.filter((m) => m.tenantId === tid)
      .sort((a, b) => a.fechaObjetivo.localeCompare(b.fechaObjetivo))
  );
}

/** Metas visibles para un trabajador: las suyas + las de empresa. */
export async function metasDe(trabajadorId: string): Promise<Meta[]> {
  if (isSupabaseEnabled) return sb.metasDe(trabajadorId);
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .metas.filter(
        (m) =>
          m.tenantId === tid && (m.trabajadorId === trabajadorId || m.trabajadorId === null)
      )
      .sort((a, b) => a.fechaObjetivo.localeCompare(b.fechaObjetivo))
  );
}

export type NuevaMeta = Omit<Meta, "id" | "tenantId" | "createdAt">;

export async function crearMeta(data: NuevaMeta): Promise<Meta> {
  if (isSupabaseEnabled) return sb.crearMeta(data);
  const nueva: Meta = {
    id: uid("me"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.metas.push(nueva));
  return delay(nueva);
}

export async function actualizarMeta(id: string, patch: Partial<Meta>): Promise<Meta> {
  if (isSupabaseEnabled) return sb.actualizarMeta(id, patch);
  let out: Meta | undefined;
  updateDB((db) => {
    const m = db.metas.find((x) => x.id === id);
    if (m) {
      Object.assign(m, patch);
      out = m;
    }
  });
  if (!out) throw new Error("Meta no encontrada");
  return delay(out);
}

export async function eliminarMeta(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarMeta(id);
  updateDB((db) => {
    db.metas = db.metas.filter((m) => m.id !== id);
  });
  return delay(undefined);
}

// ── Onboarding / offboarding ──

/** Plantillas por defecto de los checklists de alta y baja. */
export const PLANTILLA_ONBOARDING: Record<"alta" | "baja", string[]> = {
  alta: [
    "Contrato firmado",
    "Alta en Seguridad Social",
    "EPIs entregados (casco, botas, guantes)",
    "Formación PRL básica (20h)",
    "Reconocimiento médico",
    "Acceso a la app y primer fichaje",
  ],
  baja: [
    "Preaviso registrado",
    "Devolución de EPIs y herramientas",
    "Devolución de vehículo (si aplica)",
    "Finiquito preparado",
    "Baja en Seguridad Social",
    "Acceso a la app desactivado",
  ],
};

export async function listOnboardings(): Promise<ProcesoOnboarding[]> {
  if (isSupabaseEnabled) return sb.listOnboardings();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .onboardings.filter((o) => o.tenantId === tid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export async function crearOnboarding(
  usuarioId: string,
  tipo: "alta" | "baja"
): Promise<ProcesoOnboarding> {
  if (isSupabaseEnabled) return sb.crearOnboarding(usuarioId, tipo);
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
  updateDB((db) => db.onboardings.push(nuevo));
  return delay(nuevo);
}

export async function marcarTareaOnboarding(
  procesoId: string,
  tareaId: string,
  hecha: boolean
): Promise<ProcesoOnboarding> {
  if (isSupabaseEnabled) return sb.marcarTareaOnboarding(procesoId, tareaId, hecha);
  let out: ProcesoOnboarding | undefined;
  updateDB((db) => {
    const o = db.onboardings.find((x) => x.id === procesoId);
    if (o) {
      const t = o.tareas.find((x) => x.id === tareaId);
      if (t) t.hecha = hecha;
      out = o;
    }
  });
  if (!out) throw new Error("Proceso no encontrado");
  return delay(out);
}

export async function eliminarOnboarding(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarOnboarding(id);
  updateDB((db) => {
    db.onboardings = db.onboardings.filter((o) => o.id !== id);
  });
  return delay(undefined);
}
