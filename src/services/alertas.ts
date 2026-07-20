import { hoyISO } from "@/lib/seed";
import * as obrasApi from "./obras";
import * as usuariosApi from "./usuarios";
import * as fichajesApi from "./fichajes";
import * as notificacionesApi from "./notificaciones";

const TITULO_AVISO = "Fichaje pendiente";
/** Margen tras la hora límite antes de avisar, para no disparar en el minuto exacto. */
const MINUTOS_MARGEN = 30;

let enCurso: Promise<void> | null = null;

/**
 * Revisa quién está asignado hoy a una obra en curso y no ha fichado
 * entrada pasada la hora límite, y le crea (una sola vez por día) una
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

async function ejecutarRevision(): Promise<void> {
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const minutosAviso = fichajesApi.HORA_LIMITE_ENTRADA * 60 + MINUTOS_MARGEN;
  if (minutosAhora < minutosAviso) return;

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

  const obrasEnCurso = obras.filter((o) => o.estado === "en_curso");
  const asignadosHoy = new Map<string, string>(); // trabajadorId -> nombre de obra
  obrasEnCurso.forEach((o) => {
    o.trabajadorIds.forEach((id) => asignadosHoy.set(id, o.nombre));
    if (o.encargadoId) asignadosHoy.set(o.encargadoId, o.nombre);
  });

  const pendientes = trabajadores.filter(
    (t) =>
      t.activo &&
      asignadosHoy.has(t.id) &&
      !yaAvisados.has(t.id) &&
      !fichajesHoy.some((f) => f.trabajadorId === t.id && f.tipo === "entrada")
  );

  for (const t of pendientes) {
    const nombreObra = asignadosHoy.get(t.id);
    await notificacionesApi.crearNotificacion({
      trabajadorId: t.id,
      tipo: "fichaje",
      titulo: TITULO_AVISO,
      mensaje: `No has fichado la entrada hoy${nombreObra ? ` en ${nombreObra}` : ""}. Ficha en cuanto puedas.`,
    });
  }
}
