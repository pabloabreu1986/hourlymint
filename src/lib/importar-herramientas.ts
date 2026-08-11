// Importación de herramientas desde un archivo. Formatos soportados:
//   · Excel (.xlsx, .xls) → SheetJS (carga diferida, no engorda el bundle).
//   · CSV / texto (.csv, .txt) → parseo propio (separador , o ;).
//   · PDF con capa de texto → pdfjs (reutiliza el lector de facturas).
// El resultado SIEMPRE se revisa en una tabla editable antes de guardar:
// las heurísticas son un punto de partida, no una verdad absoluta.
import { textoDePdf } from "@/lib/extraer-factura";

/** Fila de herramienta detectada, lista para editar antes de importar. */
export interface FilaHerramienta {
  id: string;
  nombre: string;
  cantidad: number;
  ubicacion: string; // obraId o "almacen"
}

let fid = 0;
const nuevaFila = (): string => `fh_${Date.now().toString(36)}_${fid++}`;

/** "1.234,56" o "1234.56" o "12" → número (fallback 1). */
function parseCantidad(s: string): number {
  const limpio = String(s ?? "").replace(/[^\d.,-]/g, "").trim();
  if (!limpio) return 1;
  const norm = limpio.includes(",")
    ? limpio.replace(/\./g, "").replace(",", ".")
    : limpio;
  const n = Math.round(Number(norm));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const RE_NOMBRE = /nombre|herramienta|descripci|art[íi]culo|producto|item|material/i;
const RE_CANTIDAD = /cantidad|cant\.?|uds?|unidades|stock|qty|n[º°ºo]/i;
const RE_UBICACION = /ubicaci|almac[eé]n|lugar|obra|localizaci/i;

/** ¿La fila parece una cabecera (contiene la palabra "nombre"/"cantidad"…)? */
function esCabecera(celdas: string[]): boolean {
  const juntas = celdas.join(" ").toLowerCase();
  return RE_NOMBRE.test(juntas) || RE_CANTIDAD.test(juntas);
}

/** Localiza las columnas nombre/cantidad/ubicación a partir de la cabecera. */
function mapearColumnas(cabecera: string[]): { nombre: number; cantidad: number; ubicacion: number } {
  let nombre = -1;
  let cantidad = -1;
  let ubicacion = -1;
  cabecera.forEach((c, i) => {
    const t = c.toLowerCase();
    if (nombre < 0 && RE_NOMBRE.test(t)) nombre = i;
    else if (cantidad < 0 && RE_CANTIDAD.test(t)) cantidad = i;
    else if (ubicacion < 0 && RE_UBICACION.test(t)) ubicacion = i;
  });
  // Si no reconocemos la cabecera: col 0 = nombre, col 1 = cantidad.
  if (nombre < 0) nombre = 0;
  if (cantidad < 0) cantidad = 1;
  return { nombre, cantidad, ubicacion };
}

/** Convierte una matriz de celdas (Excel/CSV) en filas de herramienta. */
function filasDeMatriz(filas: string[][]): FilaHerramienta[] {
  const limpias = filas
    .map((f) => f.map((c) => String(c ?? "").trim()))
    .filter((f) => f.some((c) => c.length > 0));
  if (limpias.length === 0) return [];

  const tieneCabecera = esCabecera(limpias[0]);
  const col = tieneCabecera ? mapearColumnas(limpias[0]) : { nombre: 0, cantidad: 1, ubicacion: -1 };
  const cuerpo = tieneCabecera ? limpias.slice(1) : limpias;

  const out: FilaHerramienta[] = [];
  for (const f of cuerpo) {
    const nombre = (f[col.nombre] ?? "").trim();
    if (!nombre) continue;
    out.push({
      id: nuevaFila(),
      nombre,
      cantidad: parseCantidad(f[col.cantidad] ?? ""),
      ubicacion: col.ubicacion >= 0 ? (f[col.ubicacion] ?? "").trim() || "almacen" : "almacen",
    });
  }
  return out;
}

/** Parte una línea CSV respetando comillas. Autodetecta , o ; como separador. */
function parseCSV(texto: string): string[][] {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lineas.length === 0) return [];
  const sep = (lineas[0].match(/;/g)?.length ?? 0) > (lineas[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  return lineas.map((linea) => {
    const celdas: string[] = [];
    let actual = "";
    let enComillas = false;
    for (let i = 0; i < linea.length; i++) {
      const ch = linea[i];
      if (ch === '"') {
        if (enComillas && linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else enComillas = !enComillas;
      } else if (ch === sep && !enComillas) {
        celdas.push(actual);
        actual = "";
      } else actual += ch;
    }
    celdas.push(actual);
    return celdas;
  });
}

/** PDF con texto → cada renglón "Nombre … cantidad" se vuelve una fila. */
function filasDePdf(texto: string): FilaHerramienta[] {
  const out: FilaHerramienta[] = [];
  for (const raw of texto.split("\n")) {
    const linea = raw.trim();
    if (linea.length < 3) continue;
    // Ignora cabeceras/pies típicos.
    if (/^(nombre|herramienta|cantidad|ubicaci|almac[eé]n|total|inventario|listado|p[áa]gina)\b/i.test(linea))
      continue;
    // Nombre = texto (con letras); cantidad = última cifra de la línea, si la hay.
    const numMatch = linea.match(/(\d+)\s*(uds?|unidades)?\.?\s*$/i);
    const cantidad = numMatch ? parseCantidad(numMatch[1]) : 1;
    const nombre = (numMatch ? linea.slice(0, numMatch.index).trim() : linea)
      .replace(/[.\-·:]+$/, "")
      .trim();
    if (nombre.length < 2 || !/[a-záéíóúñ]/i.test(nombre)) continue;
    out.push({ id: nuevaFila(), nombre, cantidad, ubicacion: "almacen" });
  }
  return out;
}

/** Punto de entrada: detecta el formato por extensión/MIME y extrae filas. */
export async function importarHerramientas(file: File): Promise<FilaHerramienta[]> {
  const nombre = file.name.toLowerCase();
  const esExcel =
    nombre.endsWith(".xlsx") ||
    nombre.endsWith(".xls") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("excel");
  const esPdf = file.type === "application/pdf" || nombre.endsWith(".pdf");

  if (esExcel) {
    const XLSX: any = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    const filas: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1, blankrows: false });
    return filasDeMatriz(filas.map((f) => f.map((c) => (c == null ? "" : String(c)))));
  }

  if (esPdf) {
    const { texto } = await textoDePdf(file);
    return filasDePdf(texto);
  }

  // CSV / texto plano.
  const texto = await file.text();
  return filasDeMatriz(parseCSV(texto));
}
