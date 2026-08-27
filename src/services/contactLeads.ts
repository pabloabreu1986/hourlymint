// Leads de captación de la plataforma: el formulario público
// fichaloop.com/contact (tráfico de anuncios en redes sociales) inserta
// aquí. Solo el super-admin los consulta desde su consola. En producción
// se guardan en Supabase (tabla `contact_leads`); en mock, en localStorage.
import { loadDB, updateDB, delay, uid } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { ContactLead } from "@/lib/types";
import * as sb from "./supabase/contactLeads";

export interface ContactoInput {
  nombre: string;
  telefono: string;
  /** Debe ser true: es la casilla de consentimiento para llamar. */
  consentimiento: boolean;
  /** Campaña / UTM / referrer desde el que llegó el lead. */
  origen?: string;
}

/** Envía un lead desde el formulario público de captación. */
export async function enviarContacto(input: ContactoInput): Promise<void> {
  if (isSupabaseEnabled) return sb.enviarContacto(input);
  const lead: ContactLead = {
    id: uid("cl"),
    nombre: input.nombre,
    telefono: input.telefono,
    consentimiento: input.consentimiento,
    consentimientoAt: new Date().toISOString(),
    origen: input.origen || undefined,
    atendido: false,
    createdAt: new Date().toISOString(),
  };
  updateDB((db) => {
    db.contactLeads.unshift(lead);
  });
  return delay(undefined, 400); // mock: simulamos la latencia de red
}

/** Lista los leads captados (consola super-admin), del más reciente al más antiguo. */
export async function listContactLeads(): Promise<ContactLead[]> {
  if (isSupabaseEnabled) return sb.listContactLeads();
  const leads = [...loadDB().contactLeads].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  return delay(leads);
}

/** Marca (o desmarca) un lead como ya atendido. */
export async function marcarAtendido(id: string, atendido: boolean): Promise<void> {
  if (isSupabaseEnabled) return sb.marcarAtendido(id, atendido);
  updateDB((db) => {
    const lead = db.contactLeads.find((l) => l.id === id);
    if (lead) lead.atendido = atendido;
  });
  return delay(undefined, 0);
}
