// ─────────────────────────────────────────────────────────────
// Modelo de dominio FORGEVIA
// Todo se persiste hoy en localStorage (mock). La forma de estas
// entidades es la que mañana replicará la base de datos real.
// ─────────────────────────────────────────────────────────────

// Jerarquía dentro de un cliente: `directivo` es el responsable que
// configura qué módulos ve cada `admin` (usuario administrativo). El
// `admin` solo ve los módulos que su directivo le habilita.
export type Rol = "superadmin" | "directivo" | "admin" | "trabajador";

export type EstadoObra = "en_curso" | "pendiente" | "finalizada";

// ─── White-label / multi-tenant ──────────────────────────────
// Cada cliente (tenant) tiene su marca. Hoy la configuración vive en
// código (src/lib/branding.ts) y la administra el operador de la
// plataforma; mañana se resolverá por subdominio (p.ej.
// forgevia.fichaloop.com) y se leerá de la BD. La UI la consume siempre
// a través de `tenantApi`/`tenantActual()`, nunca hardcodeando la marca.

/** Paleta de marca en HEX (fácil de editar a mano o desde un panel). */
export interface TenantColores {
  dark: string;
  slate: string;
  steel: string;
  orange: string;
  orange600: string;
  orange400: string;
  canvas: string;
}

// ── Mini-web pública por cliente (empresa.fichaloop.com) ─────
// La configura el super-admin por secciones; se pinta con la marca
// del tenant. Si un cliente no tiene secciones, su raíz sigue siendo
// el login de siempre.

export type TipoSeccionWeb = "hero" | "texto" | "cards" | "lista" | "chips" | "faq" | "cta";

export interface ItemWeb {
  id: string;
  /** Card: título · FAQ: pregunta. */
  titulo?: string;
  /** Card: descripción · FAQ: respuesta · lista/chips: el texto. */
  texto?: string;
  /** Card: etiqueta destacada (precio, "Servicio estrella"…). */
  etiqueta?: string;
  /** Card: puntos incluidos (bullets). */
  puntos?: string[];
  /** Card resaltada visualmente. */
  destacada?: boolean;
}

export interface SeccionWeb {
  id: string;
  tipo: TipoSeccionWeb;
  titulo: string;
  /** Texto de apoyo bajo el título (en `texto` es el cuerpo). */
  subtitulo: string;
  items: ItemWeb[];
  // Solo para `cta`:
  telefono?: string;
  email?: string;
  whatsapp?: string;
}

// ── Dosier corporativo por cliente (brochure exportable a PDF) ──
// Lo edita el propio admin de la empresa desde su panel. Cada bloque
// activo es una página A4 del PDF y de la vista previa. La portada y la
// contraportada son fijas (viven en el nivel superior de `Dosier`); los
// bloques intermedios se activan, reordenan y rellenan a voluntad.
// Se pinta con la marca del tenant (variables --brand-*), igual que la web.

export type TipoBloqueDosier =
  | "texto-imagen" // Quiénes somos: texto a la izq. + foto a sangre a la der.
  | "lista-imagen" // ¿Por qué elegirnos?: lista de textos grandes izq. + foto der.
  | "pasos" // Nuestro proceso: pasos conectados en vertical + foto der.
  | "iconos" // Qué incluye: rejilla de iconos que se reparte por la página
  | "servicios" // Cómo trabajamos: lista con líneas + imagen diagonal abajo-der.
  | "logos" // Calidad: texto + logos de fabricantes/marcas
  | "lista-detalle" // Tecnología: icono+título+desc en columnas
  | "antes-despues" // Dos imágenes comparadas (antes izq. · después der.)
  | "garantias" // Garantías: imagen a sangre izq. + lista en 1 columna der.
  | "testimonios" // Opiniones: estrellas + cita + autor
  | "pagos" // Forma de pago: porcentaje + concepto + detalle
  | "faq"; // Preguntas frecuentes

/** Posición de la imagen principal de una página. */
export type PosicionImagen = "ninguna" | "fondo" | "izquierda" | "derecha" | "diagonal";

/** Alineación horizontal de los elementos (portada/contraportada). */
export type Alineacion = "izquierda" | "centro" | "derecha";

/** Estilo global del dosier (con posibles overrides por bloque/ítem). */
export interface EstiloDosier {
  /** Color del número de página (hex). Vacío = color de marca. */
  numeroColor?: string;
  /** Color del título junto al número (hex). Vacío = por defecto. */
  tituloColor?: string;
  /** Tamaño del número+título de página, en px. */
  numeroSize?: number;
  /** Fuente del número+título: "sans" | "serif" | "mono". */
  numeroFuente?: string;
  /** Color por defecto de los iconos (hex). Vacío = color de marca. */
  iconoColor?: string;
  /** Tamaño por defecto de los iconos, en px. */
  iconoSize?: number;
}

