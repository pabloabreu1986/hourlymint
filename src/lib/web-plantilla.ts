// Plantillas para la mini-web de un cliente. El super-admin las inserta
// con un clic desde su panel y las adapta:
//  - Premium: basada en la estrategia de experiencias de FORGEVIA
//    (Essential / Signature / Bespoke, reserva, libro del proyecto…).
//  - Básica: una sección de cada tipo, como punto de partida genérico.
import { uid } from "./db";
import type { ItemWeb, SeccionWeb } from "./types";

const item = (x: Omit<ItemWeb, "id">): ItemWeb => ({ id: uid("wi"), ...x });

/** Plantilla premium (experiencias tipo FORGEVIA). */
export function plantillaWebPremium(nombreCorto: string): SeccionWeb[] {
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

/** Plantilla básica: una sección de cada tipo, lista para adaptar. */
export function plantillaWebBasica(nombreCorto: string): SeccionWeb[] {
  return [
    {
      id: uid("ws"),
      tipo: "hero",
      titulo: `Bienvenido a ${nombreCorto}.`,
      subtitulo: "Cuéntale al mundo en una frase qué hace tu empresa y por qué elegirte.",
      items: [],
    },
    {
      id: uid("ws"),
      tipo: "texto",
      titulo: "Quiénes somos",
      subtitulo:
        "Presenta tu empresa en un par de párrafos: tu historia, tu equipo y tu manera de trabajar.",
      items: [],
    },
    {
      id: uid("ws"),
      tipo: "cards",
      titulo: "Nuestros servicios",
      subtitulo: "Los servicios que ofreces, cada uno con lo que incluye.",
      items: [
        item({
          titulo: "Servicio 1",
          texto: "Descripción corta del servicio.",
          puntos: ["Qué incluye", "Otro punto incluido", "Y otro más"],
        }),
        item({
          titulo: "Servicio 2",
          etiqueta: "El más solicitado",
          texto: "Descripción corta del servicio.",
          destacada: true,
          puntos: ["Qué incluye", "Otro punto incluido", "Y otro más"],
        }),
        item({
          titulo: "Servicio 3",
          texto: "Descripción corta del servicio.",
          puntos: ["Qué incluye", "Otro punto incluido"],
        }),
      ],
    },
    {
      id: uid("ws"),
      tipo: "lista",
      titulo: "Cómo trabajamos",
      subtitulo: "Los pasos de tu forma de trabajar, en orden.",
      items: [
        item({ texto: "Primera visita y toma de datos" }),
        item({ texto: "Presupuesto detallado sin compromiso" }),
        item({ texto: "Ejecución con seguimiento diario" }),
        item({ texto: "Entrega y garantía" }),
      ],
    },
    {
      id: uid("ws"),
      tipo: "chips",
      titulo: "Zonas de trabajo",
      subtitulo: "",
      items: [
        item({ texto: "Madrid capital" }),
        item({ texto: "Zona norte" }),
        item({ texto: "Zona sur" }),
        item({ texto: "Corredor del Henares" }),
      ],
    },
    {
      id: uid("ws"),
      tipo: "faq",
      titulo: "Preguntas frecuentes",
      subtitulo: "",
      items: [
        item({ titulo: "¿Dais presupuesto sin compromiso?", texto: "Sí, la primera visita y el presupuesto son gratuitos." }),
        item({ titulo: "¿Qué garantía tienen los trabajos?", texto: "Todos nuestros trabajos incluyen garantía por escrito." }),
      ],
    },
    {
      id: uid("ws"),
      tipo: "cta",
      titulo: "¿Hablamos?",
      subtitulo: "Llámanos o escríbenos y te respondemos hoy mismo.",
      items: [],
      telefono: "",
      email: "",
      whatsapp: "",
    },
  ];
}
