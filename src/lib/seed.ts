// ─────────────────────────────────────────────────────────────
// Datos semilla (modo mock, sin Supabase). Solo datos PRODUCTIVOS:
// el tenant FORGEVIA, el super-admin de la plataforma y el primer
// admin del cliente. Sin obras, fichajes ni datos de ejemplo — las
// pantallas arrancan vacías, igual que en producción.
// ─────────────────────────────────────────────────────────────
import type { DBSchema } from "./types";
import { FORGEVIA_TENANT } from "./tenant-default";
import { FUNCIONES_DISPONIBLES } from "./funciones";

/** Fecha de hoy en formato YYYY-MM-DD (hora local). */
export function hoyISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function seedDB(): DBSchema {
  // ── Tenants (clientes white-label) ──
  // FORGEVIA arranca con todas las funciones activas.
  const forgevia = {
    ...FORGEVIA_TENANT,
    funciones: FUNCIONES_DISPONIBLES.map((f) => f.clave),
  };

  // ── Usuarios productivos ──
  // Super-admin de la plataforma (solo Pablo). No pertenece a ningún
  // cliente; gestiona los tenants desde su panel.
  const superadmin = {
    id: "u_super",
    tenantId: "_platform",
    nombre: "pablo",
    password: "890p",
    rol: "superadmin" as const,
    puesto: "Operador de plataforma",
    telefono: "",
    activo: true,
    color: "#BE6B39",
  };

  // Primer admin del cliente FORGEVIA.
  const admin = {
    id: "u_admin",
    tenantId: "forgevia",
    nombre: "Antonio Manzanares",
    password: "admin1234",
    rol: "admin" as const,
    puesto: "Administrador",
    telefono: "600 000 000",
    activo: true,
    color: "#3B4756",
  };

  return {
    tenants: [forgevia],
    usuarios: [superadmin, admin],
    clientes: [],
    facturas: [],
    obras: [],
    fichajes: [],
    partes: [],
    fotos: [],
    adjuntos: [],
    incidencias: [],
    notificaciones: [],
    vehiculos: [],
    herramientas: [],
    almacen: [],
    ausencias: [],
    turnos: [],
    gastos: [],
    documentos: [],
    evaluaciones: [],
    metas: [],
    onboardings: [],
    comunicados: [],
    denuncias: [],
  };
}
