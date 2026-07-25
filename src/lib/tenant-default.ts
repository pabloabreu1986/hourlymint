// Módulo hoja (solo importa tipos) para que tanto `seed.ts` como
// `branding.ts` puedan usar el tenant por defecto sin crear un ciclo
// de imports (branding → db → seed → …).
import type { Tenant } from "./types";

/** Cliente #1 (FORGEVIA). Sus valores son EXACTAMENTE los que la app
 * tenía hardcodeados, para que el aspecto no cambie. Es también la
 * plantilla base al crear un cliente nuevo. */
export const FORGEVIA_TENANT: Tenant = {
  id: "forgevia",
  slug: "forgevia",
  nombre: "FORGEVIA · Control de Obra",
  nombreCorto: "FORGEVIA",
  eslogan: "PROYECTOS INTEGRALES",
  logotipo: { base: "FORGE", acento: "VIA" },
  logoUrl: null,
  colores: {
    dark: "#232B36",
    slate: "#2E3846",
    steel: "#3B4756",
    orange: "#BE6B39",
    orange600: "#A85B2E",
    orange400: "#D08853",
    canvas: "#F4F5F7",
  },
  funciones: [],
};

/** Colores de partida al crear un cliente nuevo (paleta neutra). */
export const COLORES_POR_DEFECTO = {
  dark: "#1E293B",
  slate: "#334155",
  steel: "#475569",
  orange: "#2563EB",
  orange600: "#1D4ED8",
  orange400: "#60A5FA",
  canvas: "#F4F5F7",
};
