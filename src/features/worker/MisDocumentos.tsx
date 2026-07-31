import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { documentosApi } from "@/services";
import type { CategoriaDocumento, Documento } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Badge, Cargando, EmptyState } from "@/components/ui";
import { fechaCompleta } from "@/lib/format";
import { IconDownload, IconFolder } from "@/components/icons";

const ETIQUETA: Record<CategoriaDocumento, string> = {
  nomina: "Nómina",
  contrato: "Contrato",
  certificado: "Certificado",
  otro: "Otro",
};

const COLOR: Record<CategoriaDocumento, "blue" | "violet" | "green" | "slate"> = {
  nomina: "blue",
  contrato: "violet",
  certificado: "green",
  otro: "slate",
};

function descargar(d: Documento) {
  const a = document.createElement("a");
  a.href = d.path;
  a.download = d.nombre;
  a.click();
}

export default function MisDocumentos() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Documento[] | null>(null);

  useEffect(() => {
    if (!usuario) return;
    documentosApi.documentosDe(usuario.id).then(setItems);
  }, [usuario]);

  if (!usuario) return null;

  return (
    <div>
      <WorkerHeader title="Mis documentos" />
      <div className="p-4">
        {!items ? (
          <Cargando />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IconFolder className="h-12 w-12" />}
            titulo="Sin documentos"
            texto="Aquí verás tus nóminas, contratos y los documentos de empresa."
          />
        ) : (
          <div className="space-y-3">
            {items.map((d) => (
              <button
                key={d.id}
                onClick={() => descargar(d)}
                className="card flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forge-orange/10 text-forge-orange">
                  <IconFolder className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-bold text-forge-dark">{d.nombre}</p>
                    <Badge color={COLOR[d.categoria]}>{ETIQUETA[d.categoria].toUpperCase()}</Badge>
                    {d.usuarioId === null && <Badge color="slate">EMPRESA</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">{fechaCompleta(d.createdAt)}</p>
                </div>
                <IconDownload className="h-5 w-5 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
