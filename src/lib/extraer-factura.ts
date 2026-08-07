// Extracción de datos de una factura de proveedor SIN IA y sin coste:
//   · PDF con capa de texto → pdfjs-dist (rápido y fiable).
//   · Imagen o PDF escaneado (sin texto) → OCR con tesseract.js (más lento).
// Las líneas se detectan con heurísticas: el resultado es un punto de
// partida que SIEMPRE se revisa a mano en la tabla editable. Ambas librerías
// se cargan de forma diferida (solo al extraer), para no engordar el bundle.
import type { LineaCompra } from "@/lib/types";

export interface ResultadoExtraccion {
  proveedorNombre: string | null;
  numero: string | null;
  fecha: string | null; // YYYY-MM-DD
  lineas: LineaCompra[];
  textoCrudo: string;
  metodo: "pdf" | "ocr";
}

let lid = 0;
const nuevaLinea = (): LineaCompra["id"] => `lc_${Date.now().toString(36)}_${lid++}`;

const PROVEEDORES_CONOCIDOS = [
  "obramat",
  "bricomart",
  "leroy merlin",
  "leroy",
  "bauhaus",
  "brico depot",
  "bricodepot",
  "saltoki",
  "gamma",
];

/** Convierte "1.234,56" o "1234.56" a número. */
function parseNum(s: string): number {
  const limpio = s.replace(/[^\d.,-]/g, "").trim();
  if (!limpio) return 0;
  // Formato español: el último separador es el decimal.
  const tieneComa = limpio.includes(",");
  const norm = tieneComa
    ? limpio.replace(/\./g, "").replace(",", ".")
    : limpio;
  const n = Number(norm);
  return Number.isFinite(n) ? n : 0;
}

const NUM_RE = /-?\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?|-?\d+(?:[.,]\d+)?/g;
const UNIDAD_RE = /\b(unid|uds?|m2|m²|ml|kg|l|h|saco|caja|bote|palet|rollo|bolsa)\b/i;

/** ¿La línea es cabecera/total/pie/dirección y hay que ignorarla? */
function esRuido(l: string): boolean {
  const t = l.toLowerCase();
  return /(^|\s)(total|subtotal|base imponible|i\.?v\.?a|iban|cif|nif|factura|fecha|cliente|forma de pago|forma de venta|condiciones|vencimiento|descripci[óo]n|designacion|referencia|importe|tel[eé]fono|tlf|calle|avda|avenida|c\/|n[º°]\s|numero de cuenta|ticket|modos? de pago|efectivo|cambio|razon social|espa[ñn]a|madrid|observaciones|duplicado|ejemplar)\b/.test(
    t
  );
}

function detectarProveedor(texto: string): string | null {
  const t = texto.toLowerCase();
  if (/obramat|bricoman|b-?84406289/.test(t)) return "Obramat";
  const hit = PROVEEDORES_CONOCIDOS.find((p) => t.includes(p));
  if (!hit) return null;
  return hit
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** Plantilla de parseo específica por proveedor, si la reconocemos. */
function plantillaDe(texto: string): "obramat" | null {
  const t = texto.toLowerCase();
  if (/obramat|bricoman|b-?84406289/.test(t)) return "obramat";
  return null;
}

/**
 * Parser específico de facturas Obramat / Bricoman. Cada producto ocupa 3
 * renglones: "Nº Descripción" · "Referencia" · "Cantidad UNID. prec.SI descu
 * total.SI tasaIVA precioTTI importeTTI". Anclamos en la fila con "UNID." y
 * tomamos el precio unitario SIN IVA (primera cifra tras la cantidad).
 */
function parsearObramat(texto: string): LineaCompra[] {
  const lineas = texto.split("\n").map((s) => s.trim());
  const out: LineaCompra[] = [];
  for (let i = 0; i < lineas.length; i++) {
    const m = lineas[i].match(/^(\d+(?:[.,]\d+)?)\s+unid\.?\s+(.+)/i);
    if (!m) continue;
    const cantidad = parseNum(m[1]);
    const nums = (m[2].match(NUM_RE) ?? []).map(parseNum);
    if (nums.length < 2 || cantidad <= 0) continue;
    const precioUnitario = nums[0]; // Prec. unidad SIN IVA
    // Descripción: subir saltando la línea de referencia (solo dígitos).
    let descripcion = "";
    let referencia = "";
    for (let k = i - 1; k >= Math.max(0, i - 3); k--) {
      const prev = lineas[k];
      if (!prev) continue;
      if (/^\d{4,}$/.test(prev)) {
        referencia = prev;
        continue;
      }
      descripcion = prev.replace(/^\d+\s+/, "").trim();
      break;
    }
    if (descripcion.length < 2) continue;
    out.push({
      id: nuevaLinea(),
      descripcion: referencia ? `${descripcion} (ref. ${referencia})` : descripcion,
      cantidad,
      unidad: "ud",
      precioUnitario,
      total: Math.round(cantidad * precioUnitario * 100) / 100,
      articuloId: null,
    });
  }
  return out;
}

function detectarNumero(texto: string): string | null {
  const m = texto.match(/(?:factura|n[ºo.]|nº)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-/]{2,})/i);
  return m ? m[1] : null;
}

