import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { campanasApi, contactLeadsApi } from "@/services";
import type { Campana, ContactLead, PlataformaCampana } from "@/lib/types";
import { fechaHora, hace, formatEuro, fechaCompleta } from "@/lib/format";
import { confirmar } from "@/components/confirm";
import { Cargando, EmptyState, Modal, Spinner } from "@/components/ui";
import {
  IconMegaphone,
  IconPhone,
  IconCheck,
  IconPlus,
  IconClipboard,
  IconTrash,
} from "@/components/icons";

const PLATAFORMAS: { valor: PlataformaCampana; label: string }[] = [
  { valor: "instagram", label: "Instagram" },
  { valor: "facebook", label: "Facebook" },
  { valor: "tiktok", label: "TikTok" },
  { valor: "google", label: "Google" },
  { valor: "youtube", label: "YouTube" },
  { valor: "linkedin", label: "LinkedIn" },
  { valor: "otra", label: "Otra" },
];

function labelPlataforma(p: PlataformaCampana): string {
  return PLATAFORMAS.find((x) => x.valor === p)?.label ?? p;
}

/** Enlace del anuncio para una campaña (destino que se pega en la red).
 * La General es el /contact a secas (tráfico directo sin ?c=). */
function linkCampana(id: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://fichaloop.com";
  return id === campanasApi.CAMPANA_GENERAL_ID ? `${base}/contact` : `${base}/contact?c=${id}`;
}

