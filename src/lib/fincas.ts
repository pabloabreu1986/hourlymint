// CRM — vertical Administración de Fincas. Etiquetas y cálculos derivados
// (KPIs del panel y ranking de administradores). Funciones puras: reciben las
// colecciones ya cargadas, igual que `finanzas.ts`. Ver vertical-fincas.
import type {
  Cliente,
  EstadoComercial,
  EstadoOportunidad,
  Factura,
  Obra,
  Oportunidad,
  TipoContacto,
  TipoInteraccion,
} from "@/lib/types";

// ─── Etiquetas ───────────────────────────────────────────────

export const TIPOS_CONTACTO: { valor: TipoContacto; label: string }[] = [
  { valor: "particular", label: "Cliente particular" },
  { valor: "empresa", label: "Empresa" },
  { valor: "admin_fincas", label: "Administrador de fincas" },
  { valor: "comunidad", label: "Comunidad de propietarios" },
  { valor: "arquitecto", label: "Arquitecto / Interiorista" },
  { valor: "inmobiliaria", label: "Inmobiliaria" },
  { valor: "prescriptor", label: "Colaborador / Prescriptor" },
];

export function labelTipo(tipo: TipoContacto | undefined): string {
  return TIPOS_CONTACTO.find((t) => t.valor === (tipo ?? "particular"))?.label ?? "Cliente particular";
}

type BadgeColor = "slate" | "green" | "amber" | "red" | "orange" | "blue" | "violet";

export const ESTADOS_COMERCIAL: {
  valor: EstadoComercial;
  label: string;
  badge: BadgeColor;
  /** Orden en el embudo (para comparar avance; -1 = descartado). */
  paso: number;
}[] = [
  { valor: "prospecto", label: "Prospecto", badge: "slate", paso: 0 },
  { valor: "contactado", label: "Contactado", badge: "blue", paso: 1 },
  { valor: "dossier_enviado", label: "Dossier enviado", badge: "blue", paso: 2 },
  { valor: "proveedor_aceptado", label: "Proveedor aceptado", badge: "violet", paso: 3 },
  { valor: "primera_oportunidad", label: "Primera oportunidad", badge: "amber", paso: 4 },
  { valor: "cliente_activo", label: "Cliente activo", badge: "green", paso: 5 },
  { valor: "cliente_recurrente", label: "Cliente recurrente", badge: "green", paso: 6 },
  { valor: "descartado", label: "Descartado / No interesado", badge: "red", paso: -1 },
];

export function infoEstadoComercial(estado: EstadoComercial | undefined) {
  return ESTADOS_COMERCIAL.find((e) => e.valor === estado) ?? ESTADOS_COMERCIAL[0];
}

export const ESTADOS_OPORTUNIDAD: {
  valor: EstadoOportunidad;
  label: string;
  badge: BadgeColor;
}[] = [
  { valor: "recibida", label: "Recibida", badge: "slate" },
  { valor: "visita", label: "Visita", badge: "blue" },
  { valor: "presupuesto_solicitado", label: "Presupuesto solicitado", badge: "amber" },
  { valor: "presupuesto_enviado", label: "Presupuesto enviado", badge: "violet" },
  { valor: "aceptada", label: "Aceptada", badge: "green" },
  { valor: "rechazada", label: "Rechazada", badge: "red" },
];

export function infoEstadoOportunidad(estado: EstadoOportunidad) {
  return ESTADOS_OPORTUNIDAD.find((e) => e.valor === estado) ?? ESTADOS_OPORTUNIDAD[0];
}

export const TIPOS_INTERACCION: { valor: TipoInteraccion; label: string }[] = [
  { valor: "llamada", label: "Llamada" },
  { valor: "email", label: "Email" },
  { valor: "whatsapp", label: "WhatsApp" },
  { valor: "reunion", label: "Reunión" },
  { valor: "visita", label: "Visita" },
  { valor: "dossier", label: "Dossier enviado" },
  { valor: "presupuesto", label: "Presupuesto" },
  { valor: "nota", label: "Nota" },
];

export function labelInteraccion(tipo: TipoInteraccion): string {
  return TIPOS_INTERACCION.find((t) => t.valor === tipo)?.label ?? "Nota";
}

// ─── Helpers de relación ─────────────────────────────────────

export const esAdminFincas = (c: Cliente) => c.tipo === "admin_fincas";
export const esComunidad = (c: Cliente) => c.tipo === "comunidad";

/** Comunidades gestionadas por una administración. */
export function comunidadesDe(adminId: string, clientes: Cliente[]): Cliente[] {
  return clientes.filter((c) => esComunidad(c) && c.administradorId === adminId);
}

/** ¿La próxima acción está vencida (fecha anterior a hoy)? */
export function accionVencida(fechaProximaAccion: string | null | undefined, hoy: string): boolean {
  return !!fechaProximaAccion && fechaProximaAccion < hoy;
}

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const facturado = (fs: Factura[]) => suma(fs.filter((f) => f.estado !== "borrador").map((f) => f.total));

// ─── Métricas por administración (ranking) ──────────────────

export interface MetricasAdministrador {
  admin: Cliente;
  numComunidades: number;
  numOportunidades: number;
  numObrasAdjudicadas: number;
  importePresupuestado: number;
  importeContratado: number;
  facturacionGenerada: number;
}

