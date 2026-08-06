// Contenido del Onboarding Tour para el panel admin y para la app de
// trabajador. Cada guía está pensada para alguien SIN conocimiento previo:
// explica qué es el módulo y, paso a paso, cómo hacer lo principal, con
// referencias concretas a los botones y su ubicación.
import { claveDeRutaAdmin } from "@/lib/funciones";

export interface PasoTour {
  titulo: string;
  texto: string;
  /** Selector CSS del elemento a resaltar. Sin target = tarjeta centrada. */
  target?: string;
}

export interface DefTour {
  titulo: string;
  pasos: PasoTour[];
}

// ══════════════════ PANEL ADMIN ══════════════════

export const TOUR_BIENVENIDA: DefTour = {
  titulo: "Bienvenido a tu panel",
  pasos: [
    {
      titulo: "¡Hola! 👋 Empecemos",
      texto:
        "Este es el panel para gestionar tu empresa: obras, personal, horas, gastos y más. No hace falta saber nada previo: te guiamos en 1 minuto y podrás repetir esta guía cuando quieras.",
    },
    {
      titulo: "El menú de la izquierda",
      texto:
        "Todo se organiza aquí, por áreas: Obra, Tiempo, Finanzas, Talento, Comunicación… Pulsa cualquier apartado para abrirlo. Si no ves alguno, es que no está activado para tu empresa.",
      target: '[data-tour="nav"]',
    },
    {
      titulo: "El área de trabajo",
      texto:
        "En el centro se abre el módulo que elijas. Ahí verás las tablas, tarjetas y botones de acción (crear, editar, aprobar…). Cada módulo tiene su propia guía detallada.",
      target: '[data-tour="content"]',
    },
    {
      titulo: "Notificaciones",
      texto:
        "La campana te avisa de fichajes que faltan, incidencias nuevas o material pendiente. El número rojo son los avisos sin leer. Púlsala para verlos.",
      target: '[data-tour="bell"]',
    },
    {
      titulo: "Ayuda siempre a mano",
      texto:
        "Este es el botón de ayuda. Está en la cabecera de TODOS los módulos: púlsalo en cualquier momento para ver la guía paso a paso del módulo en el que estés. ¡Empieza a explorar!",
      target: '[data-tour="help"]',
    },
  ],
};

