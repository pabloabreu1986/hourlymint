// Catálogo de módulos activables por cliente (feature flags). El
// super-admin marca cuáles ve cada tenant y tanto el menú del admin
// (AdminLayout) como las rutas (FuncionRoute en App.tsx) filtran por
// estas claves. La clave coincide con el segmento de ruta de /admin/<clave>.

export interface FuncionDef {
  clave: string;
  label: string;
  /** No se puede desactivar (siempre presente). */
  fija?: boolean;
}

export const FUNCIONES_DISPONIBLES: FuncionDef[] = [
  // ── Núcleo (siempre activo) ──
  { clave: "dashboard", label: "Dashboard", fija: true },
  { clave: "obras", label: "Obras", fija: true },
  { clave: "trabajadores", label: "Trabajadores", fija: true },
  // ── Operativa de obra ──
  { clave: "partes", label: "Partes diarios" },
  { clave: "fotografias", label: "Fotografías" },
  { clave: "materiales", label: "Materiales" },
  { clave: "incidencias", label: "Incidencias" },
  { clave: "vehiculos", label: "Vehículos" },
  { clave: "herramientas", label: "Herramientas" },
  { clave: "almacen", label: "Almacén" },
  { clave: "informes", label: "Informes" },
  { clave: "horas", label: "Horas" },
  // ── Suite RRHH ──
  { clave: "ausencias", label: "Ausencias y vacaciones" },
  { clave: "turnos", label: "Turnos" },
  { clave: "gastos", label: "Gastos" },
  { clave: "nomina", label: "Nómina" },
  { clave: "documentos", label: "Documentos" },
  { clave: "evaluaciones", label: "Evaluaciones" },
  { clave: "metas", label: "Metas y objetivos" },
  { clave: "onboarding", label: "Onboarding" },
  { clave: "organigrama", label: "Organigrama" },
  { clave: "comunicados", label: "Comunicados" },
  { clave: "denuncias", label: "Canal de denuncias" },
  // ── Marketing ──
  { clave: "dosier", label: "Dosier corporativo" },
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

/** ¿El tenant tiene activa al menos una de estas funciones? */
export function tenantTieneAlguna(funciones: string[], claves: string[]): boolean {
  return claves.some((c) => tenantTieneFuncion(funciones, c));
}
