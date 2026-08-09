import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { comunicadosApi, notificacionesApi } from "@/services";
import type { Comunicado } from "@/lib/types";
import { Badge, Cargando, EmptyState, Modal, Spinner } from "@/components/ui";
import { confirmar } from "@/components/confirm";
import { fechaHora } from "@/lib/format";
import { IconMegaphone, IconPlus, IconTrash } from "@/components/icons";

export default function AdminComunicados() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Comunicado[] | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [fijado, setFijado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setItems(await comunicadosApi.listComunicados());
  }
  useEffect(() => {
    cargar();
  }, []);

  if (!items) return <Cargando />;

  async function publicar() {
    if (!titulo.trim() || !cuerpo.trim()) return;
    setGuardando(true);
    try {
      await comunicadosApi.publicarComunicado({
        titulo: titulo.trim(),
        cuerpo: cuerpo.trim(),
        autorId: usuario?.id ?? null,
        fijado,
      });
      // Aviso global a toda la plantilla.
      await notificacionesApi.crearNotificacion({
        trabajadorId: null,
        tipo: "aviso",
        titulo: `Comunicado: ${titulo.trim()}`,
        mensaje: cuerpo.trim().slice(0, 140),
      });
      setAbierto(false);
      setTitulo("");
      setCuerpo("");
      setFijado(false);
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function alternarFijado(c: Comunicado) {
    await comunicadosApi.actualizarComunicado(c.id, { fijado: !c.fijado });
    cargar();
  }

  async function eliminar(c: Comunicado) {
    if (!(await confirmar({ titulo: "Eliminar comunicado", mensaje: `Se eliminará "${c.titulo}". Esta acción no se puede deshacer.` }))) return;
    await comunicadosApi.eliminarComunicado(c.id);
    cargar();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setAbierto(true)} className="btn-primary px-4 py-2.5">
          <IconPlus className="h-5 w-5" /> Publicar comunicado
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconMegaphone className="h-12 w-12" />}
          titulo="Sin comunicados"
          texto="Publica avisos de empresa: calendario, políticas, eventos…"
        />
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forge-orange/10 text-forge-orange">
                  <IconMegaphone className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-forge-dark">{c.titulo}</p>
                    {c.fijado && <Badge color="orange">FIJADO</Badge>}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{c.cuerpo}</p>
                  <p className="mt-2 text-xs text-slate-400">{fechaHora(c.fecha)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => alternarFijado(c)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      c.fijado
                        ? "bg-forge-orange/10 text-forge-orange"
                        : "text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {c.fijado ? "Desfijar" : "Fijar"}
                  </button>
                  <button
                    onClick={() => eliminar(c)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={abierto} onClose={() => setAbierto(false)} title="Publicar comunicado">
        <div className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input className="field mt-1.5" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="label">Mensaje</label>
            <textarea
              className="field mt-1.5"
              rows={5}
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={fijado}
              onChange={(e) => setFijado(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--brand-orange))]"
            />
            <span className="text-sm text-slate-600">Fijar arriba del tablón</span>
          </label>
          <p className="text-xs text-slate-400">
            Al publicar se enviará también un aviso a toda la plantilla.
          </p>
          <button
            onClick={publicar}
            disabled={guardando || !titulo.trim() || !cuerpo.trim()}
            className="btn-primary w-full py-3"
          >
            {guardando ? <Spinner className="h-5 w-5" /> : "Publicar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
