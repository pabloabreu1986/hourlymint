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
