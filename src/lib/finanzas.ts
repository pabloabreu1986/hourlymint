// Cálculos derivados de clientes/obras/facturas/gastos. Funciones puras:
// no leen la BD, se les pasan las colecciones ya cargadas. Así las usan por
// igual la lista de clientes, el perfil y la vista de facturas.
import type { CanalCaptacion, EstadoFactura, Factura, Gasto, Obra } from "@/lib/types";

/** Canales de captación con etiqueta legible. */
export const CANALES: { valor: CanalCaptacion; label: string }[] = [
  { valor: "redes", label: "Redes sociales" },
  { valor: "referencia", label: "Referencia" },
  { valor: "web", label: "Web / formulario" },
  { valor: "llamada", label: "Llamada / contacto directo" },
  { valor: "repeticion", label: "Cliente recurrente" },
  { valor: "otro", label: "Otro" },
];

export function labelCanal(canal: CanalCaptacion): string {
  return CANALES.find((c) => c.valor === canal)?.label ?? "Otro";
}

/** Estados de factura con etiqueta y color de badge. */
export const ESTADOS_FACTURA: {
  valor: EstadoFactura;
  label: string;
  badge: "slate" | "blue" | "green" | "red";
}[] = [
  { valor: "borrador", label: "Borrador", badge: "slate" },
  { valor: "emitida", label: "Emitida", badge: "blue" },
  { valor: "pagada", label: "Pagada", badge: "green" },
  { valor: "vencida", label: "Vencida", badge: "red" },
];

export function infoEstadoFactura(estado: EstadoFactura) {
  return ESTADOS_FACTURA.find((e) => e.valor === estado) ?? ESTADOS_FACTURA[0];
}

/** Total de una factura a partir de base + IVA. */
export function totalFactura(base: number, iva: number): number {
  return Math.round(base * (1 + iva / 100) * 100) / 100;
}

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** ¿La factura cuenta como facturada? (todo menos borrador). */
const esFacturada = (f: Factura) => f.estado !== "borrador";

export interface ResumenFinanzas {
  numObras: number;
  presupuesto: number;
  /** Emitido (todo menos borradores). */
  facturado: number;
  /** Cobrado (facturas pagadas). */
  cobrado: number;
  /** Facturado aún sin cobrar. */
  pendiente: number;
  gastos: number;
  /** Facturado − gastos. */
  margenPrevisto: number;
  /** Cobrado − gastos. */
  margenReal: number;
}

/**
 * Resumen económico de un cliente. Los gastos imputados son los que apuntan
 * directamente al cliente o los de cualquiera de sus obras (sin duplicar).
 */
export function resumenCliente(
  clienteId: string,
  obras: Obra[],
  gastos: Gasto[],
  facturas: Factura[]
): ResumenFinanzas {
  const obrasCli = obras.filter((o) => o.clienteId === clienteId);
  const obraIds = new Set(obrasCli.map((o) => o.id));
  const facturasCli = facturas.filter((f) => f.clienteId === clienteId);
  const gastosCli = gastos.filter(
    (g) => g.clienteId === clienteId || (g.obraId != null && obraIds.has(g.obraId))
  );
  return resumen(obrasCli, gastosCli, facturasCli);
}

/** Resumen económico de una obra concreta. */
export function resumenObra(obra: Obra, gastos: Gasto[], facturas: Factura[]): ResumenFinanzas {
  const gastosObra = gastos.filter((g) => g.obraId === obra.id);
  const facturasObra = facturas.filter((f) => f.obraId === obra.id);
  return resumen([obra], gastosObra, facturasObra);
}

function resumen(obras: Obra[], gastos: Gasto[], facturas: Factura[]): ResumenFinanzas {
  const facturado = suma(facturas.filter(esFacturada).map((f) => f.total));
  const cobrado = suma(facturas.filter((f) => f.estado === "pagada").map((f) => f.total));
  const totalGastos = suma(gastos.map((g) => g.importe));
  const presupuesto = suma(obras.map((o) => o.presupuesto ?? 0));
  return {
    numObras: obras.length,
    presupuesto,
    facturado,
    cobrado,
    pendiente: facturado - cobrado,
    gastos: totalGastos,
    margenPrevisto: facturado - totalGastos,
    margenReal: cobrado - totalGastos,
  };
}
