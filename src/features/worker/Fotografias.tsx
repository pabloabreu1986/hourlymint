import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { obrasApi, fotosApi, partesApi, usuariosApi } from "@/services";
import type { Foto, Obra, Usuario } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Cargando, EmptyState, Modal, Spinner } from "@/components/ui";
import { hora } from "@/lib/format";
import { errorDeTamano } from "@/lib/files";
import { IconCamera, IconPlus } from "@/components/icons";

export default function Fotografias() {
  const { usuario } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<Foto[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [preview, setPreview] = useState<Foto | null>(null);
  const [elegirObra, setElegirObra] = useState(false);
  const [fase, setFase] = useState<"preparando" | "subiendo" | null>(null);
  const pendientes = useRef<File[]>([]);

  async function cargar() {
    if (!usuario) return;
    const [fs, os, us] = await Promise.all([
      fotosApi.listFotosVisibles(usuario),
      obrasApi.listObrasDeTrabajador(usuario.id),
      usuariosApi.listUsuarios(),
    ]);
    setFotos(fs);
    setObras(os);
    setUsuarios(us);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  function onFiles(files: FileList | null) {
    if (!files || !usuario) return;
    const errores = Array.from(files).map(errorDeTamano).filter(Boolean);
    if (errores.length) return alert(errores.join("\n"));
    pendientes.current = Array.from(files);
    if (obras.length === 1) subirA(obras[0]);
    else setElegirObra(true);
  }

  async function subirA(obra: Obra) {
    if (!usuario) return;
    setElegirObra(false);
    try {
      const parte = await partesApi.getOrCreateParteDelDia(obra.id, obra.encargadoId ?? usuario.id);
      for (const file of pendientes.current) {
        await fotosApi.subirFoto(
          file,
          { obraId: obra.id, parteId: parte.id, subidaPor: usuario.id },
          setFase
        );
      }
      pendientes.current = [];
      await cargar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al subir la foto");
    } finally {
      setFase(null);
    }
  }

  if (!fotos) return <Cargando />;

  const nombreObra = (id: string) => obras.find((o) => o.id === id)?.nombre ?? "Obra";
  const colorObra = (id: string) => obras.find((o) => o.id === id)?.color ?? "#94A3B8";
  const nombreUsuario = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre ?? "—";
  const esEncargado = obras.some((o) => o.encargadoId === usuario?.id);

  // Agrupar por obra
  const porObra = new Map<string, Foto[]>();
  fotos.forEach((f) => {
    const arr = porObra.get(f.obraId) ?? [];
    arr.push(f);
    porObra.set(f.obraId, arr);
  });

  return (
    <div>
      <WorkerHeader
        title="Fotografías"
        subtitle={
          esEncargado ? `${fotos.length} fotos · incluye las de tu equipo` : `${fotos.length} fotos`
        }
        back={false}
        action={
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!!fase}
            className="btn-primary px-3 py-2 text-sm"
          >
            {fase ? <Spinner className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}
            {fase === "preparando" ? "Preparando…" : fase === "subiendo" ? "Subiendo…" : "Subir"}
          </button>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />

      {fotos.length === 0 ? (
        <EmptyState
          icon={<IconCamera className="h-12 w-12" />}
          titulo="Aún no hay fotos"
          texto="Sube fotos del avance de la obra desde aquí o desde el parte diario."
        />
      ) : (
        <div className="space-y-6 p-4">
          {[...porObra.entries()].map(([obraId, lista]) => (
            <section key={obraId}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorObra(obraId) }} />
                <h2 className="text-sm font-bold text-forge-dark">{nombreObra(obraId)}</h2>
                <span className="text-xs text-slate-400">({lista.length})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {lista.map((f) => (
                  <button key={f.id} onClick={() => setPreview(f)} className="relative aspect-square">
                    <img src={f.url} className="h-full w-full rounded-lg object-cover" alt="" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Preview a pantalla completa */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Fotografía">
        {preview && (
          <div className="space-y-3">
            <img src={preview.url} className="w-full rounded-xl" alt="Foto" />
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{nombreObra(preview.obraId)}</span>
              <span>
                {nombreUsuario(preview.subidaPor)} · {hora(preview.createdAt)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Elegir obra al subir */}
      <Modal open={elegirObra} onClose={() => setElegirObra(false)} title="¿A qué obra?">
        <div className="space-y-2">
          {obras.map((o) => (
            <button
              key={o.id}
              onClick={() => subirA(o)}
              className="card flex w-full items-center gap-3 p-3 text-left"
            >
              <span className="h-3 w-3 rounded-full" style={{ background: o.color }} />
              <span className="font-medium text-forge-dark">{o.nombre}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
