import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { comprasApi, catalogoApi, obrasApi } from "@/services";
import { extraerFactura, fileADataUrl } from "@/lib/extraer-factura";
import { formatEuro } from "@/lib/format";
import { Cargando, Spinner } from "@/components/ui";
import {
  IconChevronLeft,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconCheck,
} from "@/components/icons";
import type {
  Articulo,
  FacturaProveedor,
  LineaCompra,
  Obra,
  Proveedor,
} from "@/lib/types";

let seq = 0;
const lid = () => `lc_${Date.now().toString(36)}_${seq++}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

export default function AdminCompraEditor() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [c, setC] = useState<FacturaProveedor | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [extrayendo, setExtrayendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [textoCrudo, setTextoCrudo] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(true);

  async function cargarCatalogo() {
    const [ps, ar] = await Promise.all([catalogoApi.listProveedores(), catalogoApi.listArticulos()]);
    setProveedores(ps);
    setArticulos(ar);
  }

  useEffect(() => {
    (async () => {
      const [cm, os] = await Promise.all([comprasApi.getCompra(id), obrasApi.listObras()]);
      setC(cm);
      setObras(os);
      await cargarCatalogo();
      setCargando(false);
    })();
  }, [id]);

  function set(patch: Partial<FacturaProveedor>) {
    setC((prev) => (prev ? { ...prev, ...patch } : prev));
    setGuardado(false);
  }
  function setLineas(lineas: LineaCompra[]) {
    set({ lineas, total: r2(lineas.reduce((s, l) => s + l.total, 0)) });
  }

  async function onFile(file: File) {
    setExtrayendo(true);
    setAviso(null);
    try {
      const archivo = await fileADataUrl(file);
      const res = await extraerFactura(file);
      // Casar proveedor por nombre si lo detectó.
      let proveedorId = c?.proveedorId ?? null;
      if (res.proveedorNombre) {
        const p = proveedores.find(
          (x) =>
            x.nombre.toLowerCase().includes(res.proveedorNombre!.toLowerCase()) ||
            res.proveedorNombre!.toLowerCase().includes(x.nombre.toLowerCase())
        );
        if (p) proveedorId = p.id;
      }
      set({
        archivo,
        proveedorId,
        numero: res.numero ?? c?.numero ?? "",
        fecha: res.fecha ?? c?.fecha ?? "",
      });
      setLineas(res.lineas);
      setTextoCrudo(res.textoCrudo);
      const motor = res.metodo === "ia" ? "IA" : res.metodo === "ocr" ? "OCR (escaneo)" : "lectura de PDF";
      const base =
        res.lineas.length > 0
          ? `Extraídas ${res.lineas.length} líneas por ${motor}. Revisa y corrige antes de aprobar.`
          : `Leí el documento (${motor}) pero no reconocí líneas automáticamente. Añádelas a mano, o mira el "texto extraído" de abajo.`;
      setAviso(res.avisoIA ? `${base} (IA: ${res.avisoIA})` : base);
    } catch (e) {
      setAviso("No se pudo leer el archivo: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setExtrayendo(false);
    }
  }

  async function guardar(): Promise<void> {
    if (!c) return;
    setGuardando(true);
    try {
      await comprasApi.actualizarCompra(c.id, c);
      setGuardado(true);
    } finally {
      setGuardando(false);
    }
  }

  async function aprobar() {
    if (!c) return;
    await guardar();
    await comprasApi.aprobarCompra(c.id);
    await cargarCatalogo();
    setC({ ...c, estado: "aprobada" });
    setAviso("Compra aprobada. Los artículos mapeados actualizaron su precio en el banco.");
  }

  async function crearArticuloDesde(l: LineaCompra) {
    const nuevo = await catalogoApi.crearArticulo({
      referencia: "",
      nombre: l.descripcion || "Artículo",
      proveedorId: c?.proveedorId ?? null,
      categoria: "material",
      unidad: l.unidad || "ud",
      coste: l.precioUnitario,
    });
    setArticulos((a) => [...a, nuevo]);
    updateLinea(l.id, { articuloId: nuevo.id });
  }

  // Artículo del banco al que corresponde una línea: el mapeado, o uno con el
  // mismo nombre (para detectar si ya existe y si su precio cambió).
  const byArt = useMemo(() => new Map(articulos.map((a) => [a.id, a])), [articulos]);
  const artPorNombre = useMemo(() => {
    const m = new Map<string, Articulo>();
    for (const a of articulos) m.set(a.nombre.toLowerCase().replace(/\s+/g, " ").trim(), a);
    return m;
  }, [articulos]);
  const matchArticulo = (l: LineaCompra): Articulo | null =>
    l.articuloId
      ? byArt.get(l.articuloId) ?? null
      : artPorNombre.get(l.descripcion.toLowerCase().replace(/\s+/g, " ").trim()) ?? null;

  /** Añade la línea al banco, o actualiza su precio si ya existe, y la mapea. */
  async function sincronizarBanco(l: LineaCompra) {
    const art = matchArticulo(l);
    if (!art) {
      await crearArticuloDesde(l);
      return;
    }
    if (art.coste !== l.precioUnitario && l.precioUnitario > 0) {
      const upd = await catalogoApi.actualizarArticulo(art.id, { coste: l.precioUnitario });
      setArticulos((a) => a.map((x) => (x.id === upd.id ? upd : x)));
    }
    if (l.articuloId !== art.id) updateLinea(l.id, { articuloId: art.id });
  }

  function updateLinea(lid_: string, patch: Partial<LineaCompra>) {
    setLineas(
      (c?.lineas ?? []).map((l) => {
        if (l.id !== lid_) return l;
        const merged = { ...l, ...patch };
        // Recalcular total si cambian cantidad/precio (salvo que venga total explícito).
        if (patch.total === undefined && (patch.cantidad !== undefined || patch.precioUnitario !== undefined)) {
          merged.total = r2(merged.cantidad * merged.precioUnitario);
        }
        return merged;
      })
    );
  }

  if (cargando) return <Cargando />;
  if (!c) {
    return (
      <div className="card p-8 text-center text-slate-500">
        Factura no encontrada.{" "}
        <button onClick={() => navigate("/admin/compras")} className="text-forge-orange underline">
          Volver
        </button>
      </div>
    );
  }

  const bloqueada = c.estado === "aprobada";

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/compras")}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-forge-dark"
        >
          <IconChevronLeft className="h-4 w-4" /> Facturas de proveedor
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {guardando ? "Guardando…" : guardado ? "Guardado" : "Sin guardar"}
          </span>
          {!bloqueada && (
            <>
              <button onClick={guardar} disabled={guardando} className="btn-ghost px-4 py-2 text-sm">
                Guardar
              </button>
              <button onClick={aprobar} className="btn-primary px-4 py-2 text-sm">
                Aprobar
              </button>
            </>
          )}
          {bloqueada && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Aprobada
            </span>
          )}
        </div>
      </div>

      {/* Subir factura */}
      {!bloqueada && (
        <div className="card p-4">
          <label className="label">Documento (PDF o foto)</label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="btn-ghost cursor-pointer px-4 py-2 text-sm">
              {extrayendo ? <Spinner className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}{" "}
              {extrayendo ? "Leyendo…" : c.archivo ? "Cambiar documento" : "Subir y extraer"}
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            {c.archivo && (
              <a
                href={c.archivo}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-forge-orange hover:underline"
              >
                Ver documento
              </a>
            )}
          </div>
          {aviso && <p className="mt-2 text-xs text-slate-500">{aviso}</p>}
          {textoCrudo && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-slate-400 hover:text-forge-dark">
                Ver texto extraído
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
                {textoCrudo}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Datos */}
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Nº factura</label>
          <input
            className="field mt-1.5"
            value={c.numero}
            disabled={bloqueada}
            onChange={(e) => set({ numero: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Fecha</label>
          <input
            type="date"
            className="field mt-1.5"
            value={c.fecha}
            disabled={bloqueada}
            onChange={(e) => set({ fecha: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Proveedor</label>
          <select
            className="field mt-1.5"
            value={c.proveedorId ?? ""}
            disabled={bloqueada}
            onChange={(e) => set({ proveedorId: e.target.value || null })}
          >
            <option value="">—</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Obra (coste real)</label>
          <select
            className="field mt-1.5"
            value={c.obraId ?? ""}
            disabled={bloqueada}
            onChange={(e) => set({ obraId: e.target.value || null })}
          >
            <option value="">—</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Líneas */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-forge-dark">Líneas</h3>
          {!bloqueada && (
            <button
              onClick={() =>
                setLineas([
                  ...c.lineas,
                  { id: lid(), descripcion: "", cantidad: 1, unidad: "ud", precioUnitario: 0, total: 0, articuloId: null },
                ])
              }
              className="btn-ghost px-3 py-1.5 text-sm"
            >
              <IconPlus className="h-4 w-4" /> Añadir línea
            </button>
          )}
        </div>

        {c.lineas.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Sube una factura para extraer las líneas, o añádelas a mano.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-[68px]" />
                <col className="w-[56px]" />
                <col className="w-[100px]" />
                <col className="w-[100px]" />
                <col className="w-[248px]" />
                <col className="w-[40px]" />
              </colgroup>
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-2 py-2 text-left font-semibold">Descripción</th>
                  <th className="px-2 py-2 text-right font-semibold">Cant.</th>
                  <th className="px-2 py-2 text-left font-semibold">Ud</th>
                  <th className="px-2 py-2 text-right font-semibold">Precio</th>
                  <th className="px-2 py-2 text-right font-semibold">Total</th>
                  <th className="px-2 py-2 text-left font-semibold">Artículo del banco</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {c.lineas.map((l) => {
                  const art = matchArticulo(l);
                  return (
                    <tr key={l.id} className="border-b border-slate-50">
                      <td className="px-1 py-1">
                        <input
                          className="field w-full py-1.5"
                          value={l.descripcion}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { descripcion: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          className="field w-full py-1.5 text-right"
                          value={l.cantidad}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { cantidad: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="field w-full py-1.5"
                          value={l.unidad}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { unidad: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          className="field w-full py-1.5 text-right"
                          value={l.precioUnitario}
                          disabled={bloqueada}
                          onChange={(e) =>
                            updateLinea(l.id, { precioUnitario: Number(e.target.value) || 0 })
                          }
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          className="field w-full py-1.5 text-right"
                          value={l.total}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { total: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <div className="flex items-center gap-1.5">
                          <select
                            className="field w-full py-1.5"
                            value={l.articuloId ?? ""}
                            disabled={bloqueada}
                            onChange={(e) => updateLinea(l.id, { articuloId: e.target.value || null })}
                          >
                            <option value="">— Sin mapear —</option>
                            {articulos.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.nombre}
                              </option>
                            ))}
                          </select>
                          {!bloqueada &&
                            (art == null ? (
                              <button
                                onClick={() => sincronizarBanco(l)}
                                title="Añadir al banco de precios"
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-forge-orange hover:bg-orange-50"
                              >
                                <IconPlus className="h-4 w-4" />
                              </button>
                            ) : art.coste !== l.precioUnitario ? (
                              <button
                                onClick={() => sincronizarBanco(l)}
                                title={`Actualizar precio en el banco: ${formatEuro(art.coste)} → ${formatEuro(l.precioUnitario)}`}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-amber-600 hover:bg-amber-50"
                              >
                                <IconRefresh className="h-4 w-4" />
                              </button>
                            ) : (
                              <span
                                title="Ya está en el banco al mismo precio"
                                className="grid h-8 w-8 shrink-0 place-items-center text-green-500"
                              >
                                <IconCheck className="h-4 w-4" />
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-1 py-1 text-right">
                        {!bloqueada && (
                          <button
                            onClick={() => setLineas(c.lineas.filter((x) => x.id !== l.id))}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">Total factura</p>
            <p className="text-xl font-extrabold text-forge-dark">{formatEuro(c.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
