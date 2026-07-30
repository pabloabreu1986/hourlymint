// Solicitudes de demo desde la web pública de fichaloop. En producción se
// guardan en Supabase (tabla `demo_solicitudes`); en mock se simula el envío.
import { delay } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import * as sb from "./supabase/leads";

export interface DemoInput {
  nombre: string;
  empresa: string;
  email?: string;
  telefono: string;
  mensaje?: string;
}

export async function solicitarDemo(input: DemoInput): Promise<void> {
  if (isSupabaseEnabled) return sb.solicitarDemo(input);
  return delay(undefined, 500); // mock: simulamos el envío
}
