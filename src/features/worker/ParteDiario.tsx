import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { obrasApi, partesApi, fotosApi } from "@/services";
import type { Foto, MaterialPendiente, Obra, ParteDiario as Parte } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Cargando, Spinner } from "@/components/ui";
import { uid } from "@/lib/db";
import { fechaLarga } from "@/lib/format";
import { errorDeTamano } from "@/lib/files";
import { IconCamera, IconPlus, IconTrash, IconCheck } from "@/components/icons";

export default function ParteDiario() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [obra, setObra] = useState<Obra | null>(null);
  const [parte, setParte] = useState<Parte | null>(null);
  const [trabajo, setTrabajo] = useState("");
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [materiales, setMateriales] = useState<MaterialPendiente[]>([]);
  const [fase, setFase] = useState<"preparando" | "subiendo" | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!id || !usuario) return;
    (async () => {
      const o = await obrasApi.getObra(id);
      setObra(o);
      if (o) {
        const p = await partesApi.getOrCreateParteDelDia(o.id, o.encargadoId ?? usuario.id);
        setParte(p);
        setTrabajo(p.trabajoRealizado);
        setMateriales(p.materialesPendientes);
        setFotos(await fotosApi.listFotosDeParte(p.id));
      }
    })();
  }, [id, usuario]);

  async function onFiles(files: FileList | null) {
    if (!files || !parte || !obra || !usuario) return;
    const errores = Array.from(files).map(errorDeTamano).filter(Boolean);
    if (errores.length) return alert(errores.join("\n"));
    try {
      for (const file of Array.from(files)) {
        await fotosApi.subirFoto(
          file,
          { obraId: obra.id, parteId: parte.id, subidaPor: usuario.id },
          setFase
        );
      }
      setFotos(await fotosApi.listFotosDeParte(parte.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al subir la foto");
    } finally {
      setFase(null);
    }
  }

  async function borrarFoto(foto: Foto) {
    await fotosApi.eliminarFoto(foto);
    setFotos((f) => f.filter((x) => x.id !== foto.id));
  }

  function addMaterial() {
    setMateriales((m) => [...m, { id: uid("m"), nombre: "", cantidad: 1, unidad: "uds" }]);
  }
  function updMaterial(mid: string, patch: Partial<MaterialPendiente>) {
    setMateriales((m) => m.map((x) => (x.id === mid ? { ...x, ...patch } : x)));
  }
  function delMaterial(mid: string) {
    setMateriales((m) => m.filter((x) => x.id !== mid));
  }

  async function guardar() {
    if (!parte) return;
    setGuardando(true);
    try {
      await partesApi.guardarParte(parte.id, {
        trabajoRealizado: trabajo,
        materialesPendientes: materiales.filter((m) => m.nombre.trim()),
      });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (!obra || !parte) return <Cargando />;
  const cerrado = parte.estado === "cerrado";

  return (
    <div>
      <WorkerHeader
        title="Parte diario"
        subtitle={`${obra.nombre} · ${fechaLarga(parte.fecha)}`}
      />

      <div className="space-y-5 p-4">
        {cerrado && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            <IconCheck className="h-5 w-5" /> Parte cerrado. Ya no se puede editar.
          </div>
        )}

        {/* Trabajo realizado */}
        <section>
          <label className="label">Trabajo realizado</label>
          <textarea
            className="field mt-1.5 min-h-32 resize-y"
            placeholder="Describe qué se ha hecho hoy en la obra…"
            value={trabajo}
            disabled={cerrado}
            onChange={(e) => setTrabajo(e.target.value)}
          />
        </section>

        {/* Fotografías */}
        <section>
          <label className="label">Fotografías</label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative aspect-square">
                <img
                  src={foto.url}
                  className="h-full w-full rounded-lg object-cover"
                  alt="Foto de obra"
                />
                {!cerrado && (
                  <button
                    onClick={() => borrarFoto(foto)}
                    className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white shadow"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {!cerrado && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={!!fase}
                className="grid aspect-square place-items-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-forge-orange hover:text-forge-orange disabled:opacity-50"
              >
                {fase ? (
                  <>
                    <Spinner className="h-5 w-5" />
                    <span className="text-[9px] leading-none">
                      {fase === "preparando" ? "Preparando…" : "Subiendo…"}
                    </span>
                  </>
                ) : (
                  <IconCamera className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
        </section>

        {/* Material pendiente */}
        <section>
          <div className="flex items-center justify-between">
            <label className="label">Material pendiente</label>
            {!cerrado && (
              <button
                onClick={addMaterial}
                className="flex items-center gap-1 text-sm font-semibold text-forge-orange"
              >
                <IconPlus className="h-4 w-4" /> Añadir
              </button>
            )}
          </div>
          <div className="mt-1.5 space-y-2">
            {materiales.length === 0 && (
              <p className="text-sm text-slate-400">Sin material pendiente.</p>
            )}
            {materiales.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <input
                  className="field flex-1"
                  placeholder="Material (p.ej. Tornillos)"
                  value={m.nombre}
                  disabled={cerrado}
                  onChange={(e) => updMaterial(m.id, { nombre: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  className="field w-16 text-center"
                  value={m.cantidad}
                  disabled={cerrado}
                  onChange={(e) => updMaterial(m.id, { cantidad: Number(e.target.value) })}
                />
                <input
                  className="field w-16 text-center"
                  value={m.unidad}
                  disabled={cerrado}
                  onChange={(e) => updMaterial(m.id, { unidad: e.target.value })}
                />
                {!cerrado && (
                  <button
                    onClick={() => delMaterial(m.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {!cerrado && (
          <div className="flex gap-3">
            <button onClick={guardar} disabled={guardando} className="btn-ghost flex-1">
              {guardando ? <Spinner className="h-5 w-5" /> : guardado ? "✓ Guardado" : "Guardar borrador"}
            </button>
            <button
              onClick={() => navigate(`/obras/${obra.id}/cierre`)}
              className="btn-primary flex-1"
            >
              Ir a cierre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
