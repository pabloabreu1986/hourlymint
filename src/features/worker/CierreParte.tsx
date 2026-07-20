import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { obrasApi, partesApi, incidenciasApi } from "@/services";
import type { Obra, ParteDiario as Parte } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Cargando, ProgressBar, Spinner, Modal } from "@/components/ui";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";
import { fechaLarga } from "@/lib/format";
import { IconCheck, IconChevronRight } from "@/components/icons";

export default function CierreParte() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const firmaRef = useRef<SignaturePadHandle>(null);

  const [obra, setObra] = useState<Obra | null>(null);
  const [parte, setParte] = useState<Parte | null>(null);
  const [avance, setAvance] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [incidencias, setIncidencias] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!id || !usuario) return;
    (async () => {
      const o = await obrasApi.getObra(id);
      setObra(o);
      if (o) {
        const p = await partesApi.getOrCreateParteDelDia(o.id, o.encargadoId ?? usuario.id);
        setParte(p);
        setAvance(p.avance || o.avance);
        setObservaciones(p.observaciones);
        setIncidencias(p.incidencias);
      }
    })();
  }, [id, usuario]);

  async function cerrar() {
    if (!parte || !obra) return;
    if (firmaRef.current?.isEmpty()) {
      alert("Falta la firma del encargado.");
      return;
    }
    setCerrando(true);
    try {
      await partesApi.cerrarParte(parte.id, {
        avance,
        observaciones,
        incidencias,
        firma: firmaRef.current?.toDataURL() ?? null,
      });
      // Si el encargado reporta una incidencia distinta de "ninguna", la registramos.
      const inc = incidencias.trim().toLowerCase();
      if (inc && inc !== "ninguna" && inc !== "ninguno") {
        await incidenciasApi.crearIncidencia({
          obraId: obra.id,
          titulo: "Incidencia en cierre de parte",
          descripcion: incidencias,
          trabajadorId: usuario?.id ?? null,
        });
      }
      setOk(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cerrar el parte");
    } finally {
      setCerrando(false);
    }
  }

  if (!obra || !parte) return <Cargando />;
  const cerrado = parte.estado === "cerrado";
  const numMateriales = parte.materialesPendientes.length;

  return (
    <div>
      <WorkerHeader title="Cierre de parte" subtitle={`${obra.nombre} · ${fechaLarga(parte.fecha)}`} />

      <div className="space-y-5 p-4">
        {/* Avance */}
        <section>
          <label className="label">Porcentaje de avance</label>
          <div className="mt-1.5 card p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-forge-dark">{avance}%</span>
            </div>
            <ProgressBar value={avance} color="#BE6B39" />
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={avance}
              disabled={cerrado}
              onChange={(e) => setAvance(Number(e.target.value))}
              className="mt-3 w-full accent-forge-orange"
            />
          </div>
        </section>

        {/* Material pendiente (resumen del parte) */}
        <button
          onClick={() => navigate(`/obras/${obra.id}/parte`)}
          className="card flex w-full items-center justify-between p-4 text-left"
        >
          <div>
            <p className="label">Material pendiente</p>
            <p className="mt-0.5 font-semibold text-forge-dark">
              {numMateriales} material{numMateriales === 1 ? "" : "es"} pendiente
              {numMateriales === 1 ? "" : "s"}
            </p>
          </div>
          <IconChevronRight className="h-5 w-5 text-slate-300" />
        </button>

        {/* Observaciones */}
        <section>
          <label className="label">Observaciones</label>
          <textarea
            className="field mt-1.5 min-h-24 resize-y"
            placeholder="Notas, pendientes de confirmar con cliente…"
            value={observaciones}
            disabled={cerrado}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </section>

        {/* Incidencias */}
        <section>
          <label className="label">Incidencias</label>
          <textarea
            className="field mt-1.5 min-h-20 resize-y"
            placeholder="Ninguna"
            value={incidencias}
            disabled={cerrado}
            onChange={(e) => setIncidencias(e.target.value)}
          />
        </section>

        {/* Firma */}
        <section>
          <div className="flex items-center justify-between">
            <label className="label">Firma del encargado</label>
            {!cerrado && (
              <button
                onClick={() => firmaRef.current?.clear()}
                className="text-sm font-semibold text-slate-400"
              >
                Borrar
              </button>
            )}
          </div>
          {cerrado && parte.firma ? (
            <img src={parte.firma} alt="Firma" className="mt-1.5 h-40 w-full rounded-xl border border-slate-200 object-contain" />
          ) : (
            <div className="mt-1.5">
              <SignaturePad ref={firmaRef} />
              <p className="mt-1 text-center text-xs text-slate-400">Firma con el dedo</p>
            </div>
          )}
        </section>

        {!cerrado && (
          <button onClick={cerrar} disabled={cerrando} className="btn-primary w-full">
            {cerrando ? <Spinner className="h-5 w-5" /> : "Cerrar parte"}
          </button>
        )}
      </div>

      <Modal open={ok} onClose={() => navigate("/obras")} title="Parte cerrado">
        <div className="space-y-4 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
            <IconCheck className="h-9 w-9" />
          </span>
          <div>
            <p className="text-lg font-bold text-forge-dark">¡Parte enviado!</p>
            <p className="text-sm text-slate-400">
              El parte de {obra.nombre} se ha cerrado con un {avance}% de avance.
            </p>
          </div>
          <button onClick={() => navigate("/obras")} className="btn-primary w-full">
            Volver a mis obras
          </button>
        </div>
      </Modal>
    </div>
  );
}