/** Un ítem dentro de un bloque (tarjeta, paso, testimonio, pregunta…). */
export interface ItemDosier {
  id: string;
  /** Tarjeta/paso: título · FAQ: pregunta · testimonio: autor · pago: concepto. */
  titulo?: string;
  /** Cuerpo: descripción · respuesta FAQ · cita del testimonio · detalle del pago. */
  texto?: string;
  /** Valor destacado: "60%" (pago) · nº de estrellas "1"–"5" (testimonio). */
  valor?: string;
  /** Imagen del ítem (logos, antes/después) como data URL (mock) o path Storage. */
  imagen?: string | null;
  /** Nombre del icono (lucide) para este ítem; vacío = icono por defecto. */
  icono?: string;
  /** Color del icono de este ítem (hex); vacío = color global/marca. */
  iconoColor?: string;
  /** Tamaño del icono de este ítem (px); vacío = tamaño global. */
  iconoSize?: number;
}

/** Un bloque = una página intermedia del dosier. */
export interface BloqueDosier {
  id: string;
  tipo: TipoBloqueDosier;
  /** Si se incluye como página del dosier. */
  activo: boolean;
  /** Eyebrow/numeración de la página ("01", "Antes y después"). */
  eyebrow?: string;
  /** Título grande de la página. */
  titulo: string;
  /** Texto de apoyo / cuerpo bajo el título. */
  subtitulo: string;
  /** Foto principal de la página (data URL o path Storage), si el bloque la usa. */
  imagen?: string | null;
  /** Posición de la imagen principal. Vacío = la que trae el tipo por defecto. */
  imagenPos?: PosicionImagen;
  /** Posición del corte diagonal (0–100) cuando `imagenPos` = "diagonal". */
  diagonalOffset?: number;
  /** Color de fondo de la página (hex). Vacío = blanco. */
  bg?: string;
  /** Color de acento de la página (hex): número e iconos. Vacío = marca/global. */
  acento?: string;
  /** Alineación del texto del bloque. */
  align?: Alineacion;
  /** El texto se coloca por encima de la imagen (la desborda), no a un lado. */
  textoSobreImagen?: boolean;
  /** Efecto de sombra del texto: "ninguna" | "suave" | "fuerte" | "halo" | "contorno". */
  textoSombra?: string;
  items: ItemDosier[];
}

export interface Dosier {
  /** Título de portada (p.ej. "Dosier corporativo"). */
  titulo: string;
  /** Eslogan de portada. */
  eslogan: string;
  /** Imagen de fondo de la portada (data URL o path Storage). */
  portada?: string | null;
  /** Imagen que atraviesa en diagonal la contraportada. */
  contraportada?: string | null;
  /** Datos de contacto que aparecen en la contraportada. */
  contacto: { telefono?: string; email?: string; web?: string; direccion?: string };
  /** Estilo global (números de página, iconos). */
  estilo?: EstiloDosier;
  /** Alineación de los elementos de la portada. */
  portadaAlign?: Alineacion;
  /** Alineación de los elementos de la contraportada. */
  contraAlign?: Alineacion;
  bloques: BloqueDosier[];
}

export interface Tenant {
  id: string;
  /** Subdominio del cliente: `<slug>`.fichaloop.com */
  slug: string;
  /** Título completo (título de pestaña, cabeceras) */
  nombre: string;
  /** Marca corta para el logo */
  nombreCorto: string;
  /** Línea secundaria bajo el logo (puede ser "") */
  eslogan: string;
  /** Logotipo de dos tonos opcional; si no, se usa `nombreCorto` tal cual */
  logotipo?: { base: string; acento: string };
  /** URL a un logo subido; si es null se usa la marca SVG por defecto */
  logoUrl: string | null;
  colores: TenantColores;
  /** Feature flags: módulos activos para este cliente (uso posterior) */
  funciones: string[];
  /** Mini-web pública del cliente (vacía = sin web, raíz muestra login). */
  web?: SeccionWeb[];
  /** Dosier corporativo del cliente (undefined = aún sin crear). */
  dosier?: Dosier;
}

