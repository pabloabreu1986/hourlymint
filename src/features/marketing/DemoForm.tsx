import { useState, type FormEvent } from "react";
import { leadsApi } from "@/services";

const NARANJA = "#E8721C";

const inputCls =
  "w-full border-0 border-b border-black/15 bg-transparent px-0 py-3 text-[#101418] outline-none transition focus:border-[#E8721C] focus:ring-0 placeholder:text-black/20";

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
        className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-[#F5F3EE] p-6 text-[#101418] shadow-2xl sm:rounded-none sm:p-10"
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
          <form onSubmit={enviar}>
            <div className="relative border-b border-black/15 pb-7 pr-10">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">
                {plan ? `Plan ${plan}` : "Demo personalizada"}
              </span>
              <h3 className="mt-4 text-3xl font-black leading-none tracking-[-0.045em] sm:text-4xl">
                Cuéntanos lo esencial.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-black/45">
                Prepararemos una demo adaptada para agilizar la puesta en marcha.
              </p>
              <button
                type="button"
                onClick={cerrar}
                className="absolute right-0 top-0 grid h-9 w-9 place-items-center text-black/35 transition hover:bg-black/5 hover:text-black"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 pt-7">
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
                className="flex w-full items-center justify-between bg-[#101418] px-5 py-4 font-bold text-white transition hover:bg-[#E8721C] disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Preparar mi demo"}
                {!enviando && <span aria-hidden="true" className="text-lg">↗</span>}
              </button>
              <p className="text-center text-xs text-black/30">
                Tus datos se usarán únicamente para contactarte.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
