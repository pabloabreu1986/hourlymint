// Utilidades de formato (fechas, horas, iniciales) en es-ES.

export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "Viernes, 24 de mayo" */
export function fechaLarga(iso: string): string {
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  const dia = DIAS[d.getDay()];
  return `${cap(dia)}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "24 de mayo de 2024" */
export function fechaCompleta(iso: string): string {
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "08:03" */
export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "24/05/2024 09:15" */
export function fechaHora(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("es-ES")} ${hora(iso)}`;
}

/** "hace 5 min", "hace 2 h" */
export function hace(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
