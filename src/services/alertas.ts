import { hoyISO } from "@/lib/seed";
import { esDiaLaborable } from "@/lib/horas";
import * as obrasApi from "./obras";
import * as usuariosApi from "./usuarios";
import * as fichajesApi from "./fichajes";
import * as notificacionesApi from "./notificaciones";
import type { Obra } from "@/lib/types";

const TITULO_AVISO = "Fichaje pendiente";
/** Margen tras la hora de entrada del cuadrante antes de avisar. */
const MINUTOS_MARGEN = 30;

let enCurso: Promise<void> | null = null;

/**
 * Revisa quién está asignado hoy a una obra en curso (y hoy es día
 * laborable para esa obra) y no ha fichado entrada pasada la hora de
 * entrada de su cuadrante + margen, y le crea (una sola vez por día) una
 * notificación personal. Se puede llamar tantas veces como se quiera:
 * es idempotente dentro del mismo día.
 *
 * Las llamadas que se solapan en el tiempo comparten la misma ejecución
 * en curso: sin este candado, dos llamadas concurrentes (p. ej. el doble
 * montaje de React StrictMode) pueden leer el estado antes de que
 * cualquiera escriba, y duplicar el aviso.
 */
export function revisarFichajesFaltantes(): Promise<void> {
  if (enCurso) return enCurso;
  enCurso = ejecutarRevision().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

function minutosDeAviso(obra: Obra): number {
  const [h, m] = obra.horaEntrada.split(":").map(Number);
  return h * 60 + m + MINUTOS_MARGEN;
}

async function ejecutarRevision(): Promise<void> {
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const [obras, trabajadores, fichajesHoy, notificaciones] = await Promise.all([
    obrasApi.listObras(),
    usuariosApi.listTrabajadores(),
    fichajesApi.fichajesDeHoy(),
    notificacionesApi.listNotificaciones(),
  ]);

  const hoy = hoyISO();
  const yaAvisados = new Set(
    notificaciones
      .filter(
        (n) =>
          n.tipo === "fichaje" &&
          n.titulo === TITULO_AVISO &&
          n.fecha.slice(0, 10) === hoy
      )
      .map((n) => n.trabajadorId)
  );

  const obrasEnCurso = obras.filter((o) => o.estado === "en_curso" && esDiaLaborable(o, ahora));
  const asignadosHoy = new Map<string, Obra>(); // trabajadorId -> obra
  obrasEnCurso.forEach((o) => {
    o.trabajadorIds.forEach((id) => asignadosHoy.set(id, o));
    if (o.encargadoId) asignadosHoy.set(o.encargadoId, o);
  });

  const pendientes = trabajadores.filter((t) => {
    const obra = asignadosHoy.get(t.id);
    if (!obra || !t.activo || yaAvisados.has(t.id)) return false;
    if (minutosAhora < minutosDeAviso(obra)) return false;
    return !fichajesHoy.some((f) => f.trabajadorId === t.id && f.tipo === "entrada");
  });

  for (const t of pendientes) {
    const obra = asignadosHoy.get(t.id)!;
    await notificacionesApi.crearNotificacion({
      trabajadorId: t.id,
      tipo: "fichaje",
      titulo: TITULO_AVISO,
      mensaje: `No has fichado la entrada hoy en ${obra.nombre}. Ficha en cuanto puedas.`,
    });
  }
}
