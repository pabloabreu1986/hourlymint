import { sb } from "@/lib/supabase";
import { uid } from "@/lib/db";
import type { ContactLead } from "@/lib/types";
import type { ContactoInput } from "../contactLeads";
import { check } from "./_map";

const toContactLead = (r: any): ContactLead => ({
  id: r.id,
  nombre: r.nombre,
  telefono: r.telefono,
  consentimiento: Boolean(r.consentimiento),
  consentimientoAt: r.consentimiento_at,
  campaignId: r.campaign_id || undefined,
  origen: r.origen || undefined,
  atendido: Boolean(r.atendido),
  createdAt: r.created_at,
});

export async function enviarContacto(input: ContactoInput): Promise<void> {
  const ahora = new Date().toISOString();
  check(
    await sb().from("contact_leads").insert({
      id: uid("cl"),
      nombre: input.nombre,
      telefono: input.telefono,
      consentimiento: input.consentimiento,
      consentimiento_at: ahora,
      campaign_id: input.campaignId || null,
      origen: input.origen || null,
      atendido: false,
      created_at: ahora,
    })
  );
}

export async function listContactLeads(): Promise<ContactLead[]> {
  try {
    const { data, error } = await sb()
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(toContactLead);
  } catch {
    return [];
  }
}

export async function marcarAtendido(id: string, atendido: boolean): Promise<void> {
  check(await sb().from("contact_leads").update({ atendido }).eq("id", id));
}
