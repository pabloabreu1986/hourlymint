import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { FacturaProveedor } from "@/lib/types";
import type { NuevaCompra } from "../compras";
import { toCompra, fromCompra, check } from "./_map";

export async function listCompras(): Promise<FacturaProveedor[]> {
  const data = check(
    await sb()
      .from("compras_proveedor")
      .select("*")
      .eq("tenant_id", tenantActivoId())
      .order("fecha", { ascending: false })
  );
  return (data ?? []).map(toCompra);
}

export async function getCompra(id: string): Promise<FacturaProveedor | null> {
  const { data, error } = await sb().from("compras_proveedor").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCompra(data) : null;
}

export async function crearCompra(input: NuevaCompra): Promise<FacturaProveedor> {
  const nueva: FacturaProveedor = {
    id: uid("cmp"),
    tenantId: tenantActivoId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  check(await sb().from("compras_proveedor").insert(fromCompra(nueva)));
  return nueva;
}

export async function actualizarCompra(
  id: string,
  patch: Partial<FacturaProveedor>
): Promise<FacturaProveedor> {
  const data = check(
    await sb().from("compras_proveedor").update(fromCompra(patch)).eq("id", id).select().single()
  );
  return toCompra(data);
}

export async function eliminarCompra(id: string): Promise<void> {
  check(await sb().from("compras_proveedor").delete().eq("id", id));
}

export async function aprobarCompra(id: string): Promise<FacturaProveedor> {
  const client = sb();
  const compra = check(
    await client.from("compras_proveedor").update({ estado: "aprobada" }).eq("id", id).select().single()
  );
  const c = toCompra(compra);
  // Actualiza el coste de los artículos mapeados (último precio conocido).
  for (const l of c.lineas) {
    if (l.articuloId && l.precioUnitario > 0) {
      const { error } = await client
        .from("articulos")
        .update({ coste: l.precioUnitario })
        .eq("id", l.articuloId);
      if (error) throw new Error(error.message);
    }
  }
  return c;
}
