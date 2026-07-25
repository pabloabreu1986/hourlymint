// Catálogo de módulos activables por cliente (feature flags). El
// super-admin marca cuáles ve cada tenant. Hoy solo se guarda el dato;
// el filtrado del menú/rutas por estas claves llega en un paso posterior.
// La clave coincide con el segmento de ruta de /admin/<clave>.

export interface FuncionDef {
  clave: string;
  label: string;
  /** No se puede desactivar (siempre presente). */
  fija?: boolean;
}

export const FUNCIONES_DISPONIBLES: FuncionDef[] = [
  { clave: "dashboard", label: "Dashboard", fija: true },
  { clave: "obras", label: "Obras", fija: true },
  { clave: "trabajadores", label: "Trabajadores", fija: true },
  { clave: "partes", label: "Partes diarios" },
  { clave: "fotografias", label: "Fotografías" },
  { clave: "materiales", label: "Materiales" },
  { clave: "incidencias", label: "Incidencias" },
  { clave: "vehiculos", label: "Vehículos" },
  { clave: "herramientas", label: "Herramientas" },
  { clave: "almacen", label: "Almacén" },
  { clave: "informes", label: "Informes" },
  { clave: "horas", label: "Horas" },
];

/** Claves fijas que todo tenant tiene siempre activas. */
export const FUNCIONES_FIJAS = FUNCIONES_DISPONIBLES.filter((f) => f.fija).map(
  (f) => f.clave
);

/** Claves opcionales (las que el super-admin puede activar/desactivar). */
const OPCIONALES = new Set(
  FUNCIONES_DISPONIBLES.filter((f) => !f.fija).map((f) => f.clave)
);

/** Deriva la clave de función a partir de una ruta admin.
 * `/admin` → "dashboard"; `/admin/almacen` → "almacen". */
export function claveDeRutaAdmin(to: string): string {
  if (to === "/admin") return "dashboard";
  return to.split("/")[2] ?? "";
}

/**
 * ¿El tenant tiene activa esta función? Las claves fijas y las que no
 * están en el catálogo (notificaciones, configuración, perfil…) siempre
 * están disponibles; solo se filtran las opcionales.
 */
export function tenantTieneFuncion(funciones: string[], clave: string): boolean {
  if (!OPCIONALES.has(clave)) return true;
  return funciones.includes(clave);
}
