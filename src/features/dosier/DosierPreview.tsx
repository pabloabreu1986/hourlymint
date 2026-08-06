// Vista previa a pantalla completa del dosier corporativo. Muestra el
// documento tal cual saldrá en PDF (páginas A4 apiladas) y ofrece
// "Descargar PDF" (impresión del navegador → Guardar como PDF) y volver
// al editor. La barra superior lleva `.no-print` para no salir en el PDF.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tenantApi } from "@/services";
import { fijarTenant } from "@/lib/branding";
import type { Tenant } from "@/lib/types";
import { Cargando } from "@/components/ui";
import { IconChevronLeft, IconDownload } from "@/components/icons";
import { DosierDocumento } from "./DosierPagina";

export default function DosierPreview() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    tenantApi
      .getTenant()
      .then((t) => {
        fijarTenant(t); // refresca marca/tema por si la caché estaba desfasada
        setTenant(t);
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando />;
  if (!tenant || !tenant.dosier) {
    return (
      <div className="grid min-h-full place-items-center bg-slate-100 p-8 text-center">
        <div>
          <p className="text-lg font-bold text-forge-dark">Aún no hay dosier</p>
          <p className="mt-1 text-sm text-slate-500">Créalo desde el editor para verlo aquí.</p>
          <button onClick={() => navigate("/admin/dosier")} className="btn-primary mt-5 px-5 py-2.5">
            Ir al editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-200">
      {/* Barra de acciones (no sale en el PDF) */}
      <div className="no-print sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-white/90 px-5 py-3 backdrop-blur">
        <button
          onClick={() => navigate("/admin/dosier")}
          className="btn-ghost gap-2 px-3 py-2 text-sm"
        >
          <IconChevronLeft className="h-5 w-5" /> Volver al editor
        </button>
        <p className="hidden text-sm font-semibold text-forge-dark sm:block">
          Vista previa del dosier · {tenant.nombreCorto}
        </p>
        <button onClick={() => window.print()} className="btn-primary gap-2 px-5 py-2.5 text-sm">
          <IconDownload className="h-5 w-5" /> Descargar PDF
        </button>
      </div>

      {/* Documento: páginas A4 apaisadas centradas */}
      <div className="dosier-lienzo mx-auto flex max-w-[297mm] flex-col items-center gap-6 py-8">
        <DosierDocumento tenant={tenant} dosier={tenant.dosier} />
      </div>
    </div>
  );
}
