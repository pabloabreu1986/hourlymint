import { useState, type FormEvent } from "react";
import { leadsApi } from "@/services";

const NARANJA = "#E8721C";

const inputCls =
  "w-full border-0 border-b border-black/20 bg-transparent px-0 py-3 text-[#101418] outline-none transition focus:border-[#E8721C] focus:ring-0 placeholder:text-black/30";

export function DemoForm({
  open,
  plan,
  onClose,
}: {
  open: boolean;
  plan?: string;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function cerrar() {
    onClose();
    // Reset para la próxima apertura.
    setTimeout(() => {
      setEnviado(false);
      setError(null);
    }, 200);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError("El nombre y el teléfono son obligatorios.");
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await leadsApi.solicitarDemo({
        nombre: nombre.trim(),
        empresa: empresa.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        mensaje: plan ? `[Plan: ${plan}] ${mensaje}`.trim() : mensaje.trim(),
      });
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={cerrar}
    >
      <div
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-[#F5F3EE] text-[#101418] shadow-2xl sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {enviado ? (
          <div className="px-6 py-12 text-center sm:px-10 sm:py-16">
            <div
              className="mx-auto grid h-14 w-14 place-items-center rounded-full text-white"
              style={{ background: NARANJA }}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mt-5 text-2xl font-black tracking-[-0.03em]">¡Recibido!</h3>
            <p className="mt-2 text-black/60">
              Gracias{nombre ? `, ${nombre.split(" ")[0]}` : ""}. Te contactamos muy pronto para
              enseñarte fichaloop.
            </p>
            <button
              onClick={cerrar}
              className="mt-7 w-full rounded-xl bg-[#101418] py-3.5 font-bold text-white transition hover:bg-[#E8721C]"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="grid md:grid-cols-[0.85fr_1.15fr]">
            <div className="relative overflow-hidden bg-[#101418] p-6 text-white sm:p-8 md:p-10">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                {plan ? `Plan ${plan}` : "Demo personalizada"}
              </span>
              <h3 className="mt-8 text-4xl font-black leading-[0.92] tracking-[-0.055em]">
                Empieza con todo
                <span className="text-[#E8721C]"> bien conectado.</span>
              </h3>
              <p className="mt-6 leading-relaxed text-white/60">
                Déjanos tus datos y prepararemos la demo según tu forma de trabajar.
                Así podremos plantear una implementación más rápida y efectiva desde el primer día.
              </p>
              <div className="mt-8 border-t border-white/15 pt-5 text-sm text-white/65">
                <p className="flex items-center gap-3">
                  <span className="text-[#E8721C]">✓</span> Sin compromiso
                </p>
                <p className="mt-3 flex items-center gap-3">
                  <span className="text-[#E8721C]">✓</span> Enfocada en tu empresa
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center text-white/45 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-6 sm:p-8 md:p-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                  Cuéntanos lo esencial
                </p>
                <p className="mt-2 text-sm text-black/55">
                  Te llamaremos para conocer tu operativa y enseñarte cómo encaja fichaloop.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="demo-nombre" className="block text-sm font-semibold">Nombre</label>
                  <input id="demo-nombre" name="name" required autoComplete="name" className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" autoFocus />
                </div>
                <div>
                  <label htmlFor="demo-empresa" className="block text-sm font-semibold">Empresa <span className="font-normal text-black/40">(opcional)</span></label>
                  <input id="demo-empresa" name="organization" autoComplete="organization" className={inputCls} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nombre de tu empresa" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="demo-telefono" className="block text-sm font-semibold">Teléfono</label>
                  <input id="demo-telefono" name="tel" required type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
                </div>
                <div>
                  <label htmlFor="demo-email" className="block text-sm font-semibold">Email <span className="font-normal text-black/40">(opcional)</span></label>
                  <input id="demo-email" name="email" type="email" inputMode="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" />
                </div>
              </div>

              <div>
                <label htmlFor="demo-mensaje" className="block text-sm font-semibold">¿Qué quieres mejorar? <span className="font-normal text-black/40">(opcional)</span></label>
                <textarea
                  id="demo-mensaje"
                  name="message"
                  className={`${inputCls} min-h-[76px] resize-y`}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Equipo, obras o procesos que quieres poner en orden…"
                />
              </div>

              {error && (
                <p role="alert" className="bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="flex w-full items-center justify-between px-5 py-4 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                style={{ background: NARANJA }}
              >
                {enviando ? "Enviando…" : "Preparar mi demo"}
                {!enviando && <span aria-hidden="true" className="text-lg">↗</span>}
              </button>
              <p className="text-center text-xs leading-relaxed text-black/40">
                Usaremos tus datos solo para contactarte sobre la demo. Sin spam.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
