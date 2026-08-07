import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Cliente } from "@/lib/types";
import type { NuevoCliente } from "../clientes";
import { toCliente, fromCliente, check } from "./_map";

export async function listClientes(): Promise<Cliente[]> {
  const data = check(
    await sb().from("clientes").select("*").eq("tenant_id", tenantActivoId()).order("nombre")
  );
  return (data ?? []).map(toCliente);
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const { data, error } = await sb().from("clientes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCliente(data) : null;
}

export async function crearCliente(input: NuevoCliente): Promise<Cliente> {
  const nuevo: Cliente = {
    id: uid("c"),
    tenantId: tenantActivoId(),
    activo: true,
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("clientes").insert(fromCliente(nuevo)));
  return nuevo;
}

export async function actualizarCliente(id: string, patch: Partial<Cliente>): Promise<Cliente> {
  const data = check(
    await sb().from("clientes").update(fromCliente(patch)).eq("id", id).select().single()
  );
  return toCliente(data);
}

export async function eliminarCliente(id: string): Promise<void> {
  const client = sb();
  // Desvincular de obras y gastos; borrar documentos y facturas del cliente.
  check(await client.from("obras").update({ cliente_id: null }).eq("cliente_id", id));
  check(await client.from("gastos").update({ cliente_id: null }).eq("cliente_id", id));
  check(await client.from("documentos").delete().eq("cliente_id", id));
  check(await client.from("facturas").delete().eq("cliente_id", id));
  check(await client.from("clientes").delete().eq("id", id));
}
