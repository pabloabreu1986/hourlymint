import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { gastosApi, obrasApi } from "@/services";
import type { CategoriaGasto, EstadoGasto, Gasto, Obra } from "@/lib/types";
import { WorkerHeader } from "./WorkerHeader";
import { Badge, Cargando, EmptyState, Modal, Spinner } from "@/components/ui";
import { Combobox } from "@/components/Combobox";
import { fechaCompleta } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { fileToThumbDataURL } from "@/lib/image";
import { errorDeTamano } from "@/lib/files";
import { IconEuro, IconPlus } from "@/components/icons";

const CATEGORIAS: { value: CategoriaGasto; label: string }[] = [
  { value: "dietas", label: "Dietas" },
  { value: "transporte", label: "Transporte" },
  { value: "material", label: "Material" },
  { value: "alojamiento", label: "Alojamiento" },
  { value: "otro", label: "Otro" },
];

const COLOR_ESTADO: Record<EstadoGasto, "amber" | "green" | "red" | "blue"> = {
  pendiente: "amber",
  aprobado: "green",
  rechazado: "red",
  pagado: "blue",
};

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function MisGastos() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Gasto[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGasto>("dietas");
  const [importe, setImporte] = useState("");
  const [obraId, setObraId] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [justificante, setJustificante] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    if (!usuario) return;
    setItems(await gastosApi.gastosDe(usuario.id));
  }
  useEffect(() => {
    cargar();
    obrasApi.listObras().then(setObras);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  if (!usuario) return null;

  async function elegirFoto(file: File | null) {
    if (!file) return;
    const err = errorDeTamano(file);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setJustificante(await fileToThumbDataURL(file, 1080, 0.75));
  }

  async function crear() {
    if (!usuario) return;
    const imp = Number(importe.replace(",", "."));
    if (!concepto.trim() || !imp || imp <= 0) {
      setError("Pon un concepto y un importe válido.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await gastosApi.crearGasto({
        trabajadorId: usuario.id,
        obraId: obraId || null,
        concepto: concepto.trim(),
        categoria,
        importe: Math.round(imp * 100) / 100,
        fecha,
        justificante,
      });
      setAbierto(false);
      setConcepto("");
      setImporte("");
      setJustificante(null);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el gasto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <WorkerHeader
        title="Mis gastos"
        action={
          <button onClick={() => setAbierto(true)} className="btn-primary px-3 py-2 text-sm">
            <IconPlus className="h-4 w-4" /> Nuevo
          </button>
        }
      />

      <div className="p-4">
        {!items ? (
          <Cargando />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IconEuro className="h-12 w-12" />}
            titulo="Sin gastos"
            texto="Presenta dietas, transporte o material con la foto del ticket."
          />
        ) : (
          <div className="space-y-3">
            {items.map((g) => (
              <div key={g.id} className="card flex items-center gap-3 p-4">
                {g.justificante ? (
                  <img
                    src={g.justificante}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forge-orange/10 text-forge-orange">
                    <IconEuro className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-bold text-forge-dark">{g.concepto}</p>
                    <Badge color={COLOR_ESTADO[g.estado]}>{g.estado.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    {CATEGORIAS.find((c) => c.value === g.categoria)?.label} ·{" "}
                    {fechaCompleta(g.fecha)}
                  </p>
                </div>
                <p className="text-lg font-extrabold text-forge-dark">{eur(g.importe)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={abierto} onClose={() => setAbierto(false)} title="Nuevo gasto">
        <div className="space-y-4">
          <div>
            <label className="label">Concepto</label>
            <input
              className="field mt-1.5"
              placeholder="p.ej. Comida en obra"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Importe (€)</label>
              <input
                className="field mt-1.5"
                inputMode="decimal"
                placeholder="0,00"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                className="field mt-1.5"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="field mt-1.5"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Obra (opcional)</label>
            <Combobox
              className="field mt-1.5 flex w-full items-center justify-between text-left"
              label={obras.find((o) => o.id === obraId)?.nombre ?? "Sin obra concreta"}
              placeholder="Buscar obra…"
              items={[
                { id: "", label: "Sin obra concreta" },
                ...obras.map((o) => ({ id: o.id, label: o.nombre })),
              ]}
              onPick={(id) => setObraId(id)}
            />
          </div>
          <div>
            <label className="label">Foto del ticket (opcional)</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="field mt-1.5"
              onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)}
            />
            {justificante && (
              <img src={justificante} alt="Justificante" className="mt-2 h-24 rounded-xl object-cover" />
            )}
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button onClick={crear} disabled={guardando} className="btn-primary w-full py-3">
            {guardando ? <Spinner className="h-5 w-5" /> : "Presentar gasto"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