export const TOURS_MODULO: Record<string, DefTour> = {
  dashboard: {
    titulo: "Dashboard (inicio)",
    pasos: [
      { titulo: "Tu resumen del día", texto: "El Dashboard es la portada de tu panel: de un vistazo ves cómo va todo. Ábrelo cada mañana antes de empezar." },
      { titulo: "Las tarjetas de arriba", texto: "Son los indicadores clave: obras en curso, trabajadores fichados hoy, avance medio y alertas. Números para tomar el pulso al instante." },
      { titulo: "Las listas de abajo", texto: "Muestran lo último que ha pasado: fichajes recientes, partes cerrados e incidencias. Toca cualquier elemento para ir a su detalle." },
      { titulo: "Cómo moverte", texto: "Desde aquí, usa el menú de la izquierda para entrar en cualquier módulo. Siempre puedes volver pulsando “Dashboard”." },
    ],
  },
  obras: {
    titulo: "Obras",
    pasos: [
      { titulo: "Qué es este módulo", texto: "Aquí vive cada proyecto/obra de tu empresa. Es la base de casi todo: los fichajes, los partes y las fotos se asocian a una obra." },
      { titulo: "1. Crear una obra", texto: "Pulsa el botón “Nueva obra” (arriba a la derecha). Ponle nombre y dirección, y elige su estado (en curso, pendiente o finalizada)." },
      { titulo: "2. Asignar el equipo", texto: "Dentro de la obra, elige el encargado y los trabajadores del día. Ellos verán la obra asignada en su móvil automáticamente." },
      { titulo: "3. Definir el cuadrante", texto: "Marca los días laborables y el horario de entrada y salida. Con eso el sistema sabe cuándo se espera que fichen." },
      { titulo: "4. Seguir el avance", texto: "Actualiza el % de avance y el estado según progrese la obra. El avance también se refleja en el Dashboard." },
      { titulo: "Editar más tarde", texto: "Toca cualquier obra de la lista para abrirla y modificar sus datos, equipo o estado cuando lo necesites." },
    ],
  },
  trabajadores: {
    titulo: "Trabajadores",
    pasos: [
      { titulo: "Tu plantilla", texto: "Aquí das de alta a las personas de tu empresa y gestionas sus datos. Cada una tendrá acceso a la app de trabajador." },
      { titulo: "1. Añadir a alguien", texto: "Pulsa “Nuevo trabajador”. Rellena su nombre, puesto y teléfono. El nombre será también su usuario para entrar." },
      { titulo: "2. Darle acceso", texto: "Asígnale una contraseña. Con su nombre de usuario y esa contraseña iniciará sesión desde su móvil." },
      { titulo: "3. Vacaciones", texto: "Puedes fijar sus días de vacaciones anuales (por defecto 22). Eso alimenta el módulo de Ausencias." },
      { titulo: "Activar / desactivar", texto: "Si alguien deja la empresa, puedes desactivarlo para que no pueda acceder, sin perder su histórico." },
    ],
  },
  partes: {
    titulo: "Partes diarios",
    pasos: [
      { titulo: "El diario de la obra", texto: "Cada día, el encargado cierra un “parte” con lo que se ha hecho. Aquí los consultas todos, por obra y fecha." },
      { titulo: "Qué contiene un parte", texto: "Trabajo realizado, materiales que faltan, incidencias del día, % de avance y la firma del encargado. Ábrelo para ver el detalle." },
      { titulo: "Para qué te sirve", texto: "Es tu registro fiable de la obra: útil para justificar avances al cliente y detectar problemas a tiempo." },
    ],
  },
  fotografias: {
    titulo: "Fotografías",
    pasos: [
      { titulo: "El avance en imágenes", texto: "Todas las fotos que el equipo sube desde sus partes se recogen aquí, agrupadas por obra." },
      { titulo: "Cómo usarlas", texto: "Filtra por obra para seguir su evolución en el tiempo. Perfecto para enseñar el progreso o documentar el estado antes/después." },
    ],
  },
  materiales: {
    titulo: "Materiales",
    pasos: [
      { titulo: "Qué necesita cada obra", texto: "Cuando el equipo marca en su parte que falta material, aparece aquí, agrupado. Así sabes qué comprar y para qué obra." },
      { titulo: "Tu lista de compra", texto: "Revísalo con frecuencia para no frenar la obra por falta de material. Cada línea indica cantidad y unidad." },
    ],
  },
  incidencias: {
    titulo: "Incidencias",
    pasos: [
      { titulo: "Problemas en obra", texto: "Registra cualquier incidencia (un imprevisto, un desperfecto, un retraso) asociada a una obra." },
      { titulo: "1. Crear y describir", texto: "Pulsa “Nueva incidencia”, elige la obra, ponle título y descripción de lo ocurrido." },
      { titulo: "2. Seguir su estado", texto: "Cambia el estado a medida que avanzas: nueva → en proceso → resuelta. Así nada se queda olvidado." },
    ],
  },
  vehiculos: {
    titulo: "Vehículos",
    pasos: [
      { titulo: "Tu flota", texto: "Controla los vehículos de la empresa: modelo, matrícula y su estado (disponible, en uso o en taller)." },
      { titulo: "Quién lo lleva", texto: "Cada vehículo muestra a qué trabajador está asignado, para saber siempre dónde está cada uno." },
    ],
  },
  herramientas: {
    titulo: "Herramientas",
    pasos: [
      { titulo: "Inventario de herramientas", texto: "Lleva el control de qué herramientas tienes, cuántas y dónde están (en una obra o en el almacén)." },
      { titulo: "Evita pérdidas", texto: "Revisa la ubicación para no comprar de más ni perder material entre obras." },
    ],
  },
  almacen: {
    titulo: "Almacén",
    pasos: [
      { titulo: "Existencias", texto: "El stock de material del almacén, con su unidad y el mínimo recomendado." },
      { titulo: "Aviso de stock bajo", texto: "Cuando una existencia baja del mínimo se marca en rojo (STOCK BAJO), para que repongas a tiempo." },
    ],
  },
  informes: {
    titulo: "Informes",
    pasos: [
      { titulo: "Los números de tu empresa", texto: "Resúmenes de obras, partes y avance medio en gráficos fáciles de leer." },
      { titulo: "Para decidir", texto: "Úsalos para ver el estado global (obras por estado, partes cerrados) y compartir avances." },
    ],
  },
  horas: {
    titulo: "Horas (control horario)",
    pasos: [
      { titulo: "El fichaje de todos", texto: "Aquí ves las horas de cada trabajador: entradas, salidas, pausas y horas extra, por día." },
      { titulo: "Cómo leerlo", texto: "Cada fila es un fichaje con su hora y estado (correcto, tarde, pendiente…). Filtra por trabajador o por fecha para centrarte." },
      { titulo: "Correcciones seguras", texto: "Los fichajes nunca se borran ni se editan: una corrección crea siempre un registro nuevo, así queda todo trazable ante una inspección." },
      { titulo: "Alertas automáticas", texto: "El sistema avisa de fichajes que faltan o salidas automáticas, para que no se te escape ninguno." },
    ],
  },
  ausencias: {
    titulo: "Ausencias y vacaciones",
    pasos: [
      { titulo: "Las solicitudes del equipo", texto: "Cuando un trabajador pide vacaciones, una baja o un permiso desde su móvil, la solicitud llega aquí." },
      { titulo: "1. Revisar", texto: "Verás el tipo de ausencia, las fechas y el motivo. Ábrela para ver el detalle completo." },
      { titulo: "2. Aprobar o rechazar", texto: "Pulsa Aprobar o Rechazar. Puedes añadir un comentario; el trabajador recibe tu respuesta al instante." },
    ],
  },
  turnos: {
    titulo: "Turnos",
    pasos: [
      { titulo: "Planificar el trabajo", texto: "Asigna a cada trabajador qué hace cada día: en qué obra y en qué horario." },
      { titulo: "1. Crear un turno", texto: "Elige trabajador, día, obra y horas de inicio y fin. Puedes añadir una nota." },
      { titulo: "El equipo lo ve", texto: "Cada trabajador consulta sus turnos en su móvil, así todos saben dónde ir sin llamadas." },
    ],
  },
  gastos: {
    titulo: "Gastos",
    pasos: [
      { titulo: "Gastos del equipo", texto: "Los trabajadores presentan gastos (dietas, transporte, material…) con foto del ticket. Llegan aquí para tu visto bueno." },
      { titulo: "1. Revisar el justificante", texto: "Abre el gasto para ver el importe, la categoría y la foto del ticket." },
      { titulo: "2. Aprobar, rechazar o pagar", texto: "Cambia su estado según decidas. El trabajador ve en qué punto está su gasto en todo momento." },
    ],
  },
  nomina: {
    titulo: "Nómina",
    pasos: [
      { titulo: "Preparar la nómina", texto: "Un resumen de horas y conceptos por trabajador que te ayuda a calcular la nómina del mes." },
      { titulo: "De dónde salen los datos", texto: "Se apoya en los fichajes (módulo Horas) y otros conceptos, para que no tengas que sumar a mano." },
    ],
  },
  documentos: {
    titulo: "Documentos",
    pasos: [
      { titulo: "Compartir documentación", texto: "Sube documentos y decide quién los ve: toda la empresa o un empleado concreto (nóminas, contratos, certificados)." },
      { titulo: "1. Subir", texto: "Pulsa para añadir un documento, elige la categoría y, si es personal, el trabajador destinatario." },
      { titulo: "Dónde lo ve el trabajador", texto: "Los verá en la sección Documentos de su app. Ideal para entregar la nómina sin papeles." },
    ],
  },
  evaluaciones: {
    titulo: "Evaluaciones",
    pasos: [
      { titulo: "Medir el desempeño", texto: "Evalúa a cada trabajador por criterios: puntualidad, calidad, seguridad y trabajo en equipo." },
      { titulo: "Cómo hacerlo", texto: "Crea una evaluación, puntúa cada criterio del 1 al 5 y añade un comentario. Te da una foto objetiva del equipo." },
    ],
  },
  metas: {
    titulo: "Metas y objetivos",
    pasos: [
      { titulo: "Fijar objetivos", texto: "Define metas de empresa o individuales (por ejemplo, reducir incidencias o terminar una obra en plazo)." },
      { titulo: "Seguir el progreso", texto: "Cada meta tiene un % de avance y una fecha objetivo, para no perder de vista lo importante." },
    ],
  },
  onboarding: {
    titulo: "Onboarding (altas y bajas)",
    pasos: [
      { titulo: "Acoger y despedir bien", texto: "Checklists para no olvidar ningún paso al incorporar (alta) o dar salida (baja) a un empleado." },
      { titulo: "Cómo funciona", texto: "Crea el proceso para la persona y marca cada tarea a medida que la completas (entregar EPIs, dar de alta, recoger llaves…)." },
    ],
  },
  organigrama: {
    titulo: "Organigrama",
    pasos: [
      { titulo: "La estructura del equipo", texto: "Una vista de quién es quién y cómo se organiza tu empresa. Útil para ubicar responsabilidades." },
    ],
  },
  comunicados: {
    titulo: "Comunicados",
    pasos: [
      { titulo: "El tablón de la empresa", texto: "Publica avisos que verá toda la plantilla en su móvil (cambios, recordatorios, novedades)." },
      { titulo: "1. Publicar", texto: "Escribe el título y el cuerpo del comunicado y publícalo. Todos lo reciben." },
      { titulo: "Fijar lo importante", texto: "Puedes fijar un comunicado para que aparezca siempre arriba hasta que lo quites." },
    ],
  },
  denuncias: {
    titulo: "Canal de denuncias",
    pasos: [
      { titulo: "Canal ético", texto: "Un espacio para que el equipo comunique problemas serios (acoso, seguridad, fraude). Pueden enviarse de forma anónima." },
      { titulo: "Gestionar con cuidado", texto: "Revisa cada denuncia y ve cambiando su estado (nueva → en revisión → cerrada). Trátalo con la máxima confidencialidad." },
    ],
  },
  notificaciones: {
    titulo: "Notificaciones",
    pasos: [
      { titulo: "Tus avisos", texto: "Aquí se acumulan los avisos del sistema: fichajes que faltan, incidencias, material pendiente…" },
      { titulo: "Mantenlo limpio", texto: "Márcalos como leídos cuando los revises para que el contador de la campana vuelva a cero." },
    ],
  },
  configuracion: {
    titulo: "Configuración",
    pasos: [
      { titulo: "Ajustes de tu empresa", texto: "Aquí gestionas los datos de tu empresa y las opciones de la cuenta." },
      { titulo: "Contacto de tu web", texto: "Si tienes web pública, defines aquí a dónde llegan los mensajes del formulario “Cuéntanos tu proyecto”." },
    ],
  },
  dosier: {
    titulo: "Dosier corporativo",
    pasos: [
      { titulo: "Un dosier de presentación", texto: "Crea un catálogo profesional de tu empresa para enseñar a clientes, y expórtalo a PDF." },
      { titulo: "Los tres paneles", texto: "Izquierda = las páginas (añadir, ordenar, mostrar/ocultar). Centro = la vista real. Derecha = editar lo que selecciones." },
      { titulo: "1. Editar en vivo", texto: "Haz clic en un elemento del centro y cámbialo en el panel derecho: textos, imágenes, iconos, colores… se ve al instante." },
      { titulo: "2. Descargar el PDF", texto: "Cuando esté listo, pulsa “Previa / PDF” y guárdalo como PDF. Cada página del dosier será una hoja." },
    ],
  },
  perfil: {
    titulo: "Perfil",
    pasos: [
      { titulo: "Tu cuenta", texto: "Tus datos personales y las opciones de tu sesión, como cerrar sesión." },
    ],
  },
};