export interface Usuario {
  id: string;
  /** Cliente (tenant) al que pertenece. `_platform` = super-admin. */
  tenantId: string;
  /** Nombre de usuario = nombre del trabajador (lo usa para iniciar sesión) */
  nombre: string;
  /** Contraseña en claro. Mock: el admin la fija/edita a mano. */
  password: string;
  rol: Rol;
  telefono?: string;
  puesto?: string;
  activo: boolean;
  /** Color para el avatar/iniciales */
  color: string;
  /** Días de vacaciones anuales (módulo Ausencias). Por defecto 22. */
  diasVacaciones?: number;
  /**
   * Módulos del panel que este usuario `admin` puede ver (claves de
   * `FUNCIONES_DISPONIBLES`). Lo decide un `directivo`. `undefined`/null =
   * acceso completo (legado y directivos/superadmin, que ven todo). Una
   * lista, aunque esté vacía, limita al admin a esas claves (+ Dashboard,
   * siempre accesible). Ver `usuarioVeModulo`.
   */
  modulos?: string[];
}

// ─── CRM: clientes finales (quien encarga las obras) ─────────
// OJO: en otras partes "cliente" designa al tenant (la empresa white-label).
// Aquí `Cliente` es el cliente final de la empresa: la persona o compañía
// que contrata una obra. Se agrupa por `tenantId` como el resto.

/** Cómo se captó el cliente (origen del lead). */
export type CanalCaptacion =
  | "redes"
  | "referencia"
  | "web"
  | "llamada"
  | "repeticion"
  | "otro";

export interface Cliente {
  id: string;
  tenantId: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  /** Dirección de oficinas del cliente. */
  direccion: string;
  /** Canal por el que llegó el cliente. */
  canal: CanalCaptacion;
  /** Detalle del canal: qué red, quién lo refirió, etc. */
  canalDetalle: string;
  notas: string;
  activo: boolean;
  createdAt: string; // ISO
}

export type EstadoFactura = "borrador" | "emitida" | "pagada" | "vencida";

/** Factura emitida a un cliente (opcionalmente ligada a una obra). */
export interface Factura {
  id: string;
  tenantId: string;
  clienteId: string;
  /** Obra a la que corresponde la factura; null = general del cliente. */
  obraId: string | null;
  /** Número de factura (lo pone el usuario, texto libre). */
  numero: string;
  /** Fecha de emisión YYYY-MM-DD. */
  fecha: string;
  concepto: string;
  /** Base imponible en euros. */
  base: number;
  /** % de IVA aplicado (p. ej. 21). */
  iva: number;
  /** Total = base + IVA (se calcula al guardar). */
  total: number;
  estado: EstadoFactura;
  /** Vencimiento del pago YYYY-MM-DD (null = sin fecha). */
  fechaVencimiento: string | null;
  /** Fecha de cobro YYYY-MM-DD (null = no cobrada). */
  fechaPago: string | null;
  /** PDF de la factura como data URL (opcional). */
  archivo: string | null;
  createdAt: string; // ISO
}

export interface Obra {
  id: string;
  /** Cliente (tenant) al que pertenece la obra. */
  tenantId: string;
  nombre: string;
  direccion: string;
  estado: EstadoObra;
  /** Cliente final (quien encarga la obra); null = sin asignar. Ver `Cliente`. */
  clienteId?: string | null;
  /** Importe contratado / presupuesto de la obra en euros (ingreso previsto). */
  presupuesto?: number;
  /** Avance 0–100 */
  avance: number;
  /** Encargado asignado HOY (puede cambiar día a día) */
  encargadoId: string | null;
  /** Trabajadores asignados HOY */
  trabajadorIds: string[];
  color: string;
  createdAt: string;
  /** Cuadrante: días laborables (ISO: 1=lunes..7=domingo). Compartido por
   * todo el equipo asignado a la obra. */
  diasLaborables: number[];
  /** Hora de entrada del turno, "HH:MM". */
  horaEntrada: string;
  /** Hora de salida del turno, "HH:MM". */
  horaSalida: string;
  /** Minutos tras `horaSalida` antes de fichar la salida automática. */
  margenSalidaAutomaticaMin: number;
}

export type TipoFichaje =
  | "entrada"
  | "salida"
  | "pausa_inicio"
  | "pausa_fin"
  | "extra_inicio"
  | "extra_fin";
export type EstadoFichaje = "correcto" | "tarde" | "pendiente" | "automatica";

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface Fichaje {
  id: string;
  tenantId: string;
  trabajadorId: string;
  obraId: string | null;
  tipo: TipoFichaje;
  /** ISO timestamp: hora efectiva del evento (para una salida automática,
   * la hora del cuadrante, no la hora real de ejecución del cron). */
  timestamp: string;
  gps: Coordenada | null;
  estado: EstadoFichaje;
  /** ISO timestamp: cuándo se insertó la fila. */
  creadoEn: string;
  /** Si esta fila corrige a otra, el id de la original. Las filas nunca se
   * editan ni se borran — una corrección futura será siempre una fila nueva. */
  corrigeA: string | null;
}

