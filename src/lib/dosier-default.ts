// Plantilla de dosier corporativo por defecto. Reproduce la estructura del
// dosier de ejemplo (portada → 10 bloques → contraportada) con textos
// genéricos de empresa de reformas, listos para que el admin los personalice.
// Se pinta con la marca del tenant; aquí solo va el CONTENIDO, no el estilo.
import type { BloqueDosier, Dosier, Tenant, TipoBloqueDosier } from "./types";

/** id corto y estable, sin depender de la capa mock. */
function rid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

const item = (
  campos: Partial<{ titulo: string; texto: string; valor: string; imagen: string | null }>
) => ({ id: rid(), ...campos });

/** Bloques de ejemplo, en el orden del dosier de referencia. */
function bloquesPorDefecto(nombre: string): BloqueDosier[] {
  const b = (
    tipo: TipoBloqueDosier,
    eyebrow: string,
    titulo: string,
    subtitulo: string,
    items: BloqueDosier["items"] = []
  ): BloqueDosier => ({ id: rid(), tipo, activo: true, eyebrow, titulo, subtitulo, imagen: null, items });

  return [
    b(
      "texto-imagen",
      "01",
      "Quiénes somos",
      `En ${nombre} entendemos que una reforma no consiste únicamente en cambiar materiales.\n\nConsiste en mejorar la forma de vivir.\n\nNuestro compromiso es entregar obras de máxima calidad, cuidando cada detalle y respetando los plazos establecidos.\n\nTrabajamos tanto para particulares como para empresas, adaptándonos a las necesidades de cada proyecto y ofreciendo siempre soluciones a medida.`
    ),
    b("lista-imagen", "02", `¿Por qué elegir ${nombre}?`, "Lo que nos diferencia", [
      item({ titulo: "Presupuestos claros" }),
      item({ titulo: "Sin costes ocultos" }),
      item({ titulo: "Coordinación integral" }),
      item({ titulo: "Profesionales especializados" }),
      item({ titulo: "Materiales de primeras marcas" }),
      item({ titulo: "Garantía" }),
      item({ titulo: "Cumplimiento de plazos" }),
      item({ titulo: "Atención personalizada" }),
    ]),
    b("pasos", "03", "Nuestro proceso", "De la primera visita a la entrega final", [
      item({ titulo: "Visita técnica" }),
      item({ titulo: "Estudio de necesidades" }),
      item({ titulo: "Presupuesto detallado" }),
      item({ titulo: "Diseño del proyecto" }),
      item({ titulo: "Planificación" }),
      item({ titulo: "Inicio de obra" }),
      item({ titulo: "Control de calidad" }),
      item({ titulo: "Entrega final" }),
    ]),
    b("iconos", "04", "Qué incluye cada reforma", "Un servicio integral", [
      item({ titulo: "Demoliciones" }),
      item({ titulo: "Electricidad" }),
      item({ titulo: "Fontanería" }),
      item({ titulo: "Pladur" }),
      item({ titulo: "Pintura" }),
      item({ titulo: "Carpintería" }),
      item({ titulo: "Suelos" }),
      item({ titulo: "Baños" }),
      item({ titulo: "Cocinas" }),
      item({ titulo: "Climatización" }),
      item({ titulo: "Aerotermia" }),
      item({ titulo: "Iluminación" }),
      item({ titulo: "Domótica" }),
      item({ titulo: "Acabados premium" }),
    ]),
    b("servicios", "05", "Cómo trabajamos", "Método y transparencia en cada fase", [
      item({ titulo: "Protegemos la vivienda", texto: "Protegemos todas las zonas para mantener la vivienda en perfecto estado." }),
      item({ titulo: "Mantenemos limpieza diaria", texto: "Realizamos limpieza diaria para garantizar orden y comodidad." }),
      item({ titulo: "Supervisión constante", texto: "Controlamos cada fase de la obra para asegurar la máxima calidad." }),
      item({ titulo: "Comunicación continua", texto: "Te informamos de los avances y estamos siempre disponibles para ti." }),
      item({ titulo: "Fotografías del avance", texto: "Compartimos el progreso de la obra de forma periódica." }),
      item({ titulo: "Coordinación de gremios", texto: "Gestionamos y coordinamos todos los profesionales implicados." }),
    ]),
    b(
      "logos",
      "06",
      "Calidad",
      "Solo trabajamos con fabricantes reconocidos que garantizan durabilidad, diseño y rendimiento.",
      [
        item({ titulo: "KNAUF" }),
        item({ titulo: "PLACO" }),
        item({ titulo: "KERABEN" }),
        item({ titulo: "PORCELANOSA" }),
        item({ titulo: "ROCA" }),
        item({ titulo: "GROHE" }),
        item({ titulo: "DAIKIN" }),
        item({ titulo: "MITSUBISHI ELECTRIC" }),
        item({ titulo: "HISENSE" }),
        item({ titulo: "LG" }),
      ]
    ),
    b("lista-detalle", "07", "Tecnología", "Herramientas que nos ayudan a decidir mejor", [
      item({ titulo: "Renderizados 3D", texto: "Visualiza tu reforma antes de que empiece." }),
      item({ titulo: "Realidad virtual", texto: "Recorre tu futuro espacio como si ya estuviera hecho." }),
      item({ titulo: "Antes y después", texto: "Compara y visualiza la transformación." }),
      item({ titulo: "Recorridos virtuales", texto: "Experiencia inmersiva de tu proyecto." }),
      item({ titulo: "Simulación del resultado", texto: "Imágenes realistas para decisiones más acertadas." }),
      item({ titulo: "Seguimiento fotográfico", texto: "Documentamos cada fase de la obra." }),
      item({ titulo: "Control digital de la obra", texto: "Planificación, control y seguimiento en tiempo real." }),
    ]),
    b("antes-despues", "", "Antes y después", "El cambio habla por sí solo", [
      item({ titulo: "Antes", imagen: null }),
      item({ titulo: "Después", imagen: null }),
    ]),
    b("garantias", "09", "Garantías", "Tu tranquilidad, por escrito", [
      item({ titulo: "Garantía sobre la ejecución", texto: "Todos nuestros trabajos cuentan con garantía por escrito." }),
      item({ titulo: "Seguro de responsabilidad", texto: "Contamos con seguro de responsabilidad civil para tu tranquilidad." }),
      item({ titulo: "Cumplimiento normativo", texto: "Todas las instalaciones y materiales cumplen la normativa vigente." }),
      item({ titulo: "Materiales certificados", texto: "Trabajamos con materiales de primeras marcas y certificados." }),
    ]),
    b("testimonios", "10", "Opiniones", "Lo que dicen nuestros clientes", [
      item({ valor: "5", texto: "Muy profesionales, cuidaron cada detalle y el resultado ha superado nuestras expectativas.", titulo: "" }),
      item({ valor: "5", texto: "Cumplieron los plazos y el presupuesto. Gran equipo y muy buena comunicación.", titulo: "" }),
      item({ valor: "5", texto: "Todo perfecto, los recomendamos al 100%.", titulo: "" }),
      item({ valor: "5", texto: "Los volvería a contratar sin duda. Trato excelente desde el primer día.", titulo: "" }),
    ]),
    b("pagos", "11", "Forma de pago", "Cómoda, clara y adaptada a cada proyecto.", [
      item({ valor: "60%", titulo: "Reserva y planificación", texto: "Para inicio de proyecto, estudio y planificación." }),
      item({ valor: "20%", titulo: "Inicio de acabados", texto: "Al comenzar la fase de acabados." }),
      item({ valor: "20%", titulo: "Entrega final", texto: "A la finalización de la obra y revisión final." }),
    ]),
    b("faq", "12", "Preguntas frecuentes", "Resolvemos tus dudas", [
      item({ titulo: "¿Cuánto dura la obra?", texto: "La duración depende del tipo y magnitud del proyecto. Se establece un calendario detallado antes de comenzar." }),
      item({ titulo: "¿Quién compra los materiales?", texto: "Nosotros nos encargamos de la compra y gestión de todos los materiales." }),
      item({ titulo: "¿Puedo modificar cosas?", texto: "Sí, durante la obra pueden surgir cambios. Te asesoramos sobre el impacto en plazo y coste." }),
      item({ titulo: "¿Cómo se protege la vivienda?", texto: "Protegemos todas las zonas de paso y trabajo, y realizamos limpieza diaria." }),
      item({ titulo: "¿Qué garantía tengo?", texto: "Ofrecemos garantía por escrito tanto en materiales como en ejecución." }),
    ]),
  ];
}

/** Construye el dosier por defecto para un tenant (contenido de ejemplo). */
export function nuevoDosier(t: Pick<Tenant, "nombreCorto">): Dosier {
  const nombre = t.nombreCorto || "nuestra empresa";
  return {
    titulo: "Dosier corporativo",
    eslogan: "Construimos espacios. Creamos confianza.",
    portada: null,
    contraportada: null,
    contacto: { telefono: "", email: "", web: "", direccion: "" },
    bloques: bloquesPorDefecto(nombre),
  };
}
