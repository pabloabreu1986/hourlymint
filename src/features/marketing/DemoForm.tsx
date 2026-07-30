import { useState, type FormEvent } from "react";
import { leadsApi } from "@/services";

const NARANJA = "#E8721C";

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-[#101418] outline-none transition focus:border-[#E8721C] focus:ring-2 focus:ring-[#E8721C]/20 placeholder:text-black/35";

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
    if (!nombre.trim() || !email.trim()) {
      setError("El nombre y el email son obligatorios.");
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
        className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#F5F3EE] p-6 text-[#101418] sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {enviado ? (
          <div className="py-6 text-center">
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
          <form onSubmit={enviar} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-[-0.03em]">Solicita tu demo</h3>
                <p className="mt-1 text-sm text-black/55">
                  {plan ? `Plan ${plan}. ` : ""}Cuéntanos de tu empresa y te contactamos.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-black/40 hover:bg-black/5"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Nombre *</label>
                <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" autoFocus />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Empresa</label>
                <input className={inputCls} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nombre de tu empresa" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Email *</label>
                <input type="email" inputMode="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@empresa.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Teléfono</label>
                <input type="tel" inputMode="tel" className={inputCls} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="600 000 000" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">¿Cómo trabajáis? (opcional)</label>
              <textarea
                className={`${inputCls} min-h-[90px] resize-y`}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Nº de trabajadores, obras, qué necesitáis…"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              style={{ background: NARANJA }}
            >
              {enviando ? "Enviando…" : "Enviar solicitud"}
            </button>
            <p className="text-center text-xs text-black/40">
              Al enviar aceptas nuestra política de privacidad. No compartimos tus datos.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
