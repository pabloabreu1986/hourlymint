import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { iniciales } from "@/lib/format";
import type { EstadoObra } from "@/lib/types";
import { IconX } from "./icons";

// ── Avatar ──
export function Avatar({
  nombre,
  color,
  size = 40,
}: {
  nombre: string;
  color?: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: color ?? "#3B4756",
        fontSize: size * 0.38,
      }}
    >
      {iniciales(nombre)}
    </span>
  );
}

// ── Badges de estado ──
const ESTADO_OBRA: Record<EstadoObra, { label: string; cls: string }> = {
  en_curso: { label: "EN CURSO", cls: "bg-green-100 text-green-700" },
  pendiente: { label: "PENDIENTE", cls: "bg-amber-100 text-amber-700" },
  finalizada: { label: "FINALIZADA", cls: "bg-slate-200 text-slate-600" },
};

export function EstadoObraBadge({ estado }: { estado: EstadoObra }) {
  const e = ESTADO_OBRA[estado];
  return <span className={`badge ${e.cls}`}>{e.label}</span>;
}

export function Badge({
  children,
  color = "slate",
}: {
  children: ReactNode;
  color?: "slate" | "green" | "amber" | "red" | "orange" | "blue" | "violet";
}) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-forge-orange-600",
    blue: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return <span className={`badge ${map[color]}`}>{children}</span>;
}

// ── Barra de progreso ──
export function ProgressBar({
  value,
  color,
  className = "",
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const c = color ?? (value >= 66 ? "#16A34A" : value >= 33 ? "#D97706" : "#94A3B8");
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: c }}
      />
    </div>
  );
}

// ── Donut chart (fichajes) ──
export function Donut({
  segments,
  size = 120,
  thickness = 16,
  center,
}: {
  segments: Array<{ value: number; color: string }>;
  size?: number;
  thickness?: number;
  center?: ReactNode;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center">{center}</div>}
    </div>
  );
}

// ── Spinner ──
export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Cargando({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
      <Spinner className="h-5 w-5" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  titulo,
  texto,
}: {
  icon?: ReactNode;
  titulo: string;
  texto?: string;
}) {
  return (
    <div className="grid place-items-center gap-2 py-14 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <p className="font-semibold text-slate-600">{titulo}</p>
      {texto && <p className="max-w-xs text-sm text-slate-400">{texto}</p>}
    </div>
  );
}

// ── Modal (Radix Dialog: foco atrapado, Escape para cerrar, aria) ──
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <Dialog.Content
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={`card w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-b-none rounded-t-2xl focus:outline-none sm:rounded-2xl`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <Dialog.Title className="text-lg font-bold text-forge-dark">{title}</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <IconX className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="p-5">{children}</div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Tooltip (Radix): etiqueta accesible para botones de solo icono ──
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            sideOffset={6}
            className="z-[1400] rounded-lg bg-forge-dark px-2.5 py-1.5 text-xs font-medium text-white shadow-card"
          >
            {label}
            <RadixTooltip.Arrow className="fill-forge-dark" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
