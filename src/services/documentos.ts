// Gestor documental: documentos de empleado (nóminas, contratos…) o de
// empresa (usuarioId null, visibles para toda la plantilla). El contenido
// viaja como data URL tanto en mock como en BD (suficiente para PDFs y
// fotos pequeñas; si algún cliente necesita archivos grandes, se migrará
// al bucket de Storage como las fotos de obra).
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Documento } from "@/lib/types";
import * as sb from "./supabase/documentos";

export async function listDocumentos(): Promise<Documento[]> {
  if (isSupabaseEnabled) return sb.listDocumentos();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .documentos.filter((d) => d.tenantId === tid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

/** Documentos visibles para un empleado: los suyos + los de empresa. */
export async function documentosDe(usuarioId: string): Promise<Documento[]> {
  if (isSupabaseEnabled) return sb.documentosDe(usuarioId);
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .documentos.filter(
        (d) => d.tenantId === tid && (d.usuarioId === usuarioId || d.usuarioId === null)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export type NuevoDocumento = Omit<Documento, "id" | "tenantId" | "createdAt">;

export async function subirDocumento(data: NuevoDocumento): Promise<Documento> {
  if (isSupabaseEnabled) return sb.subirDocumento(data);
  const nuevo: Documento = {
    id: uid("d"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.documentos.push(nuevo));
  return delay(nuevo);
}

export async function eliminarDocumento(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarDocumento(id);
  updateDB((db) => {
    db.documentos = db.documentos.filter((d) => d.id !== id);
  });
  return delay(undefined);
}
