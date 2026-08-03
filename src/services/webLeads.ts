// Leads del formulario "Cuéntanos tu proyecto" de la mini-web de cada
// cliente. En producción se guardan en Supabase (tabla `web_leads`,
// insert-only); en mock se simula el envío.
import { delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import * as sb from "./supabase/webLeads";

export interface ProyectoInput {
  nombre: string;
  telefono: string;
  email?: string;
  mensaje: string;
}

export async function enviarProyecto(input: ProyectoInput): Promise<void> {
  if (isSupabaseEnabled) return sb.enviarProyecto(input);
  return delay(undefined, 500); // mock: simulamos el envío
}
