import { useEffect, useState } from "react";
import { partesApi, obrasApi, usuariosApi, fotosApi } from "@/services";
import type { ParteDiario, Obra, Usuario, Foto } from "@/lib/types";
import { Badge, Cargando, EmptyState, Modal, ProgressBar } from "@/components/ui";
import { fechaCompleta } from "@/lib/format";
import { IconClipboard, IconChevronRight } from "@/components/icons";

export default function AdminPartes() {
  const [partes, setPartes] = useState<ParteDiario[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [detalle, setDetalle] = useState<ParteDiario | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);

  useEffect(() => {
    partesApi.listPartes().then(setPartes);
    obrasApi.listObras().then(setObras);
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  useEffect(() => {
    if (detalle) fotosApi.listFotosDeParte(detalle.id).then(setFotos);
    else setFotos([]);
  }, [detalle]);

  const obraDe = (id: string) => obras.find((o) => o.id === id);
  const usuarioDe = (id: string | null) => usuarios.find((u) => u.id === id);

  if (!partes) return <Cargando />;

  return (
    <div>
      {partes.length === 0 ? (
        <EmptyState icon={<IconClipboard className="h-12 w-12" />} titulo="Sin partes registrados" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Obra</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Encargado</th>
                  <th className="px-4 py-3 font-semibold">Avance</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partes.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setDetalle(p)}
                    className="cursor-pointer hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-semibold text-forge-dark">
                      {obraDe(p.obraId)?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fechaCompleta(p.fecha)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {usuarioDe(p.encargadoId)?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={p.avance} className="w-16" />
                        <span className="text-xs font-semibold text-slate-500">{p.avance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={p.estado === "cerrado" ? "green" : "amber"}>
                        {p.estado === "cerrado" ? "Cerrado" : "Borrador"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <IconChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        title="Parte diario"
        maxWidth="max-w-xl"
      >
        {detalle && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-forge-dark">{obraDe(detalle.obraId)?.nombre}</p>
                <p className="text-sm text-slate-400">
                  {fechaCompleta(detalle.fecha)} · {usuarioDe(detalle.encargadoId)?.nombre ?? "—"}
                </p>
              </div>
              <Badge color={detalle.estado === "cerrado" ? "green" : "amber"}>
                {detalle.estado === "cerrado" ? "Cerrado" : "Borrador"}
              </Badge>
            </div>

            <Campo titulo="Trabajo realizado" texto={detalle.trabajoRealizado || "—"} />

            {fotos.length > 0 && (
              <div>
                <p className="label mb-2">Fotografías ({fotos.length})</p>
                <div className="grid grid-cols-4 gap-2">
                  {fotos.map((f) => (
                    <img
                      key={f.id}
                      src={f.url}
                      className="aspect-square rounded-lg object-cover"
                      alt=""
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="label mb-2">Material pendiente</p>
              {detalle.materialesPendientes.length === 0 ? (
                <p className="text-sm text-slate-400">Ninguno.</p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {detalle.materialesPendientes.map((m) => (
                    <div key={m.id} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-slate-600">{m.nombre}</span>
                      <span className="font-semibold text-forge-dark">
                        {m.cantidad} {m.unidad}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Campo titulo="Observaciones" texto={detalle.observaciones || "—"} />
              <Campo titulo="Incidencias" texto={detalle.incidencias || "—"} />
            </div>

            {detalle.firma && (
              <div>
                <p className="label mb-2">Firma del encargado</p>
                <img
                  src={detalle.firma}
                  className="h-32 w-full rounded-xl border border-slate-200 object-contain"
                  alt="Firma"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Campo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="label mb-1">{titulo}</p>
      <p className="whitespace-pre-wrap text-sm text-slate-600">{texto}</p>
    </div>
  );
}
