import { useEffect, useState } from "react";
import { contactLeadsApi } from "@/services";
import type { ContactLead } from "@/lib/types";
import { fechaHora, hace } from "@/lib/format";
import { Cargando, EmptyState } from "@/components/ui";
import { IconMegaphone, IconPhone, IconCheck } from "@/components/icons";

export default function SuperLeads() {
  const [leads, setLeads] = useState<ContactLead[] | null>(null);

  async function cargar() {
    setLeads(await contactLeadsApi.listContactLeads());
  }
  useEffect(() => {
    cargar();
  }, []);

  async function alternarAtendido(lead: ContactLead) {
    // Optimista: actualiza la UI y persiste.
    setLeads((prev) =>
      prev ? prev.map((l) => (l.id === lead.id ? { ...l, atendido: !l.atendido } : l)) : prev
    );
    await contactLeadsApi.marcarAtendido(lead.id, !lead.atendido);
  }

  if (!leads) return <Cargando />;

  const pendientes = leads.filter((l) => !l.atendido).length;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Leads de captación</h1>
        <p className="text-sm text-slate-500">
          {leads.length} {leads.length === 1 ? "lead" : "leads"} de fichaloop.com/contact
          {pendientes > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-amber-600">{pendientes} sin atender</span>
            </>
          )}
        </p>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={<IconMegaphone className="h-12 w-12" />}
          titulo="Sin leads todavía"
          texto="Los contactos del formulario de fichaloop.com/contact aparecerán aquí."
        />
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <div
              key={l.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                l.atendido ? "border-slate-200 opacity-60" : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-bold text-slate-900 ${
                        l.atendido ? "line-through decoration-slate-300" : ""
                      }`}
                    >
                      {l.nombre}
                    </p>
                    {l.origen && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {l.origen}
                      </span>
                    )}
                    {!l.consentimiento && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                        Sin consentimiento
                      </span>
                    )}
                  </div>
                  <a
                    href={`tel:${l.telefono.replace(/\s+/g, "")}`}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline"
                  >
                    <IconPhone className="h-4 w-4" /> {l.telefono}
                  </a>
                  <p className="mt-1 text-xs text-slate-400" title={fechaHora(l.createdAt)}>
                    {hace(l.createdAt)}
                  </p>
                </div>

                <button
                  onClick={() => alternarAtendido(l)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                    l.atendido
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  <IconCheck className="h-4 w-4" />
                  {l.atendido ? "Atendido" : "Marcar atendido"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
