import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fotosApi, obrasApi, usuariosApi } from "@/services";
import type { Foto, Obra, Usuario } from "@/lib/types";
import { Avatar, Cargando, EmptyState, Modal } from "@/components/ui";
import { fechaHora } from "@/lib/format";
import { IconCamera } from "@/components/icons";

export default function AdminFotografias() {
  const { usuario } = useAuth();
  const [fotos, setFotos] = useState<Foto[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [obraFiltro, setObraFiltro] = useState("todas");
  const [preview, setPreview] = useState<Foto | null>(null);

  useEffect(() => {
    if (!usuario) return;
    fotosApi.listFotosVisibles(usuario).then(setFotos);
    obrasApi.listObras().then(setObras);
    usuariosApi.listUsuarios().then(setUsuarios);
  }, [usuario]);

  const nombreObra = (id: string) => obras.find((o) => o.id === id)?.nombre ?? "Obra";
  const colorObra = (id: string) => obras.find((o) => o.id === id)?.color ?? "#94A3B8";
  const usuarioDe = (id: string | null) => usuarios.find((u) => u.id === id) ?? null;

  const visibles = useMemo(
    () => (fotos ?? []).filter((f) => obraFiltro === "todas" || f.obraId === obraFiltro),
    [fotos, obraFiltro]
  );

  if (!fotos) return <Cargando />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {fotos.length} fotos subidas por los trabajadores
        </p>
        <select
          value={obraFiltro}
          onChange={(e) => setObraFiltro(e.target.value)}
          className="field w-full sm:w-64"
        >
          <option value="todas">Todas las obras</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
      </div>

      {visibles.length === 0 ? (
        <EmptyState icon={<IconCamera className="h-12 w-12" />} titulo="Sin fotografías" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibles.map((f) => {
            const u = usuarioDe(f.subidaPor);
            return (
              <button
                key={f.id}
                onClick={() => setPreview(f)}
                className="card overflow-hidden text-left transition hover:shadow-card-lg"
              >
                <div className="aspect-square w-full bg-slate-100">
                  <img src={f.url} className="h-full w-full object-cover" alt="" />
                </div>
                <div className="flex items-center gap-2 p-2.5">
                  {u && <Avatar nombre={u.nombre} color={u.color} size={24} />}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-forge-dark">
                      {u?.nombre ?? "—"}
                    </p>
                    <p className="flex items-center gap-1 truncate text-[10px] text-slate-400">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: colorObra(f.obraId) }}
                      />
                      {nombreObra(f.obraId)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Fotografía" maxWidth="max-w-xl">
        {preview && (
          <div className="space-y-3">
            <img src={preview.url} className="w-full rounded-xl" alt="Foto" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-forge-dark">{nombreObra(preview.obraId)}</span>
              <span className="text-slate-500">
                {usuarioDe(preview.subidaPor)?.nombre ?? "—"} · {fechaHora(preview.createdAt)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
