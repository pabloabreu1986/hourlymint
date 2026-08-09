// Marca reconstruida en SVG para poder recolorearla en fondos claros u
// oscuros. El texto y (más adelante) la imagen salen del tenant activo.
// `variant` controla el color del texto/edificios.
import { tenantActual } from "@/lib/branding";

interface LogoProps {
  variant?: "dark" | "light";
  showText?: boolean;
  className?: string;
  /** Tamaño del logotipo/imagen (por defecto h-9 w-9). */
  markClassName?: string;
}

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="12" y="14" width="8" height="36" rx="1" fill="currentColor" />
      <rect x="23" y="14" width="8" height="22" rx="1" fill="currentColor" />
      <path d="M34 50 V29 l8 -8 v29 z" fill="#BE6B39" />
      <rect x="34" y="40" width="8" height="10" fill="#BE6B39" />
    </svg>
  );
}

export function Logo({ variant = "dark", showText = true, className = "", markClassName = "h-9 w-9" }: LogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-forge-dark";
  const t = tenantActual();
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {t.logoUrl ? (
        <img src={t.logoUrl} alt={t.nombreCorto} className={`${markClassName} object-contain`} />
      ) : (
        <span className={textColor}>
          <LogoMark className={markClassName} />
        </span>
      )}
      {showText && (
        <div className="leading-none">
          <div className={`text-xl font-extrabold tracking-tight ${textColor}`}>
            {t.logotipo ? (
              <>
                {t.logotipo.base}
                <span className="text-forge-orange">{t.logotipo.acento}</span>
              </>
            ) : (
              t.nombreCorto
            )}
          </div>
          {t.eslogan && (
            <div
              className={`mt-1 text-[9px] font-semibold tracking-[0.28em] ${
                variant === "light" ? "text-white/60" : "text-slate-400"
              }`}
            >
              {t.eslogan}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