export interface MaterialPendiente {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export type EstadoParte = "borrador" | "cerrado";

export interface ParteDiario {
  id: string;
  tenantId: string;
  obraId: string;
  /** Fecha del parte YYYY-MM-DD */
  fecha: string;
  encargadoId: string | null;
  trabajoRealizado: string;
  materialesPendientes: MaterialPendiente[];
  observaciones: string;
  incidencias: string;
  /** % de avance reportado al cerrar */
  avance: number;
  /** Firma del encargado como data URL */
  firma: string | null;
  estado: EstadoParte;
  createdAt: string;
  closedAt: string | null;
}

/**
 * Foto de obra. En modo Supabase, `path` es la ruta dentro del bucket de
 * Storage y `url` es una URL firmada temporal resuelta al mostrarla.
 * En modo mock, `path` y `url` contienen el data URL comprimido.
 */
export interface Foto {
  id: string;
  tenantId: string;
  obraId: string;
  parteId: string | null;
  /** Trabajador que subió la foto */
  subidaPor: string | null;
  path: string;
  /** URL firmada/pública lista para <img src>. Se resuelve al listar. */
  url?: string;
  createdAt: string;
}

export type TipoAdjunto = "imagen" | "video";

/**
 * Material de referencia de una obra (fotos/planos/vídeo) que sube el
 * admin/encargado al crearla o editarla, para que lo vea todo el equipo
 * asignado. Distinto de `Foto`, que son las fotos de avance que sube
 * cada trabajador desde su parte diario.
 */
export interface Adjunto {
  id: string;
  tenantId: string;
  obraId: string;
  tipo: TipoAdjunto;
  /** Ruta en Storage (Supabase) o data URL (mock). */
  path: string;
  /** URL lista para <img>/<video> src. Se resuelve al listar. */
  url?: string;
  subidoPor: string | null;
  createdAt: string;
}

export type EstadoIncidencia = "nueva" | "en_proceso" | "resuelta";

export interface Incidencia {
  id: string;
  tenantId: string;
  obraId: string;
  titulo: string;
  descripcion: string;
  fecha: string; // ISO
  estado: EstadoIncidencia;
  trabajadorId: string | null;
}

export type TipoNotificacion = "aviso" | "fichaje" | "incidencia" | "material";

export interface Notificacion {
  id: string;
  tenantId: string;
  /** null = global (todos) */
  trabajadorId: string | null;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  fecha: string; // ISO
  leida: boolean;
}

// ── Entidades de apoyo (páginas admin secundarias) ──

export interface Vehiculo {
  id: string;
  tenantId: string;
  matricula: string;
  modelo: string;
  asignadoA: string | null; // trabajadorId
  estado: "disponible" | "en_uso" | "taller";
}

export interface Herramienta {
  id: string;
  tenantId: string;
  nombre: string;
  cantidad: number;
  ubicacion: string; // obraId o "almacen"
}

export interface AlmacenItem {
  id: string;
  tenantId: string;
  nombre: string;
  stock: number;
  unidad: string;
  minimo: number;
}

// ─── Módulos RRHH (suite tipo Factorial) ─────────────────────

export type TipoAusencia = "vacaciones" | "baja_medica" | "permiso" | "otro";
export type EstadoAusencia = "pendiente" | "aprobada" | "rechazada";

/** Solicitud de ausencia/vacaciones del trabajador; la aprueba el admin. */
export interface Ausencia {
  id: string;
  tenantId: string;
  trabajadorId: string;
  tipo: TipoAusencia;
  /** YYYY-MM-DD, ambos incluidos. */
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  estado: EstadoAusencia;
  /** Comentario del admin al aprobar/rechazar. */
  respuesta: string | null;
  creadaEn: string; // ISO
}

/** Turno planificado para un trabajador en un día concreto. */
export interface Turno {
  id: string;
  tenantId: string;
  trabajadorId: string;
  /** YYYY-MM-DD */
  fecha: string;
  obraId: string | null;
  horaInicio: string; // "HH:MM"
  horaFin: string; // "HH:MM"
  nota: string;
}

export type CategoriaGasto = "dietas" | "transporte" | "material" | "alojamiento" | "otro";
export type EstadoGasto = "pendiente" | "aprobado" | "rechazado" | "pagado";

/** Gasto presentado por un trabajador (con foto del justificante). */
export interface Gasto {
  id: string;
  tenantId: string;
  trabajadorId: string;
  obraId: string | null;
  /** Cliente al que se imputa el gasto; null = sin asignar (se puede
   * derivar de la obra si esta tiene cliente). Ver `Cliente`. */
  clienteId?: string | null;
  concepto: string;
  categoria: CategoriaGasto;
  /** Importe en euros. */
  importe: number;
  /** YYYY-MM-DD del gasto. */
  fecha: string;
  /** Justificante (foto del ticket) como data URL, o null. */
  justificante: string | null;
  estado: EstadoGasto;
  creadoEn: string; // ISO
}

export type CategoriaDocumento = "nomina" | "contrato" | "certificado" | "otro";

/** Documento laboral: de un empleado concreto o de empresa (usuarioId null). */
export interface Documento {
  id: string;
  tenantId: string;
  /** null = documento de empresa, visible para toda la plantilla. */
  usuarioId: string | null;
  /** Cliente al que pertenece el documento (contratos, etc.); null = no es
   * de un cliente. Ver `Cliente`. */
  clienteId?: string | null;
  nombre: string;
  categoria: CategoriaDocumento;
  /** Contenido como data URL (mock y BD). */
  path: string;
  mime: string;
  subidoPor: string | null;
  createdAt: string; // ISO
}

/** Puntuaciones 1–5 por criterio de una evaluación de desempeño. */
export interface PuntuacionesEvaluacion {
  puntualidad: number;
  calidad: number;
  seguridad: number;
  equipo: number;
}

export interface Evaluacion {
  id: string;
  tenantId: string;
  trabajadorId: string;
  evaluadorId: string | null;
  /** Etiqueta del periodo evaluado, p.ej. "2º trimestre 2026". */
  periodo: string;
  puntuaciones: PuntuacionesEvaluacion;
  comentario: string;
  createdAt: string; // ISO
}

/** Meta/objetivo (OKR simplificado): de empresa o de un trabajador. */
export interface Meta {
  id: string;
  tenantId: string;
  /** null = meta de empresa. */
  trabajadorId: string | null;
  titulo: string;
  descripcion: string;
  /** Avance 0–100. */
  progreso: number;
  /** YYYY-MM-DD objetivo. */
  fechaObjetivo: string;
  createdAt: string; // ISO
}

export type TipoOnboarding = "alta" | "baja";

export interface TareaOnboarding {
  id: string;
  texto: string;
  hecha: boolean;
}

/** Checklist de acogida (alta) o salida (baja) de un empleado. */
export interface ProcesoOnboarding {
  id: string;
  tenantId: string;
  usuarioId: string;
  tipo: TipoOnboarding;
  tareas: TareaOnboarding[];
  createdAt: string; // ISO
}

/** Comunicado del tablón de empresa (lo publica el admin). */
export interface Comunicado {
  id: string;
  tenantId: string;
  titulo: string;
  cuerpo: string;
  autorId: string | null;
  fecha: string; // ISO
  fijado: boolean;
}

export type CategoriaDenuncia = "acoso" | "seguridad" | "fraude" | "otro";
export type EstadoDenuncia = "nueva" | "en_revision" | "cerrada";

/** Denuncia del canal ético; puede ser anónima. */
export interface Denuncia {
  id: string;
  tenantId: string;
  categoria: CategoriaDenuncia;
  descripcion: string;
  /** true = no se guarda quién la envió. */
  anonima: boolean;
  trabajadorId: string | null;
  estado: EstadoDenuncia;
  fecha: string; // ISO
}

export interface DBSchema {
  /** Clientes de la plataforma (white-label). El operador (super-admin)
   * los gestiona desde su panel. Hoy en mock; mañana en la BD. */
  tenants: Tenant[];
  usuarios: Usuario[];
  clientes: Cliente[];
  facturas: Factura[];
  obras: Obra[];
  fichajes: Fichaje[];
  partes: ParteDiario[];
  fotos: Foto[];
  adjuntos: Adjunto[];
  incidencias: Incidencia[];
  notificaciones: Notificacion[];
  vehiculos: Vehiculo[];
  herramientas: Herramienta[];
  almacen: AlmacenItem[];
  // Módulos RRHH
  ausencias: Ausencia[];
  turnos: Turno[];
  gastos: Gasto[];
  documentos: Documento[];
  evaluaciones: Evaluacion[];
  metas: Meta[];
  onboardings: ProcesoOnboarding[];
  comunicados: Comunicado[];
  denuncias: Denuncia[];
}
