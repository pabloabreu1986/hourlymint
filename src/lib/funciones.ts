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
  // ── Comercial / CRM ──
  { clave: "clientes", label: "Clientes" },
  { clave: "facturas", label: "Facturas" },
  // ── Presupuestos ──
  { clave: "presupuestos", label: "Presupuestos" },
  { clave: "catalogo", label: "Banco de precios" },
  { clave: "compras", label: "Facturas de proveedor" },
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

// ─── Permisos por usuario (dentro de un cliente) ──────────────
// Además del filtro por cliente (`tenant.funciones`), cada usuario `admin`
// puede tener un subconjunto de módulos habilitado por un `directivo`.

import type { Rol } from "@/lib/types";

/** Todas las claves del catálogo (para distinguirlas de rutas sueltas
 * como notificaciones/configuración/perfil, que nunca se restringen). */
const CATALOGO = new Set(FUNCIONES_DISPONIBLES.map((f) => f.clave));

/** ¿El rol es administrativo (ve el panel /admin completo por defecto)?
 * Tanto `admin` como `directivo` usan el panel; `directivo` además
 * gestiona permisos y siempre lo ve todo. */
export function esAdministrativo(rol: Rol): boolean {
  return rol === "admin" || rol === "directivo";
}

/**
 * ¿Este usuario puede ver el módulo `clave`?
 * - superadmin/directivo: todo.
 * - Dashboard y rutas fuera del catálogo (notificaciones, configuración,
 *   perfil): siempre.
 * - admin con `modulos` = null/undefined (legado): todo.
 * - admin con lista: solo las claves de su lista.
 * Se combina con `tenantTieneFuncion` (el cliente tiene que tenerlo activo).
 */
export function usuarioVeModulo(
  rol: Rol,
  modulos: string[] | undefined | null,
  clave: string
): boolean {
  if (rol === "superadmin" || rol === "directivo") return true;
  if (clave === "dashboard") return true;
  if (!CATALOGO.has(clave)) return true;
  if (!modulos) return true;
  return modulos.includes(clave);
}

/** Módulos que un directivo puede asignar a un admin: los del catálogo que
 * el cliente tiene activos, salvo Dashboard (siempre accesible). */
export function modulosAsignables(funciones: string[]): FuncionDef[] {
  return FUNCIONES_DISPONIBLES.filter(
    (f) => f.clave !== "dashboard" && tenantTieneFuncion(funciones, f.clave)
  );
}
