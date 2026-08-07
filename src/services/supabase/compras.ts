import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import { tenantActivoId } from "@/lib/host";
import type { Articulo, FacturaProveedor } from "@/lib/types";
import type { NuevaCompra } from "../compras";
import { costeNetoLinea } from "../compras";
import { toCompra, fromCompra, toArticulo, fromArticulo, check } from "./_map";

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
  const row = check(await client.from("compras_proveedor").select("*").eq("id", id).single());
  const c = toCompra(row);
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

  const arts = (
    check(await client.from("articulos").select("*").eq("tenant_id", c.tenantId)) ?? []
  ).map(toArticulo);
  const porNombre = new Map(arts.map((a) => [norm(a.nombre), a]));

  // Sube cada línea al banco: crea el artículo o actualiza su precio.
  const lineas = c.lineas.map((l) => ({ ...l }));
  for (const l of lineas) {
    const neto = costeNetoLinea(l);
    const art = l.articuloId
      ? arts.find((a) => a.id === l.articuloId)
      : porNombre.get(norm(l.descripcion));
    if (art) {
      const patch: Partial<Articulo> = {};
      if (neto > 0 && art.coste !== neto) patch.coste = neto;
      if (!art.proveedorId && c.proveedorId) patch.proveedorId = c.proveedorId;
      if (Object.keys(patch).length) {
        check(await client.from("articulos").update(fromArticulo(patch)).eq("id", art.id));
      }
      l.articuloId = art.id;
    } else {
      const nuevo: Articulo = {
        id: uid("art"),
        tenantId: c.tenantId,
        referencia: "",
        nombre: l.descripcion || "Artículo",
        proveedorId: c.proveedorId ?? null,
        categoria: "material",
        unidad: l.unidad || "ud",
        coste: neto,
        createdAt: new Date().toISOString(),
      };
      check(await client.from("articulos").insert(fromArticulo(nuevo)));
      arts.push(nuevo);
      porNombre.set(norm(nuevo.nombre), nuevo);
      l.articuloId = nuevo.id;
    }
  }

  const upd = check(
    await client
      .from("compras_proveedor")
      .update(fromCompra({ estado: "aprobada", lineas }))
      .eq("id", id)
      .select()
      .single()
  );
  return toCompra(upd);
}
