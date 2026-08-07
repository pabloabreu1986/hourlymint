// Clientes finales (CRM): la persona o empresa que encarga las obras.
// No confundir con el tenant (la empresa white-label). Se agrupa por tenant.
import { loadDB, updateDB, uid, delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { tenantActivoId } from "@/lib/host";
import type { Cliente } from "@/lib/types";
import * as sb from "./supabase/clientes";

export async function listClientes(): Promise<Cliente[]> {
  if (isSupabaseEnabled) return sb.listClientes();
  const tid = tenantActivoId();
  return delay(
    loadDB()
      .clientes.filter((c) => c.tenantId === tid)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  );
}

export async function getCliente(id: string): Promise<Cliente | null> {
  if (isSupabaseEnabled) return sb.getCliente(id);
  const tid = tenantActivoId();
  return delay(loadDB().clientes.find((c) => c.id === id && c.tenantId === tid) ?? null, 0);
}

export type NuevoCliente = Omit<Cliente, "id" | "tenantId" | "createdAt" | "activo"> &
  Partial<Pick<Cliente, "activo">>;

export async function crearCliente(data: NuevoCliente): Promise<Cliente> {
  if (isSupabaseEnabled) return sb.crearCliente(data);
  const nuevo: Cliente = {
    id: uid("c"),
    tenantId: tenantActivoId(),
    activo: true,
    createdAt: new Date().toISOString(),
    ...data,
  };
  updateDB((db) => db.clientes.push(nuevo));
  return delay(nuevo);
}

export async function actualizarCliente(id: string, patch: Partial<Cliente>): Promise<Cliente> {
  if (isSupabaseEnabled) return sb.actualizarCliente(id, patch);
  let out: Cliente | undefined;
  updateDB((db) => {
    const c = db.clientes.find((x) => x.id === id);
    if (c) {
      Object.assign(c, patch);
      out = c;
    }
  });
  if (!out) throw new Error("Cliente no encontrado");
  return delay(out);
}

export async function eliminarCliente(id: string): Promise<void> {
  if (isSupabaseEnabled) return sb.eliminarCliente(id);
  updateDB((db) => {
    db.clientes = db.clientes.filter((c) => c.id !== id);
    // Desvincular de obras, gastos, documentos y facturas.
    db.obras.forEach((o) => {
      if (o.clienteId === id) o.clienteId = null;
    });
    db.gastos.forEach((g) => {
      if (g.clienteId === id) g.clienteId = null;
    });
    db.documentos = db.documentos.filter((d) => d.clienteId !== id);
    db.facturas = db.facturas.filter((f) => f.clienteId !== id);
  });
  return delay(undefined);
}
