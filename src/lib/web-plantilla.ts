// Plantilla de ejemplo para la mini-web de un cliente, basada en la
// estrategia premium de FORGEVIA (Experiencias Essential / Signature /
// Bespoke). El super-admin la inserta con un clic y la adapta.
import { uid } from "./db";
import type { ItemWeb, SeccionWeb } from "./types";

export function plantillaWebEjemplo(nombreCorto: string): SeccionWeb[] {
  const item = (x: Omit<ItemWeb, "id">): ItemWeb => ({ id: uid("wi"), ...x });
  return [
    {
      id: uid("ws"),
      tipo: "hero",
      titulo: "Construimos el valor de tu propiedad.",
      subtitulo: `${nombreCorto} no vende reformas: entrega proyectos llave en mano con diseño, ejecución, control de calidad y una experiencia de cliente diferenciadora.`,
      items: [],
    },
    {
      id: uid("ws"),
      tipo: "cards",
      titulo: "Nuestras experiencias",
      subtitulo: "Tres formas de trabajar contigo, según lo que necesite tu proyecto.",
      items: [
        item({
          titulo: "Essential",
          etiqueta: "Baños, cocinas y reformas parciales",
          texto: "Lo fundamental, bien hecho.",
          puntos: [
            "Visita técnica y presupuesto",
            "Coordinación integral de la obra",
            "Materiales acordados",
            "Limpieza final",
            `Garantía ${nombreCorto}`,
            "Entrega técnica",
          ],
        }),
        item({
          titulo: "Signature",
          etiqueta: "Servicio estrella",
          texto: "Todo Essential, más diseño y dirección de proyecto.",
          destacada: true,
          puntos: [
            "Diseño e interiorismo",
            "Arquitecto cuando sea necesario",
            "Renders 3D y moodboard",
            "Director de proyecto",
            "Hasta 2 revisiones de diseño",
            `Libro del Proyecto ${nombreCorto}`,
            "Reportaje fotográfico profesional",
            "Pasaporte de la Vivienda",
          ],
        }),
        item({
          titulo: "Bespoke",
          etiqueta: "A medida",
          texto: "Todo Signature, con un equipo dedicado de principio a fin.",
          puntos: [
            "Arquitecto e interiorista dedicados",
            "Decoración personalizada",
            "Recorrido virtual 3D",
            "Diseño de iluminación y mobiliario",
            "Acompañamiento a showrooms",
            "Vídeo cinematográfico y entrega VIP",
            "Revisión postventa a los 6 y 12 meses",
          ],
        }),
      ],
    },
    {
      id: uid("ws"),
      tipo: "chips",
      titulo: "Reserva de proyecto",
      subtitulo: "Se descuenta íntegra al contratar la obra.",
      items: [
        item({ texto: "Baño · 300 €" }),
        item({ texto: "Cocina · 500 €" }),
        item({ texto: "Reforma integral · 1.000 €" }),
        item({ texto: "Local · 1.500 €" }),
      ],
    },
    {
      id: uid("ws"),
      tipo: "lista",
      titulo: "El Libro del Proyecto",
      subtitulo: "Cada proyecto se entrega documentado de principio a fin.",
      items: [
        item({ texto: "Portada personalizada y estado actual" }),
        item({ texto: "Renders y selección de materiales" }),
        item({ texto: "Cronograma y presupuesto" }),
        item({ texto: "Garantías y documentación técnica" }),
        item({ texto: "Fotografías finales del proyecto" }),
      ],
    },
    {
      id: uid("ws"),
      tipo: "faq",
      titulo: "Preguntas frecuentes",
      subtitulo: "",
      items: [
        item({
          titulo: "¿Cómo es la forma de pago?",
          texto: "60 % al inicio, 20 % durante la obra y 20 % a la entrega.",
        }),
        item({
          titulo: "¿Qué incluye la entrega premium?",
          texto: `Una caja ${nombreCorto} con la documentación del proyecto, garantía, memoria USB y detalles personalizados según el tipo de proyecto.`,
        }),
        item({
          titulo: "¿La reserva de proyecto se pierde?",
          texto: "No: se descuenta íntegramente del presupuesto al contratar la obra.",
        }),
      ],
    },
    {
      id: uid("ws"),
      tipo: "cta",
      titulo: "¿Hablamos de tu proyecto?",
      subtitulo: "Cuéntanos qué tienes en mente y te preparamos una visita técnica.",
      items: [],
      telefono: "",
      email: "",
      whatsapp: "",
    },
  ];
}
