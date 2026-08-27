import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { contactLeadsApi, campanasApi } from "@/services";
import { useTitulo } from "@/lib/useTitulo";
import logoLight from "@/assets/fichaloop_black.png";

const NARANJA = "#E8721C";

const inputCls =
  "w-full border-0 border-b border-black/15 bg-transparent px-0 py-3 text-lg text-[#101418] outline-none transition focus:border-[#E8721C] focus:ring-0 placeholder:text-black/20";

/**
 * Averigua de qué anuncio/campaña llega el lead, para poder atribuirlo
 * luego en la consola. Prioriza los parámetros UTM; si no hay, usa el
 * referrer (p. ej. instagram.com, facebook.com).
 */
function detectarOrigen(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const q = new URLSearchParams(window.location.search);
  const partes = [
    q.get("utm_source"),
    q.get("utm_medium"),
    q.get("utm_campaign") || q.get("campaign") || q.get("ad"),
  ].filter(Boolean);
  if (partes.length) return partes.join(" · ");
  try {
    if (document.referrer) return new URL(document.referrer).hostname;
  } catch {
    /* referrer no parseable */
  }
  return undefined;
}

/** Id de la campaña del enlace del anuncio (?c=<id>). Sin parámetro, el
 * lead se atribuye a la campaña "General" (tráfico directo). */
function detectarCampana(): string {
  if (typeof window === "undefined") return campanasApi.CAMPANA_GENERAL_ID;
  const c = new URLSearchParams(window.location.search).get("c");
  return c || campanasApi.CAMPANA_GENERAL_ID;
}

export default function Contacto() {
  useTitulo("Contacto · fichaloop");
  const origen = useMemo(detectarOrigen, []);
  const campaignId = useMemo(detectarCampana, []);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError("El nombre y el teléfono son obligatorios.");
      return;
    }
    if (!consentimiento) {
      setError("Necesitamos tu permiso para poder llamarte.");
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await contactLeadsApi.enviarContacto({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        consentimiento,
        campaignId,
        origen,
      });
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-full bg-[#F5F3EE] text-[#101418]">
      <header className="border-b border-black/10 bg-[#F5F3EE]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoLight} alt="" className="h-8 w-auto" />
            <span className="text-xl font-extrabold tracking-[-0.04em]">
              ficha<span style={{ color: NARANJA }}>loop</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-xl flex-col justify-center px-5 py-12">
        {enviado ? (
          <div className="text-center">
            <div
              className="mx-auto grid h-16 w-16 place-items-center rounded-full text-white"
              style={{ background: NARANJA }}
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.04em]">¡Gracias!</h1>
            <p className="mt-3 text-black/55">
              Hemos recibido tus datos{nombre ? `, ${nombre.split(" ")[0]}` : ""}. Te llamamos muy
              pronto para contarte todo.
            </p>
            <Link
              to="/"
              className="mt-8 inline-block rounded-xl bg-[#101418] px-6 py-3.5 font-bold text-white transition hover:bg-[#E8721C]"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={enviar}>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">
              Déjanos tus datos
            </span>
            <h1 className="mt-4 text-[clamp(2.4rem,7vw,3.5rem)] font-black leading-[0.9] tracking-[-0.05em]">
              Te llamamos y te lo contamos.
            </h1>
            <p className="mt-4 max-w-md leading-relaxed text-black/45">
              Déjanos tu nombre y tu teléfono. Te llamamos sin compromiso para explicarte cómo
              funciona y resolver tus dudas.
            </p>

            <div className="mt-9 space-y-6">
              <div>
                <label htmlFor="c-nombre" className="block text-sm font-semibold">
                  Nombre
                </label>
                <input
                  id="c-nombre"
                  name="name"
                  required
                  autoComplete="name"
                  autoFocus
                  className={inputCls}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label htmlFor="c-telefono" className="block text-sm font-semibold">
                  Teléfono
                </label>
                <input
                  id="c-telefono"
                  name="tel"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputCls}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+34 600 000 000"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  checked={consentimiento}
                  onChange={(e) => setConsentimiento(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8721C]"
                />
                <span className="text-sm leading-relaxed text-black/60">
                  Autorizo a fichaloop a <strong>llamarme por teléfono</strong> para informarme sobre
                  el producto. He leído y acepto la{" "}
                  <Link
                    to="/terminos"
                    className="font-semibold underline underline-offset-2 hover:text-[#E8721C]"
                  >
                    política de privacidad
                  </Link>
                  .
                </span>
              </label>

              {error && (
                <p role="alert" className="bg-red-100 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="flex w-full items-center justify-between bg-[#101418] px-5 py-4 font-bold text-white transition hover:bg-[#E8721C] disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Quiero que me llaméis"}
                {!enviando && (
                  <span aria-hidden="true" className="text-lg">
                    ↗
                  </span>
                )}
              </button>
              <p className="text-center text-xs text-black/30">
                Usaremos tus datos únicamente para contactarte sobre fichaloop.
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
