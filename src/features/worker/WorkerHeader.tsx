import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IconChevronLeft } from "@/components/icons";

export function WorkerHeader({
  title,
  subtitle,
  action,
  back = true,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: boolean | (() => void);
}) {
  const navigate = useNavigate();
  const onBack = typeof back === "function" ? back : () => navigate(-1);
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
      {back && (
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-forge-dark hover:bg-slate-100"
          aria-label="Atrás"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold text-forge-dark">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
