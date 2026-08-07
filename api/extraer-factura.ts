// Vercel Serverless Function (Node).
// Lee una factura de proveedor (PDF o imagen) con Google Gemini y devuelve
// las líneas estructuradas en JSON. La API key vive SOLO aquí (variable de
// entorno GEMINI_API_KEY del servidor), nunca en el navegador.
//
// Requiere en Vercel:
//   GEMINI_API_KEY   → clave de Google AI Studio (https://aistudio.google.com/apikey)
//   GEMINI_MODEL     → opcional; por defecto "gemini-2.0-flash"

/* eslint-disable @typescript-eslint/no-explicit-any */

const PROMPT = `Eres un extractor de facturas de proveedores de material de construcción (Obramat, Leroy Merlin, Bauhaus, etc.).
Devuelve SOLO los datos de la factura en JSON según el esquema.
Reglas:
- "lineas": una por cada ARTÍCULO/producto de la factura. NO incluyas cabeceras, subtotales, impuestos, portes ni datos del cliente.
- "precioUnitario" y "total": SIEMPRE SIN IVA (base imponible). Si la factura da precio con IVA y sin IVA, usa el SIN IVA.
- Números en formato español (coma decimal, punto de miles) conviértelos a número (ej. "1.234,56" -> 1234.56).
- "unidad": ud, m², ml, kg, h, saco… (por defecto "ud").
- "fecha": formato YYYY-MM-DD.
- Si no encuentras un dato, deja la cadena vacía o la lista vacía.`;

const SCHEMA = {
  type: "object",
  properties: {
    proveedorNombre: { type: "string" },
    numero: { type: "string" },
    fecha: { type: "string" },
    lineas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          descripcion: { type: "string" },
          cantidad: { type: "number" },
          unidad: { type: "string" },
          precioUnitario: { type: "number" },
          total: { type: "number" },
        },
        required: ["descripcion", "cantidad", "precioUnitario", "total"],
      },
    },
  },
  required: ["lineas"],
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res
      .status(500)
      .json({ error: "Falta configurar GEMINI_API_KEY en el servidor (Vercel)." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const mimeType = String(body.mimeType ?? "");
  const data = String(body.data ?? "");
  if (!data || !mimeType) {
    return res.status(400).json({ error: "Falta el documento (mimeType/data)." });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
          temperature: 0,
        },
      }),
    });

    const json: any = await r.json();
    if (!r.ok) {
      const msg = json?.error?.message ?? `Error ${r.status} de Gemini`;
      return res.status(502).json({ error: msg });
    }

    const texto = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let parsed: any;
    try {
      parsed = JSON.parse(texto);
    } catch {
      return res.status(502).json({ error: "Gemini no devolvió JSON válido." });
    }

    return res.status(200).json({
      proveedorNombre: parsed.proveedorNombre ?? null,
      numero: parsed.numero ?? null,
      fecha: parsed.fecha ?? null,
      lineas: Array.isArray(parsed.lineas) ? parsed.lineas : [],
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Error llamando a Gemini." });
  }
}