function detectarFecha(texto: string): string | null {
  const m1 = texto.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (m1) {
    const [, d, mo, y] = m1;
    const anio = y.length === 2 ? `20${y}` : y;
    return `${anio}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const m2 = texto.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  return m2 ? m2[0] : null;
}

/** Heurística: convierte líneas de texto en líneas de compra editables. */
function parsearLineas(texto: string): LineaCompra[] {
  const out: LineaCompra[] = [];
  for (const raw of texto.split("\n")) {
    const linea = raw.trim();
    if (linea.length < 4 || esRuido(linea)) continue;
    const nums = linea.match(NUM_RE);
    if (!nums || nums.length < 2) continue;
    // Solo aceptamos líneas que parezcan de producto: con unidad de medida
    // o cuyo importe final tenga decimales (evita direcciones/teléfonos).
    const tieneUnidad = UNIDAD_RE.test(linea);
    const importeConDecimales = /,\d/.test(nums[nums.length - 1]);
    if (!tieneUnidad && !importeConDecimales) continue;
    // Descripción = texto antes del primer número.
    const idx = linea.search(NUM_RE);
    const descripcion = linea.slice(0, idx).trim().replace(/[.\-·]+$/, "").trim();
    // La descripción debe tener letras (no ser otra cifra/código).
    if (descripcion.length < 3 || !/[a-záéíóúñ]/i.test(descripcion)) continue;
    const valores = nums.map(parseNum);
    let cantidad = 1;
    let precioUnitario = 0;
    let total = 0;
    if (valores.length >= 3) {
      cantidad = valores[0] || 1;
      precioUnitario = valores[1];
      total = valores[valores.length - 1];
    } else {
      precioUnitario = valores[0];
      total = valores[1];
      cantidad = precioUnitario > 0 ? Math.round((total / precioUnitario) * 100) / 100 || 1 : 1;
    }
    if (total <= 0 && precioUnitario <= 0) continue;
    out.push({
      id: nuevaLinea(),
      descripcion,
      cantidad,
      unidad: "ud",
      precioUnitario,
      total: total || Math.round(cantidad * precioUnitario * 100) / 100,
      articuloId: null,
    });
  }
  return out;
}

/** Lee un File a data URL. */
export function fileADataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function textoDePdf(file: File): Promise<{ texto: string; pagina1?: HTMLCanvasElement }> {
  const pdfjs: any = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const lineas: string[] = [];
  let pagina1: HTMLCanvasElement | undefined;

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    // Agrupar items por su posición vertical (misma línea).
    const filas = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items as any[]) {
      if (!("str" in it) || !it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      const arr = filas.get(y) ?? [];
      arr.push({ x: it.transform[4], s: it.str });
      filas.set(y, arr);
    }
    [...filas.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, arr]) => {
        lineas.push(
          arr
            .sort((a, b) => a.x - b.x)
            .map((i) => i.s)
            .join(" ")
        );
      });

    if (n === 1) {
      // Renderizamos la página 1 por si hay que hacer OCR (PDF escaneado).
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        pagina1 = canvas;
      }
    }
  }
  return { texto: lineas.join("\n"), pagina1 };
}

async function ocr(imagen: HTMLCanvasElement | File): Promise<string> {
  const Tesseract: any = await import("tesseract.js");
  const rec = Tesseract.recognize ?? Tesseract.default?.recognize;
  const { data } = await rec(imagen, "spa");
  return data.text ?? "";
}

export async function extraerFactura(file: File): Promise<ResultadoExtraccion> {
  const esPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  let texto = "";
  let metodo: "pdf" | "ocr" = "pdf";

  if (esPdf) {
    const { texto: t, pagina1 } = await textoDePdf(file);
    // Si el PDF apenas trae texto, es un escaneo → OCR de la página 1.
    if (t.replace(/\s/g, "").length < 40 && pagina1) {
      texto = await ocr(pagina1);
      metodo = "ocr";
    } else {
      texto = t;
    }
  } else {
    texto = await ocr(file);
    metodo = "ocr";
  }

  // Parser específico por proveedor si lo reconocemos; si no, genérico.
  const plantilla = plantillaDe(texto);
  const lineas = plantilla === "obramat" ? parsearObramat(texto) : parsearLineas(texto);

  return {
    proveedorNombre: detectarProveedor(texto),
    numero: detectarNumero(texto),
    fecha: detectarFecha(texto),
    lineas,
    textoCrudo: texto,
    metodo,
  };
}
