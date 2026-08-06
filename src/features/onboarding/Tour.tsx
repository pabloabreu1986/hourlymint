// Overlay del Onboarding Tour: resalta (spotlight) un elemento de la
// interfaz y muestra una tarjeta con la explicación + navegación. Si un
// paso no tiene target (o el elemento no está visible), la tarjeta se
// centra. Bloquea la interacción con la app mientras está abierto.
import { useEffect, useLayoutEffect, useState } from "react";
import type { DefTour } from "./tour-content";
import { IconX } from "@/components/icons";

interface Rect { top: number; left: number; width: number; height: number }

function medir(target?: string): Rect | null {
  if (!target) return null;
  const el = document.querySelector(target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null; // oculto (p.ej. sidebar en móvil)
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function Tour({ tour, onClose }: { tour: DefTour; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const paso = tour.pasos[i];
  const ultimo = i === tour.pasos.length - 1;

  // Lleva el elemento a la vista y mide su posición (recalcula al cambiar
  // de paso, al hacer scroll o al redimensionar).
  useLayoutEffect(() => {
    const el = paso.target ? (document.querySelector(paso.target) as HTMLElement | null) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const actualizar = () => setRect(medir(paso.target));
    actualizar();
    const t = setTimeout(actualizar, 260); // tras el scroll suave
    window.addEventListener("resize", actualizar);
    window.addEventListener("scroll", actualizar, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", actualizar);
      window.removeEventListener("scroll", actualizar, true);
    };
  }, [paso.target, i]);

  // Teclado: Esc cierra, flechas navegan.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, tour.pasos.length - 1));
      else if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, tour.pasos.length]);

  // Posición de la tarjeta.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardW = Math.min(360, vw - 32);
  const cardH = 220;
  let cardStyle: React.CSSProperties;
  if (rect) {
    const abajo = rect.top + rect.height + 16 + cardH < vh;
    const top = abajo ? rect.top + rect.height + 14 : Math.max(14, rect.top - cardH - 14);
    const left = Math.min(Math.max(14, rect.left), vw - cardW - 14);
    cardStyle = { position: "fixed", top, left, width: cardW, zIndex: 100003 };
  } else {
    cardStyle = { position: "fixed", top: "50%", left: "50%", width: cardW, transform: "translate(-50%,-50%)", zIndex: 100003 };
  }

  return (
    <div className="fixed inset-0" style={{ zIndex: 100000 }}>
      {/* Captura de clics (bloquea la app). */}
      <div className="absolute inset-0" style={{ background: rect ? "transparent" : "rgba(0,0,0,0.55)" }} />

      {/* Spotlight (recorte con sombra que oscurece el resto). */}
      {rect && (
        <div
          style={{
            position: "fixed",
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            outline: "2px solid rgb(var(--brand-orange))",
            outlineOffset: 2,
            pointerEvents: "none",
            transition: "all .2s ease",
            zIndex: 100001,
          }}
        />
      )}

      {/* Tarjeta */}
      <div className="rounded-2xl bg-white p-5 shadow-2xl" style={cardStyle}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-forge-orange">{tour.titulo}</p>
            <h3 className="mt-1 text-lg font-black text-forge-dark">{paso.titulo}</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-forge-dark" aria-label="Cerrar">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{paso.texto}</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {tour.pasos.map((_, idx) => (
              <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-forge-orange" : "w-1.5 bg-slate-200"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="btn-ghost px-3 py-1.5 text-sm">Atrás</button>
            )}
            {ultimo ? (
              <button onClick={onClose} className="btn-primary px-4 py-1.5 text-sm">Hecho</button>
            ) : (
              <button onClick={() => setI(i + 1)} className="btn-primary px-4 py-1.5 text-sm">Siguiente</button>
            )}
          </div>
        </div>

        {tour.pasos.length > 1 && !ultimo && (
          <button onClick={onClose} className="mt-3 block w-full text-center text-xs text-slate-400 hover:text-slate-600">
            Saltar guía
          </button>
        )}
      </div>
    </div>
  );
}