/** Métricas de una administración: agrega las de sus comunidades. */
export function metricasAdministrador(
  admin: Cliente,
  clientes: Cliente[],
  oportunidades: Oportunidad[],
  obras: Obra[],
  facturas: Factura[]
): MetricasAdministrador {
  const comunidades = comunidadesDe(admin.id, clientes);
  const comIds = new Set(comunidades.map((c) => c.id));
  // Oportunidades atribuidas al admin (directas o de sus comunidades).
  const ops = oportunidades.filter(
    (o) => o.administradorId === admin.id || comIds.has(o.clienteId)
  );
  const obrasCom = obras.filter((o) => o.clienteId != null && comIds.has(o.clienteId));
  const obrasAdjudicadas = obrasCom.length;
  const facturasCom = facturas.filter((f) => comIds.has(f.clienteId));
  return {
    admin,
    numComunidades: comunidades.length,
    numOportunidades: ops.length,
    numObrasAdjudicadas: obrasAdjudicadas,
    importePresupuestado: suma(ops.map((o) => o.importeEstimado ?? 0)),
    importeContratado: suma(obrasCom.map((o) => o.presupuesto ?? 0)),
    facturacionGenerada: facturado(facturasCom),
  };
}

/** TOP administradores: ordenados por facturación, luego obras, luego
 * oportunidades y luego nº de comunidades (spec §8). */
export function rankingAdministradores(
  clientes: Cliente[],
  oportunidades: Oportunidad[],
  obras: Obra[],
  facturas: Factura[]
): MetricasAdministrador[] {
  return clientes
    .filter(esAdminFincas)
    .map((a) => metricasAdministrador(a, clientes, oportunidades, obras, facturas))
    .sort(
      (a, b) =>
        b.facturacionGenerada - a.facturacionGenerada ||
        b.numObrasAdjudicadas - a.numObrasAdjudicadas ||
        b.numOportunidades - a.numOportunidades ||
        b.numComunidades - a.numComunidades
    );
}

// ─── KPIs del panel «Administradores de Fincas» (spec §7) ────

export interface KpisFincas {
  administradoresTotales: number;
  nuevosEsteMes: number;
  contactados: number;
  dossiersEnviados: number;
  proveedoresAceptados: number;
  administradoresActivos: number;
  oportunidadesRecibidas: number;
  visitasRealizadas: number;
  presupuestosEnviados: number;
  obrasAdjudicadas: number;
  importePresupuestado: number;
  importeContratado: number;
  facturacionGenerada: number;
  /** Obras adjudicadas / oportunidades recibidas (0–1). */
  tasaConversion: number;
  /** Administradores con próxima acción vencida (aviso). */
  seguimientoVencido: number;
}

export function kpisFincas(
  clientes: Cliente[],
  oportunidades: Oportunidad[],
  obras: Obra[],
  facturas: Factura[],
  hoy: string
): KpisFincas {
  const admins = clientes.filter(esAdminFincas);
  const mesActual = hoy.slice(0, 7); // YYYY-MM
  const estadoEn = (c: Cliente, valores: EstadoComercial[]) =>
    c.estadoComercial != null && valores.includes(c.estadoComercial);

  const comIds = new Set(clientes.filter(esComunidad).map((c) => c.id));
  const obrasFincas = obras.filter((o) => o.clienteId != null && comIds.has(o.clienteId));
  const facturasFincas = facturas.filter((f) => comIds.has(f.clienteId));

  const obrasAdjudicadas = oportunidades.filter(
    (o) => o.estado === "aceptada" || o.obraId != null
  ).length;

  return {
    administradoresTotales: admins.length,
    nuevosEsteMes: admins.filter((a) => (a.createdAt ?? "").slice(0, 7) === mesActual).length,
    contactados: admins.filter((a) =>
      estadoEn(a, [
        "contactado",
        "dossier_enviado",
        "proveedor_aceptado",
        "primera_oportunidad",
        "cliente_activo",
        "cliente_recurrente",
      ])
    ).length,
    dossiersEnviados: admins.filter(
      (a) => a.dossierEnviado === true || estadoEn(a, [
        "dossier_enviado",
        "proveedor_aceptado",
        "primera_oportunidad",
        "cliente_activo",
        "cliente_recurrente",
      ])
    ).length,
    proveedoresAceptados: admins.filter((a) =>
      estadoEn(a, ["proveedor_aceptado", "primera_oportunidad", "cliente_activo", "cliente_recurrente"])
    ).length,
    administradoresActivos: admins.filter((a) =>
      estadoEn(a, ["cliente_activo", "cliente_recurrente"])
    ).length,
    oportunidadesRecibidas: oportunidades.length,
    visitasRealizadas: oportunidades.filter((o) => o.fechaVisita != null).length,
    presupuestosEnviados: oportunidades.filter((o) =>
      ["presupuesto_enviado", "aceptada", "rechazada"].includes(o.estado)
    ).length,
    obrasAdjudicadas,
    importePresupuestado: suma(oportunidades.map((o) => o.importeEstimado ?? 0)),
    importeContratado: suma(obrasFincas.map((o) => o.presupuesto ?? 0)),
    facturacionGenerada: facturado(facturasFincas),
    tasaConversion: oportunidades.length ? obrasAdjudicadas / oportunidades.length : 0,
    seguimientoVencido: admins.filter((a) => accionVencida(a.fechaProximaAccion, hoy)).length,
  };
}
