// Cálculos puros del módulo de presupuestos. No leen la BD: reciben las
// colecciones ya cargadas.
import type {
  Articulo,
  CategoriaArticulo,
  LineaPresupuesto,
  Partida,
  Presupuesto,
} from "@/lib/types";

export const CATEGORIAS_ARTICULO: { valor: CategoriaArticulo; label: string }[] = [
  { valor: "material", label: "Material" },
  { valor: "mano_obra", label: "Mano de obra" },
  { valor: "maquinaria", label: "Maquinaria" },
  { valor: "subcontrata", label: "Subcontrata" },
  { valor: "otro", label: "Otro" },
];

export function labelCategoria(c: CategoriaArticulo): string {
  return CATEGORIAS_ARTICULO.find((x) => x.valor === c)?.label ?? "Otro";
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Coste unitario de una partida = suma de (cantidad × coste) de sus componentes. */
export function costePartida(partida: Partida, articulos: Articulo[]): number {
  const byId = new Map(articulos.map((a) => [a.id, a]));
  return r2(
    partida.componentes.reduce((s, c) => {
      const art = byId.get(c.articuloId);
      return s + (art ? art.coste * c.cantidad : 0);
    }, 0)
  );
}

export interface TotalesLinea {
  costeTotal: number;
  pvpUnitario: number;
  pvpTotal: number;
  margenPct: number;
}

/** Totales de una línea aplicando su margen (o el del presupuesto). */
export function totalesLinea(linea: LineaPresupuesto, margenPresupuesto: number): TotalesLinea {
  const margen = linea.margenPct ?? margenPresupuesto;
  const pvpUnitario = r2(linea.costeUnitario * (1 + margen / 100));
  return {
    costeTotal: r2(linea.costeUnitario * linea.cantidad),
    pvpUnitario,
    pvpTotal: r2(pvpUnitario * linea.cantidad),
    margenPct: margen,
  };
}

export interface TotalesPresupuesto {
  coste: number;
  pvp: number;
  beneficio: number;
  /** Margen efectivo sobre el coste (%). */
  margenEfectivo: number;
}

export function totalesPresupuesto(p: Presupuesto): TotalesPresupuesto {
  let coste = 0;
  let pvp = 0;
  for (const l of p.lineas) {
    const t = totalesLinea(l, p.margenPct);
    coste += t.costeTotal;
    pvp += t.pvpTotal;
  }
  coste = r2(coste);
  pvp = r2(pvp);
  const beneficio = r2(pvp - coste);
  return {
    coste,
    pvp,
    beneficio,
    margenEfectivo: coste > 0 ? Math.round((beneficio / coste) * 100) : 0,
  };
}

export const ESTADOS_PRESUPUESTO: {
  valor: Presupuesto["estado"];
  label: string;
  badge: "slate" | "blue" | "green" | "red";
}[] = [
  { valor: "borrador", label: "Borrador", badge: "slate" },
  { valor: "enviado", label: "Enviado", badge: "blue" },
  { valor: "aceptado", label: "Aceptado", badge: "green" },
  { valor: "rechazado", label: "Rechazado", badge: "red" },
];

export function infoEstadoPresupuesto(estado: Presupuesto["estado"]) {
  return ESTADOS_PRESUPUESTO.find((e) => e.valor === estado) ?? ESTADOS_PRESUPUESTO[0];
}
