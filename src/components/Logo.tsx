// Marca FORGEVIA reconstruida en SVG para poder recolorearla en fondos
// claros u oscuros. `variant` controla el color del texto/edificios.
interface LogoProps {
  variant?: "dark" | "light";
  showText?: boolean;
  className?: string;
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

export function Logo({ variant = "dark", showText = true, className = "" }: LogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-forge-dark";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={textColor}>
        <LogoMark className="h-9 w-9" />
      </span>
      {showText && (
        <div className="leading-none">
          <div className={`text-xl font-extrabold tracking-tight ${textColor}`}>
            FORGE<span className="text-forge-orange">VIA</span>
          </div>
          <div
            className={`mt-1 text-[9px] font-semibold tracking-[0.28em] ${
              variant === "light" ? "text-white/60" : "text-slate-400"
            }`}
          >
            PROYECTOS INTEGRALES
          </div>
        </div>
      )}
    </div>
  );
}
