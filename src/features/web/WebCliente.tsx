import { useEffect, useState, type FormEvent } from "react";
import { tenantApi, webLeadsApi } from "@/services";
import { fijarTenant } from "@/lib/branding";
import type { ItemWeb, SeccionWeb, Tenant } from "@/lib/types";
import Login from "@/features/auth/Login";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { KineticGridBackground } from "@/components/KineticGridBackground";
import { Cargando, Modal, Spinner } from "@/components/ui";
import { IconCheck, IconChevronDown } from "@/components/icons";

/** Mensaje prefijado del CTA "Continuar por WhatsApp". */
const MENSAJE_WHATSAPP =
  "Hola, vengo desde su web en fichaloop.com. Quisiera que me contactaran para una conversación sobre mi proyecto. Saludos.";

/**
 * Mini-web pública del cliente (empresa.fichaloop.com). Renderiza las
 * secciones configuradas por el super-admin con la estética editorial
 * de fichaloop.com (tipografía gigante, minimalista) pero pintada con
 * la marca del tenant (variables --brand-*). Si el cliente no tiene
 * web configurada, muestra el login de siempre.
 */
export default function WebCliente() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [cargando, setCargando] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);

  useEffect(() => {
    tenantApi
      .getTenant()
      .then((t) => {
        // Refresca marca/tema por si la caché local estaba desfasada.
        fijarTenant(t);
        setTenant(t);
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando />;
  const secciones = tenant?.web ?? [];
  if (!tenant || secciones.length === 0) return <Login />;
  // Datos de contacto del cliente (sección "cta"), para el formulario.
  const cta = secciones.find((s) => s.tipo === "cta");

  return (
    <div className="min-h-full bg-forge-canvas text-forge-dark">
      {/* Cabecera minimalista: solo la marca del cliente */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-forge-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1300px] items-center px-5 py-4 sm:px-8">
          <Logo />
        </div>
      </header>

      <main>
        {secciones.map((s, i) => (
          <SeccionRender key={s.id} s={s} n={i} onProyecto={() => setFormAbierto(true)} />
        ))}
      </main>

      <FormularioProyecto
        open={formAbierto}
        onClose={() => setFormAbierto(false)}
        nombreEmpresa={tenant.nombreCorto}
        emailDestino={cta?.email || ""}
        whatsapp={cta?.whatsapp || ""}
      />

      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-[1300px] flex-col items-center gap-2 px-5 py-8 text-center text-xs text-black/40 sm:flex-row sm:justify-between sm:text-left sm:px-8">
          <p>
            © {new Date().getFullYear()} {tenant.nombreCorto}
            {tenant.eslogan ? ` · ${tenant.eslogan}` : ""}
          </p>
          <CreditoENSODev />
        </div>
      </footer>
    </div>
  );
}

/** Crédito común a todos los footers de la plataforma. */
export function CreditoENSODev({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://ensodev.eu"
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:opacity-70 ${className}`}
    >
      Desarrollado con <span aria-hidden="true">❤️</span> por ENSODev
    </a>
  );
}

/** Etiqueta pequeña sobre cada sección: "01 — Nuestras experiencias". */
function Eyebrow({ n, texto, claro }: { n: number; texto: string; claro?: boolean }) {
  return (
    <p
      className={`mb-10 text-xs font-bold uppercase tracking-[0.18em] ${
        claro ? "text-white/40" : "text-black/40"
      }`}
    >
      {String(n).padStart(2, "0")} — {texto}
    </p>
  );
}

function SeccionRender({
  s,
  n,
  onProyecto,
}: {
  s: SeccionWeb;
  n: number;
  onProyecto: () => void;
}) {
  switch (s.tipo) {
    case "hero":
      // Portada con el efecto del login del cliente (rejilla cinética +
      // velo oscuro) y el acceso integrado a la derecha.
      return (
        <section id="acceso" className="relative scroll-mt-20 overflow-hidden bg-forge-dark text-white">
          <KineticGridBackground className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-forge-dark/70" />
          <div className="relative z-10 mx-auto grid max-w-[1300px] items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-12 md:py-28">
            <div className="md:col-span-7">
              <h1 className="text-[clamp(2.8rem,6.5vw,6rem)] font-black leading-[0.92] tracking-[-0.05em]">
                {s.titulo}
              </h1>
              {s.subtitulo && (
                <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/55 md:text-xl">
                  {s.subtitulo}
                </p>
              )}
              <button
                type="button"
                onClick={onProyecto}
                className="mt-10 inline-flex items-center gap-3 border-b-2 border-forge-orange pb-2 font-bold transition-all hover:gap-5"
              >
                Cuéntanos tu proyecto <span aria-hidden="true" className="text-lg leading-none">↗</span>
              </button>
            </div>
            <div className="md:col-span-5">
              <div className="mx-auto w-full max-w-sm">
                {/* Login del personal de la empresa (admins y trabajadores),
                    no de sus clientes finales: etiqueta discreta y una
                    salida clara hacia el formulario para quien llegue
                    aquí buscando presupuesto. */}
                <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                  Área del equipo · Solo personal
                </p>
                <LoginForm />
                <p className="mt-5 text-center text-sm text-white/40">
                  ¿Tienes un proyecto entre manos?{" "}
                  <button
                    type="button"
                    onClick={onProyecto}
                    className="font-semibold text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white"
                  >
                    Cuéntanoslo aquí
                  </button>
                </p>
              </div>
            </div>
          </div>
        </section>
      );

    case "texto":
      return (
        <section className="border-t border-black/10">
          <div className="mx-auto max-w-[1300px] px-5 py-16 sm:px-8 md:py-24">
            <Eyebrow n={n} texto={s.titulo} />
            <p className="max-w-4xl whitespace-pre-line text-[clamp(1.4rem,2.6vw,2.2rem)] font-medium leading-snug tracking-[-0.02em]">
              {s.subtitulo}
            </p>
          </div>
        </section>
      );

    case "cards":
      return (
        <section className="border-t border-black/10">
          <div className="mx-auto max-w-[1300px] px-5 py-16 sm:px-8 md:py-24">
            <Eyebrow n={n} texto={s.subtitulo || "Servicios"} />
            <h2 className="max-w-4xl text-[clamp(2.4rem,5vw,4.5rem)] font-black leading-[0.92] tracking-[-0.05em]">
              {s.titulo}
            </h2>
            <div className="mt-14 grid border-t border-black/15 md:grid-cols-3">
              {s.items.map((c) => (
                <Card key={c.id} c={c} />
              ))}
            </div>
          </div>
        </section>
      );

    case "lista":
      return (
        <section className="border-t border-black/10 bg-white">
          <div className="mx-auto max-w-[1300px] px-5 py-16 sm:px-8 md:py-24">
            <Eyebrow n={n} texto={s.subtitulo || s.titulo} />
            <h2 className="max-w-4xl text-[clamp(2.4rem,5vw,4.5rem)] font-black leading-[0.92] tracking-[-0.05em]">
              {s.titulo}
            </h2>
            <div className="mt-12 border-t border-black/15">
              {s.items.map((i, idx) => (
                <div
                  key={i.id}
                  className="grid gap-2 border-b border-black/15 py-6 md:grid-cols-12 md:items-center"
                >
                  <span className="text-xs font-bold text-forge-orange md:col-span-1">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-xl font-semibold tracking-[-0.02em] md:col-span-10 md:text-2xl">
                    {i.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "chips":
      return (
        <section className="border-t border-black/10">
          <div className="mx-auto max-w-[1300px] px-5 py-16 sm:px-8 md:py-24">
            <Eyebrow n={n} texto={s.subtitulo || s.titulo} />
            <h2 className="max-w-4xl text-[clamp(2.4rem,5vw,4.5rem)] font-black leading-[0.92] tracking-[-0.05em]">
              {s.titulo}
            </h2>
            <div className="mt-10 flex flex-wrap gap-3">
              {s.items.map((i) => (
                <span
                  key={i.id}
                  className="rounded-full border border-black/20 px-6 py-3 text-lg font-semibold tracking-[-0.01em]"
                >
                  {i.texto}
                </span>
              ))}
            </div>
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="border-t border-black/10 bg-white">
          <div className="mx-auto max-w-[1300px] px-5 py-16 sm:px-8 md:py-24">
            <Eyebrow n={n} texto="Dudas frecuentes" />
            <h2 className="max-w-4xl text-[clamp(2.4rem,5vw,4.5rem)] font-black leading-[0.92] tracking-[-0.05em]">
              {s.titulo}
            </h2>
            <div className="mt-12 max-w-4xl border-t border-black/15">
              {s.items.map((i) => (
                <details key={i.id} className="group border-b border-black/15 py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold tracking-[-0.02em] md:text-2xl [&::-webkit-details-marker]:hidden">
                    {i.titulo}
                    <IconChevronDown className="h-6 w-6 shrink-0 text-forge-orange transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 max-w-2xl leading-relaxed text-black/55">{i.texto}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <section id="contacto" className="scroll-mt-20 border-t border-black/10 bg-forge-dark text-white">
          <div className="mx-auto max-w-[1300px] px-5 py-16 sm:px-8 md:py-28">
            <Eyebrow n={n} texto="Hablemos" claro />
            <h2 className="max-w-5xl text-[clamp(2.8rem,6.5vw,6rem)] font-black leading-[0.9] tracking-[-0.05em]">
              {s.titulo}
            </h2>
            {s.subtitulo && <p className="mt-6 max-w-2xl text-lg text-white/55">{s.subtitulo}</p>}
            <div className="mt-12 flex flex-wrap gap-4 border-t border-white/15 pt-8">
              <button type="button" onClick={onProyecto} className={btnCta}>
                Cuéntanos tu proyecto <Flecha />
              </button>
              {s.telefono && (
                <a href={`tel:${s.telefono.replace(/\s/g, "")}`} className={btnCta}>
                  Llamar · {s.telefono} <Flecha />
                </a>
              )}
              {s.whatsapp && (
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnCta}
                >
                  WhatsApp <Flecha />
                </a>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className={btnCta}>
                  {s.email} <Flecha />
                </a>
              )}
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
}

function Flecha() {
  return <span aria-hidden="true" className="text-lg leading-none">↗</span>;
}

const btnCta =
  "inline-flex items-center gap-3 bg-forge-orange px-6 py-3.5 font-bold text-white transition-all hover:gap-5 hover:bg-forge-orange-600";

/**
 * Formulario "Cuéntanos tu proyecto": guarda el lead (tabla web_leads),
 * prepara un correo con los datos al email del cliente (mailto) y ofrece
 * continuar la conversación por WhatsApp con mensaje prefijado.
 */
function FormularioProyecto({
  open,
  onClose,
  nombreEmpresa,
  emailDestino,
  whatsapp,
}: {
  open: boolean;
  onClose: () => void;
  nombreEmpresa: string;
  emailDestino: string;
  whatsapp: string;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const urlWhatsapp = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(MENSAJE_WHATSAPP)}`
    : "";

  const urlCorreo = emailDestino
    ? `mailto:${emailDestino}?subject=${encodeURIComponent(
        `Nuevo proyecto — ${nombre || "consulta desde la web"}`
      )}&body=${encodeURIComponent(
        `Nombre: ${nombre}\nTeléfono: ${telefono}\nEmail: ${email || "—"}\n\nProyecto:\n${mensaje}\n\n(Enviado desde la web en fichaloop.com)`
      )}`
    : "";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !mensaje.trim()) {
      setError("Rellena al menos tu nombre, tu teléfono y el proyecto.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await webLeadsApi.enviarProyecto({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        mensaje: mensaje.trim(),
      });
      // Abre el correo con los datos ya redactados (si hay email configurado).
      if (urlCorreo) window.location.href = urlCorreo;
      setEnviado(true);
    } catch {
      setError("No se pudo enviar. Inténtalo de nuevo en un momento.");
    } finally {
      setEnviando(false);
    }
  }

  function cerrar() {
    if (enviado) {
      setNombre("");
      setTelefono("");
      setEmail("");
      setMensaje("");
      setEnviado(false);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={cerrar} title="Cuéntanos tu proyecto">
      {enviado ? (
        <div className="grid place-items-center gap-4 py-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600">
            <IconCheck className="h-7 w-7" />
          </span>
          <div>
            <p className="text-lg font-bold text-forge-dark">¡Recibido!</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">
              {nombreEmpresa} tiene ya tus datos y te contactará muy pronto.
            </p>
          </div>
          {urlWhatsapp && (
            <a
              href={urlWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full bg-[#25D366] py-3 font-bold text-white hover:opacity-90"
            >
              Continuar por WhatsApp
            </a>
          )}
          {urlCorreo && (
            <a href={urlCorreo} className="text-sm font-semibold text-forge-orange hover:underline">
              Reabrir el correo con mis datos
            </a>
          )}
          <button onClick={cerrar} className="text-sm text-slate-400 hover:text-slate-600">
            Cerrar
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Tu nombre</label>
              <input className="field mt-1.5" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                className="field mt-1.5"
                inputMode="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Email (opcional)</label>
            <input
              className="field mt-1.5"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Cuéntanos tu proyecto</label>
            <textarea
              className="field mt-1.5"
              rows={4}
              placeholder="Qué quieres hacer, dónde y para cuándo"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={enviando} className="btn-primary w-full py-3">
            {enviando ? <Spinner className="h-5 w-5" /> : "Enviar"}
          </button>
          {urlWhatsapp && (
            <a
              href={urlWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full bg-[#25D366] py-3 font-bold text-white hover:opacity-90"
            >
              Continuar por WhatsApp
            </a>
          )}
        </form>
      )}
    </Modal>
  );
}

function Card({ c }: { c: ItemWeb }) {
  return (
    <article
      className={`flex flex-col border-b border-black/15 py-8 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0 ${
        c.destacada ? "md:bg-forge-orange md:px-8 md:text-white" : ""
      }`}
    >
      {c.etiqueta && (
        <p
          className={`mb-6 w-fit px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${
            c.destacada ? "bg-forge-dark text-white" : "bg-black/5 text-black/50"
          }`}
        >
          {c.etiqueta}
        </p>
      )}
      <h3 className="text-3xl font-black tracking-[-0.03em]">{c.titulo}</h3>
      {c.texto && (
        <p className={`mt-3 leading-relaxed ${c.destacada ? "text-white/80" : "text-black/50"}`}>
          {c.texto}
        </p>
      )}
      {c.puntos && c.puntos.length > 0 && (
        <ul
          className={`mt-7 space-y-3 border-t pt-6 ${
            c.destacada ? "border-white/25" : "border-black/15"
          }`}
        >
          {c.puntos.map((p, i) => (
            <li key={i} className="flex items-start gap-3 text-sm font-medium">
              <IconCheck
                className={`mt-0.5 h-4 w-4 shrink-0 ${c.destacada ? "text-white" : "text-forge-orange"}`}
              />
              {p}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
