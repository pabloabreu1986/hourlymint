// Iconos del dosier: línea fina y trazo sencillo (strokeWidth 1.25) para
// un acabado editorial. Son genéricos; en las páginas de rejilla se van
// asignando por posición con `iconoPorIndice`.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const svg = (props: P) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

const Check = (p: P) => (
  <svg {...svg(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);
const Estrella = (p: P) => (
  <svg {...svg(p)}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
  </svg>
);
const Rayo = (p: P) => (
  <svg {...svg(p)}>
    <path d="M13 3L5 13h6l-1 8 8-11h-6z" />
  </svg>
);
const Gota = (p: P) => (
  <svg {...svg(p)}>
    <path d="M12 3s6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 6-10 6-10z" />
  </svg>
);
const Regla = (p: P) => (
  <svg {...svg(p)}>
    <rect x="3" y="8" width="18" height="8" rx="1" />
    <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
  </svg>
);
const Casa = (p: P) => (
  <svg {...svg(p)}>
    <path d="M4 11l8-6 8 6" />
    <path d="M6 10v9h12v-9" />
  </svg>
);
const Escudo = (p: P) => (
  <svg {...svg(p)}>
    <path d="M12 3l7 2.5v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V5.5z" />
  </svg>
);
const Reloj = (p: P) => (
  <svg {...svg(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);
const Llave = (p: P) => (
  <svg {...svg(p)}>
    <path d="M14 7l3-3 3 3-3 3" />
    <path d="M16 9l-6 6" />
    <circle cx="7" cy="18" r="3" />
  </svg>
);
const Cubo = (p: P) => (
  <svg {...svg(p)}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </svg>
);
const Brillo = (p: P) => (
  <svg {...svg(p)}>
    <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.5 6.5l3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3" />
  </svg>
);
const Hoja = (p: P) => (
  <svg {...svg(p)}>
    <path d="M20 4C9 4 4 9 4 18c0 0 4-8 16-8" />
    <path d="M8 16c2-4 6-6 10-6" />
  </svg>
);
const Enchufe = (p: P) => (
  <svg {...svg(p)}>
    <path d="M9 3v5M15 3v5" />
    <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
    <path d="M12 17v4" />
  </svg>
);
const Capas = (p: P) => (
  <svg {...svg(p)}>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
);
const Chat = (p: P) => (
  <svg {...svg(p)}>
    <path d="M4 5h16v11H8l-4 3z" />
  </svg>
);
const Camara = (p: P) => (
  <svg {...svg(p)}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

/** Set en orden estable para asignación por índice. */
export const ICONOS_DOSIER = [
  Check,
  Estrella,
  Escudo,
  Reloj,
  Casa,
  Rayo,
  Gota,
  Regla,
  Llave,
  Cubo,
  Brillo,
  Hoja,
  Enchufe,
  Capas,
  Chat,
  Camara,
];

/** Icono simple asignado por posición (cicla si hay más ítems que iconos). */
export function iconoPorIndice(i: number) {
  return ICONOS_DOSIER[i % ICONOS_DOSIER.length];
}
