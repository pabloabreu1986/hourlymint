// Importación del Excel de materiales (banco de precios) al catálogo.
// Estructura por pestaña (cada pestaña = familia/gremio):
//   fila 1: proveedores agrupados (OBRAMAT / LEROY MERLIN…)
//   fila 2: Nº | ARTICULO | IMAGEN | REFERENCIA | PVP SIN IVA | PVP CON IVA | (repite por proveedor)
//   datos: desde la fila 3.
// Las imágenes incrustadas NO se extraen aquí (el navegador no las lee del
// .xlsx de forma fiable); se pegan luego o se cargan en la migración inicial.
import type { CategoriaArticulo, PrecioProveedor } from "@/lib/types";

export interface ArticuloImportado {
  nombre: string;
  familia: string;
  categoria: CategoriaArticulo;
  unidad: string;
  referencia: string;
  coste: number;
  precios: PrecioProveedor[];
}

/** "1.234,56" | "1234.56" | "12" → número o null. */
function num(s: unknown): number | null {
  if (s == null || s === "") return null;
  const t = String(s).replace(/[^\d.,-]/g, "").trim();
  if (!t) return null;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) ? n : null;
}

/** Detecta los bloques de proveedor en la fila 1 (nombre → columna de inicio). */
function proveedoresDeCabecera(fila1: any[]): { nombre: string; col: number }[] {
  const out: { nombre: string; col: number }[] = [];
  fila1.forEach((c, i) => {
    const t = (c ?? "").toString().trim();
    if (t) out.push({ nombre: t, col: i });
  });
  return out;
}

const SALTAR_HOJAS = new Set(["hoja1", "sheet1"]);

/** Parsea el libro completo (todas las pestañas) a artículos importables. */
export async function importarCatalogo(file: File): Promise<ArticuloImportado[]> {
  const XLSX: any = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const out: ArticuloImportado[] = [];

  for (const nombreHoja of wb.SheetNames as string[]) {
    if (SALTAR_HOJAS.has(nombreHoja.trim().toLowerCase())) continue;
    const ws = wb.Sheets[nombreHoja];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: true, defval: null });
    if (rows.length < 3) continue;

    // Proveedores: bloques de la fila 1; cada bloque ocupa Ref/sinIVA/conIVA.
    const bloques = proveedoresDeCabecera(rows[0] ?? []);

    for (let i = 2; i < rows.length; i++) {
      const r = rows[i] ?? [];
      const nombre = (r[1] ?? "").toString().trim(); // col B
      if (!nombre) continue;

      const precios: PrecioProveedor[] = [];
      for (const b of bloques) {
        const ref = (r[b.col] ?? "").toString().trim();
        const sinIva = num(r[b.col + 1]);
        const conIva = num(r[b.col + 2]);
        if (ref || sinIva != null) {
          precios.push({ proveedor: b.nombre, referencia: ref, precioSinIva: sinIva, precioConIva: conIva });
        }
      }
      if (precios.length === 0) continue;

      const conPrecio = precios.filter((p) => p.precioSinIva != null);
      const barato =
        conPrecio.sort((a, b) => (a.precioSinIva as number) - (b.precioSinIva as number))[0] ?? precios[0];

      out.push({
        nombre,
        familia: nombreHoja.trim(),
        categoria: "material",
        unidad: "ud",
        referencia: barato?.referencia ?? "",
        coste: barato?.precioSinIva ?? 0,
        precios,
      });
    }
  }
  return out;
}