/** Días transcurridos desde que se creó la campaña (mínimo 1). */
function diasActiva(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

/** Fecha de hoy en formato YYYY-MM-DD (para comparar con fechaFin). */
function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SuperLeads() {
  const [campanas, setCampanas] = useState<Campana[] | null>(null);
  const [leads, setLeads] = useState<ContactLead[] | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);

  async function cargar() {
    await campanasApi.asegurarGeneral();
    const [cs, ls] = await Promise.all([
      campanasApi.listCampanas(),
      contactLeadsApi.listContactLeads(),
    ]);
    setCampanas(cs);
    setLeads(ls);
  }
  useEffect(() => {
    cargar();
  }, []);

  const leadsPorCampana = useMemo(() => {
    const m = new Map<string, number>();
    (leads ?? []).forEach((l) => {
      // Los leads sin campaña (tráfico directo o previos) cuentan en la General.
      const cid = l.campaignId || campanasApi.CAMPANA_GENERAL_ID;
      m.set(cid, (m.get(cid) ?? 0) + 1);
    });
    return m;
  }, [leads]);

  const campanaPorId = useMemo(() => {
    const m = new Map<string, Campana>();
    (campanas ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [campanas]);

  async function copiarLink(c: Campana) {
    const url = linkCampana(c.id);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado", { description: url });
    } catch {
      toast.error("No se pudo copiar. Cópialo a mano.", { description: url });
    }
  }

  async function alternarActiva(c: Campana) {
    setCampanas((prev) =>
      prev ? prev.map((x) => (x.id === c.id ? { ...x, activa: !x.activa } : x)) : prev
    );
    await campanasApi.actualizarCampana(c.id, { activa: !c.activa });
  }

  async function borrarCampana(c: Campana) {
    const n = leadsPorCampana.get(c.id) ?? 0;
    const ok = await confirmar({
      titulo: `¿Eliminar "${c.nombre}"?`,
      mensaje:
        n > 0
          ? `Se conservarán los ${n} leads ya captados, pero dejarán de estar atribuidos a esta campaña.`
          : "Esta acción no se puede deshacer.",
      peligro: true,
    });
    if (!ok) return;
    setCampanas((prev) => (prev ? prev.filter((x) => x.id !== c.id) : prev));
    await campanasApi.eliminarCampana(c.id);
  }

  async function alternarAtendido(lead: ContactLead) {
    setLeads((prev) =>
      prev ? prev.map((l) => (l.id === lead.id ? { ...l, atendido: !l.atendido } : l)) : prev
    );
    await contactLeadsApi.marcarAtendido(lead.id, !lead.atendido);
  }

  if (!campanas || !leads) return <Cargando />;

  const pendientes = leads.filter((l) => !l.atendido).length;

  return (
    <div className="space-y-8">
      {/* ── Campañas ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Campañas</h1>
            <p className="text-sm text-slate-500">
              {campanas.length} {campanas.length === 1 ? "campaña" : "campañas"} · cada una con su
              enlace para el anuncio
            </p>
          </div>
          <button
            onClick={() => setNuevoOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            <IconPlus className="h-4 w-4" /> Nueva campaña
          </button>
        </div>

        {campanas.length === 0 ? (
          <EmptyState
            icon={<IconMegaphone className="h-12 w-12" />}
            titulo="Sin campañas todavía"
            texto="Crea una campaña para obtener el enlace que pondrás en tu anuncio."
          />
        ) : (
          <div className="space-y-3">
            {campanas.map((c) => {
              const n = leadsPorCampana.get(c.id) ?? 0;
              const gasto = c.presupuestoDia * diasActiva(c.createdAt);
              const costeLead = n > 0 && c.presupuestoDia > 0 ? gasto / n : null;
              const esGeneral = c.id === campanasApi.CAMPANA_GENERAL_ID;
              const caducada = c.fechaFin ? c.fechaFin < hoyISO() : false;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="max-w-full truncate font-bold text-slate-900">{c.nombre}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          {labelPlataforma(c.plataforma)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            c.activa
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.activa ? "Activa" : "Pausada"}
                        </span>
                        {caducada && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            Fin superado
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatEuro(c.presupuestoDia)}/día · {n}
                        {c.objetivoLeads ? `/${c.objetivoLeads}` : ""}{" "}
                        {n === 1 && !c.objetivoLeads ? "lead" : "leads"}
                        {costeLead != null && <> · ~{formatEuro(costeLead)}/lead</>}
                        {c.fechaFin && <> · hasta {fechaCompleta(c.fechaFin)}</>}
                      </p>
                      {c.notaInterna && (
                        <p className="mt-1 text-xs italic text-slate-400">{c.notaInterna}</p>
                      )}
                    </div>
                    {!esGeneral && (
                      <button
                        onClick={() => borrarCampana(c)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                        aria-label="Eliminar campaña"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Enlace del anuncio */}
                  <div className="mt-3 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
                      {linkCampana(c.id)}
                    </code>
                    <button
                      onClick={() => copiarLink(c)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      <IconClipboard className="h-4 w-4" /> Copiar
                    </button>
                    <button
                      onClick={() => alternarActiva(c)}
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${
                        c.activa
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {c.activa ? "Pausar" : "Activar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Leads ── */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-slate-900">Leads</h2>
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
            {leads.map((l) => {
              const cid = l.campaignId || campanasApi.CAMPANA_GENERAL_ID;
              const camp = campanaPorId.get(cid);
              const etiqueta = camp?.nombre ?? l.origen;
              return (
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
                        {etiqueta && (
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            {etiqueta}
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
              );
            })}
          </div>
        )}
      </section>

      <NuevaCampanaModal
        open={nuevoOpen}
        idsUsados={campanas.map((c) => c.id)}
        onClose={() => setNuevoOpen(false)}
        onCreada={(c) => {
          setCampanas((prev) => (prev ? [c, ...prev] : [c]));
          setNuevoOpen(false);
        }}
      />
    </div>
  );
}

function NuevaCampanaModal({
  open,
  idsUsados,
  onClose,
  onCreada,
}: {
  open: boolean;
  idsUsados: string[];
  onClose: () => void;
  onCreada: (c: Campana) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [id, setId] = useState("");
  const [idTocado, setIdTocado] = useState(false);
  const [plataforma, setPlataforma] = useState<PlataformaCampana>("instagram");
  const [presupuesto, setPresupuesto] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [nota, setNota] = useState("");
  const [activa, setActiva] = useState(true);
  const [creando, setCreando] = useState(false);

  // Mientras no toques el id a mano, se sugiere a partir del nombre.
  const idFinal = campanasApi.normalizarIdCampana(idTocado ? id : nombre);
  const idLibre = campanasApi.idCampanaLibre(idFinal, idsUsados);
  const idOcupado = idFinal.length > 0 && !idLibre;

  function cambiarNombre(v: string) {
    setNombre(v);
    if (!idTocado) setId(campanasApi.normalizarIdCampana(v));
  }
  function cambiarId(v: string) {
    setIdTocado(true);
    setId(campanasApi.normalizarIdCampana(v));
  }

  function resetear() {
    setNombre("");
    setId("");
    setIdTocado(false);
    setPresupuesto("");
    setPlataforma("instagram");
    setFechaFin("");
    setObjetivo("");
    setNota("");
    setActiva(true);
  }

  async function crear() {
    if (!nombre.trim() || !idLibre || creando) return;
    setCreando(true);
    try {
      const c = await campanasApi.crearCampana({
        id: idFinal,
        nombre: nombre.trim(),
        plataforma,
        presupuestoDia: Math.max(0, Number(presupuesto) || 0),
        activa,
        fechaFin: fechaFin || undefined,
        objetivoLeads: objetivo ? Math.max(0, Math.round(Number(objetivo))) : undefined,
        notaInterna: nota.trim() || undefined,
      });
      resetear();
      onCreada(c);
    } catch (e) {
      // p. ej. id duplicado en carrera con otra sesión.
      toast.error(e instanceof Error ? e.message : "No se pudo crear la campaña");
    } finally {
      setCreando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva campaña">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Nombre de la campaña
          </label>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => cambiarNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
            placeholder="p. ej. Reels agosto · oferta"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Id del enlace
          </label>
          <div
            className={`flex items-center rounded-xl border bg-white pl-3 pr-2 ${
              idOcupado
                ? "border-red-300 ring-2 ring-red-100"
                : "border-slate-200 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200"
            }`}
          >
            <span className="shrink-0 select-none text-sm text-slate-400">/contact?c=</span>
            <input
              value={idFinal}
              onChange={(e) => cambiarId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
              placeholder="verano-reels"
              spellCheck={false}
              autoCapitalize="none"
              className="w-full bg-transparent px-1 py-3 text-slate-900 outline-none"
            />
            {idFinal.length > 0 && (
              <span
                className={`shrink-0 text-sm font-semibold ${
                  idLibre ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {idLibre ? "✓ libre" : "ocupado"}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            {idOcupado
              ? "Ya hay una campaña con ese id. Elige otro."
              : "Corto y sin espacios. Es lo que pondrás en el enlace del anuncio."}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Plataforma</label>
          <div className="flex flex-wrap gap-2">
            {PLATAFORMAS.map((p) => (
              <button
                key={p.valor}
                type="button"
                onClick={() => setPlataforma(p.valor)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  plataforma === p.valor
                    ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 text-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Dinero por día (€)
          </label>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
            placeholder="p. ej. 15"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Sirve para estimar el coste por lead. Puedes dejarlo en blanco.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Fecha de fin <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Objetivo de leads <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
              placeholder="p. ej. 50"
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Nota interna <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Solo la ves tú. Público objetivo, creatividad, etc."
            className="min-h-[64px] w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={activa}
            onChange={(e) => setActiva(e.target.checked)}
            className="h-5 w-5 accent-slate-900"
          />
          <span className="text-sm font-medium text-slate-700">Empezar activa</span>
        </label>

        <button
          onClick={crear}
          disabled={!nombre.trim() || !idLibre || creando}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {creando ? <Spinner className="h-5 w-5" /> : "Crear campaña y generar enlace"}
        </button>
      </div>
    </Modal>
  );
}