const TOUR_GENERICO: DefTour = {
  titulo: "Este módulo",
  pasos: [{ titulo: "Cómo funciona", texto: "Este módulo forma parte de tu panel. Explora sus botones de acción; y recuerda que este icono de ayuda está siempre disponible en la cabecera." }],
};

/** Guía del módulo admin según la ruta actual. */
export function tourDeRuta(pathname: string): DefTour {
  return TOURS_MODULO[claveDeRutaAdmin(pathname)] ?? TOUR_GENERICO;
}

// ══════════════════ APP DE TRABAJADOR ══════════════════

export const TOUR_BIENVENIDA_TRABAJADOR: DefTour = {
  titulo: "Bienvenido",
  pasos: [
    {
      titulo: "¡Hola! 👋",
      texto:
        "Esta es tu app para el día a día: fichar tu jornada, ver tus obras, rellenar el parte, subir fotos y gestionar tus vacaciones, gastos y documentos. Te lo explicamos en un momento.",
    },
    {
      titulo: "La barra de abajo",
      texto:
        "Con estos botones te mueves por la app: Inicio (para fichar), Obras, Avisos y Perfil (donde están vacaciones, gastos y documentos).",
      target: '[data-tour="nav-trab"]',
    },
    {
      titulo: "Ayuda cuando la necesites",
      texto:
        "Este botón de ayuda está siempre visible. Púlsalo en cualquier pantalla para ver su guía paso a paso. ¡Empieza fichando desde Inicio!",
      target: '[data-tour="help-trab"]',
    },
  ],
};

