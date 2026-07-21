// ─────────────────────────────────────────────────────────────
// Modelo de dominio FORGEVIA
// Todo se persiste hoy en localStorage (mock). La forma de estas
// entidades es la que mañana replicará la base de datos real.
// ─────────────────────────────────────────────────────────────

export type Rol = "admin" | "trabajador";

export type EstadoObra = "en_curso" | "pendiente" | "finalizada";

export interface Usuario {
  id: string;
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
}

export interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  estado: EstadoObra;
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
  matricula: string;
  modelo: string;
  asignadoA: string | null; // trabajadorId
  estado: "disponible" | "en_uso" | "taller";
}

export interface Herramienta {
  id: string;
  nombre: string;
  cantidad: number;
  ubicacion: string; // obraId o "almacen"
}

export interface AlmacenItem {
  id: string;
  nombre: string;
  stock: number;
  unidad: string;
  minimo: number;
}

export interface DBSchema {
  usuarios: Usuario[];
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
}