export const TOURS_TRABAJADOR: Record<string, DefTour> = {
  inicio: {
    titulo: "Inicio — fichar",
    pasos: [
      { titulo: "Tu jornada", texto: "Esta es la pantalla principal. Desde aquí registras tu jornada con un toque." },
      { titulo: "1. Fichar entrada", texto: "Al llegar, pulsa el botón grande de Entrada. La app guarda la hora y tu ubicación (GPS) para dejar constancia de dónde fichas." },
      { titulo: "2. Pausas y extras", texto: "Si paras a comer, usa Pausa (y luego Reanudar). Si haces horas extra, márcalas con su botón. Todo queda registrado por separado." },
      { titulo: "3. Fichar salida", texto: "Al terminar, pulsa Salida. Si se te olvida, el sistema puede cerrar tu jornada a la hora prevista del cuadrante." },
      { titulo: "¿Sin cobertura?", texto: "No te preocupes: ficha igualmente. Lo importante es pulsar el botón a la hora correcta." },
    ],
  },
  obras: {
    titulo: "Mis obras",
    pasos: [
      { titulo: "Dónde trabajas", texto: "Aquí ves las obras que tienes asignadas. Cada tarjeta es una obra con su dirección y estado." },
      { titulo: "Entrar a una obra", texto: "Toca una obra para ver su detalle: información, material de referencia y acceso al parte diario." },
    ],
  },
  "obra-detalle": {
    titulo: "Detalle de la obra",
    pasos: [
      { titulo: "Todo sobre la obra", texto: "Aquí tienes la información de la obra, el equipo y el material de referencia (planos, fotos) que ha subido tu encargado." },
      { titulo: "El parte diario", texto: "Desde aquí entras a rellenar el parte del día (lo que se ha hecho, materiales, fotos)." },
    ],
  },
  parte: {
    titulo: "Parte diario",
    pasos: [
      { titulo: "Qué es el parte", texto: "Es el resumen del trabajo del día en la obra. Rellenarlo bien deja constancia de lo hecho." },
      { titulo: "1. Trabajo realizado", texto: "Escribe qué se ha hecho hoy. Sé concreto: ayuda a tu encargado y a la empresa a seguir el avance." },
      { titulo: "2. Materiales que faltan", texto: "Añade el material que se necesita. Aparecerá automáticamente en el panel de la empresa para que lo compren." },
      { titulo: "3. Fotos e incidencias", texto: "Sube fotos del avance y anota cualquier incidencia o imprevisto que haya ocurrido." },
      { titulo: "4. Cerrar y firmar", texto: "Indica el % de avance y firma para cerrar el parte. Una vez cerrado, queda registrado." },
    ],
  },
  fotos: {
    titulo: "Fotografías",
    pasos: [
      { titulo: "Subir fotos", texto: "Haz fotos del avance de la obra y súbelas. Tu empresa las verá organizadas por obra." },
      { titulo: "Consejo", texto: "Fotos claras y del conjunto ayudan mucho a documentar el trabajo (antes, durante y después)." },
    ],
  },
  notificaciones: {
    titulo: "Avisos",
    pasos: [
      { titulo: "Tus notificaciones", texto: "Aquí llegan los avisos de tu empresa: comunicados, respuestas a tus solicitudes y recordatorios." },
      { titulo: "Revísalos", texto: "El punto rojo en la campana indica avisos sin leer. Ábrelos para ponerte al día." },
    ],
  },
  perfil: {
    titulo: "Perfil",
    pasos: [
      { titulo: "Tu espacio personal", texto: "Aquí están tus datos y los accesos a lo tuyo: Ausencias, Gastos, Documentos y datos de la Empresa." },
      { titulo: "Vacaciones y permisos", texto: "En Ausencias pides vacaciones o permisos y ves si te los han aprobado." },
      { titulo: "Gastos y documentos", texto: "En Gastos presentas tickets para que te los reembolsen; en Documentos tienes tus nóminas y contratos." },
      { titulo: "Cerrar sesión", texto: "Desde aquí también puedes cerrar sesión cuando quieras." },
    ],
  },
  ausencias: {
    titulo: "Mis ausencias",
    pasos: [
      { titulo: "Pedir tiempo libre", texto: "Aquí solicitas vacaciones, un permiso o comunicas una baja." },
      { titulo: "1. Nueva solicitud", texto: "Elige el tipo, las fechas de inicio y fin, y escribe el motivo. Envíala a tu empresa." },
      { titulo: "2. Ver el estado", texto: "Verás si está pendiente, aprobada o rechazada, junto con el comentario de tu responsable." },
    ],
  },
  gastos: {
    titulo: "Mis gastos",
    pasos: [
      { titulo: "Reclamar un gasto", texto: "Si has pagado algo del trabajo (dieta, gasolina, material…), preséntalo aquí para que te lo devuelvan." },
      { titulo: "1. Nuevo gasto", texto: "Indica el concepto, la categoría y el importe, y adjunta la foto del ticket como justificante." },
      { titulo: "2. Seguimiento", texto: "Verás el estado de tu gasto: pendiente, aprobado, rechazado o pagado." },
    ],
  },
  documentos: {
    titulo: "Mis documentos",
    pasos: [
      { titulo: "Tu documentación", texto: "Aquí tienes los documentos que te comparte la empresa: nóminas, contratos, certificados…" },
      { titulo: "Descargar", texto: "Toca un documento para abrirlo o guardarlo en tu móvil." },
    ],
  },
  empresa: {
    titulo: "Mi empresa",
    pasos: [
      { titulo: "Información de la empresa", texto: "Datos y novedades de tu empresa, para tenerlo todo a mano." },
    ],
  },
};

const TOUR_GENERICO_TRAB: DefTour = {
  titulo: "Esta pantalla",
  pasos: [{ titulo: "Cómo funciona", texto: "Explora los botones de esta pantalla; y recuerda que el botón de ayuda está siempre disponible." }],
};

/** Deriva la clave de la pantalla de trabajador desde la ruta. */
function claveTrabajador(pathname: string): string {
  if (pathname.startsWith("/obras/") && (pathname.endsWith("/parte") || pathname.endsWith("/cierre"))) return "parte";
  if (pathname.startsWith("/obras/") && pathname !== "/obras") return "obra-detalle";
  if (pathname === "/obras") return "obras";
  const seg = pathname.split("/")[1] || "inicio";
  return seg;
}

/** Guía de la pantalla de trabajador según la ruta actual. */
export function tourDeRutaTrabajador(pathname: string): DefTour {
  return TOURS_TRABAJADOR[claveTrabajador(pathname)] ?? TOUR_GENERICO_TRAB;
}
