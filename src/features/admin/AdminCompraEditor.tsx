import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { comprasApi, catalogoApi, obrasApi, presupuestosApi, clientesApi } from "@/services";
import { extraerFactura, fileADataUrl } from "@/lib/extraer-factura";
import { margenDefecto } from "./AdminPresupuestos";
import { formatEuro } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { toast } from "sonner";
import { Cargando, EmptyState, Modal, Spinner, Tooltip } from "@/components/ui";
import { Combobox } from "@/components/Combobox";
import {
  IconChevronLeft,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconCheck,
} from "@/components/icons";
import type {
  Articulo,
  Cliente,
  FacturaProveedor,
  LineaCompra,
  Obra,
  Presupuesto,
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
  const [presModal, setPresModal] = useState(false);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

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
      // Casar proveedor por nombre si lo detectó; si no existe, crearlo y asignarlo.
      let proveedorId = c?.proveedorId ?? null;
      const nombreDet = res.proveedorNombre?.trim();
      if (nombreDet) {
        let p = proveedores.find(
          (x) =>
            x.nombre.toLowerCase().includes(nombreDet.toLowerCase()) ||
            nombreDet.toLowerCase().includes(x.nombre.toLowerCase())
        );
        if (!p) {
          // El proveedor detectado no está en el banco: lo damos de alta
          // automáticamente para que la factura (y sus artículos al aprobar)
          // queden asociados a él.
          p = await catalogoApi.crearProveedor({ nombre: nombreDet, cif: "", telefono: "", email: "", notas: "" });
          setProveedores((prev) => [...prev, p!]);
          toast.success(`Proveedor "${nombreDet}" creado y asignado`);
        }
        proveedorId = p.id;
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
      toast.success("Guardado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function aprobar() {
    if (!c) return;
    await guardar();
    const actualizada = await comprasApi.aprobarCompra(c.id);
    await cargarCatalogo();
    setC(actualizada);
    setAviso("Compra aprobada. Todas las líneas se subieron al banco de precios (con su proveedor y precio).");
    toast.success("Compra aprobada · líneas subidas al banco");
  }

  /** Genera un presupuesto de cliente a partir de las líneas de esta factura,
   * aplicando el sobreprecio (margen por defecto). Cada línea entra a su coste
   * neto; el PVP lo calcula el presupuesto. */
  /** Convierte las líneas de la factura en líneas de presupuesto. El margen
   *  queda a null en cada línea para que herede el % del presupuesto. */
  function lineasParaPresupuesto() {
    return c!.lineas.map((l) => ({
      id: lid(),
      tipo: "articulo" as const,
      refId: l.articuloId ?? null,
      concepto: l.descripcion,
      unidad: l.unidad,
      cantidad: l.cantidad,
      costeUnitario: costeNeto(l),
      margenPct: null,
    }));
  }

  async function abrirDialogoPresupuesto() {
    setPresModal(true);
    const [todos, cs] = await Promise.all([
      presupuestosApi.listPresupuestos(),
      clientesApi.listClientes(),
    ]);
    setPresupuestos(todos.filter((p) => p.estado === "borrador"));
    setClientes(cs);
  }
  const nombreClientePres = (clienteId: string | null) => {
    const cl = clienteId ? clientes.find((x) => x.id === clienteId) : null;
    return cl ? `${cl.nombre} ${cl.apellidos}`.trim() : "Sin cliente";
  };

  async function crearPresupuesto() {
    if (!c) return;
    const anio = (c.fecha || hoyISO()).slice(0, 4);
    const nuevo = await presupuestosApi.crearPresupuesto({
      clienteId: null,
      obraId: c.obraId,
      numero: `P-${anio}-${String(Date.now()).slice(-4)}`,
      fecha: hoyISO(),
      estado: "borrador",
      margenPct: margenDefecto(),
      lineas: lineasParaPresupuesto(),
      disclaimers: [],
      notas: `Generado desde la factura de proveedor ${c.numero || ""}`.trim(),
    });
    setPresModal(false);
    toast.success(`Presupuesto creado con tu margen por defecto (${margenDefecto()}%)`);
    navigate(`/admin/presupuestos/${nuevo.id}`);
  }

  async function anadirAPresupuesto(pre: Presupuesto) {
    if (!c) return;
    await presupuestosApi.actualizarPresupuesto(pre.id, {
      lineas: [...pre.lineas, ...lineasParaPresupuesto()],
    });
    setPresModal(false);
    toast.success(`Líneas añadidas a ${pre.numero || "el presupuesto"}`);
    navigate(`/admin/presupuestos/${pre.id}`);
  }

  // Coste real por unidad: el neto (después de descuento) = total / cantidad.
  const costeNeto = (l: LineaCompra): number =>
    l.cantidad > 0 ? Math.round((l.total / l.cantidad) * 100) / 100 : l.precioUnitario;

  async function crearArticuloDesde(l: LineaCompra) {
    const nuevo = await catalogoApi.crearArticulo({
      referencia: "",
      nombre: l.descripcion || "Artículo",
      proveedorId: c?.proveedorId ?? null,
      categoria: "material",
      unidad: l.unidad || "ud",
      coste: costeNeto(l),
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
    const neto = costeNeto(l);
    if (art.coste !== neto && neto > 0) {
      const upd = await catalogoApi.actualizarArticulo(art.id, { coste: neto });
      setArticulos((a) => a.map((x) => (x.id === upd.id ? upd : x)));
    }
    if (l.articuloId !== art.id) updateLinea(l.id, { articuloId: art.id });
  }

  function updateLinea(lid_: string, patch: Partial<LineaCompra>) {
    setLineas(
      (c?.lineas ?? []).map((l) => {
        if (l.id !== lid_) return l;
        const merged = { ...l, ...patch };
        // Recalcular total si cambian cantidad/precio/descuento (salvo que
        // venga total explícito). total = cant × precio × (1 − dto/100).
        if (
          patch.total === undefined &&
          (patch.cantidad !== undefined ||
            patch.precioUnitario !== undefined ||
            patch.descuento !== undefined)
        ) {
          merged.total = r2(merged.cantidad * merged.precioUnitario * (1 - (merged.descuento ?? 0) / 100));
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
  const proveedorLabel = proveedores.find((p) => p.id === c.proveedorId)?.nombre ?? "—";
  const obraLabel = obras.find((o) => o.id === c.obraId)?.nombre ?? "—";
  const comboFieldCls = "field mt-1.5 flex w-full items-center justify-between text-left";

  return (
    <div className="space-y-5 pb-16">
      <Modal open={presModal} onClose={() => setPresModal(false)} title="Añadir a presupuesto">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se llevarán {c.lineas.length} línea{c.lineas.length === 1 ? "" : "s"} con tu margen por
            defecto ({margenDefecto()}%). Elige el destino:
          </p>
          <button onClick={crearPresupuesto} className="btn-primary w-full py-2.5 text-sm">
            <IconPlus className="h-4 w-4" /> Crear un presupuesto nuevo
          </button>
          <div>
            <p className="label mb-2">O añadir a uno en borrador</p>
            {presupuestos.length === 0 ? (
              <EmptyState titulo="Sin borradores" texto="No tienes presupuestos en borrador todavía." />
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {presupuestos.map((pre) => (
                  <button
                    key={pre.id}
                    onClick={() => anadirAPresupuesto(pre)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-border p-3 text-left text-sm hover:border-primary hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{pre.numero || "Sin número"}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {nombreClientePres(pre.clienteId)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {pre.lineas.length} línea{pre.lineas.length === 1 ? "" : "s"} · {pre.fecha}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/compras")}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-forge-dark"
        >
          <IconChevronLeft className="h-4 w-4" /> Facturas de proveedor
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">
            {guardando ? "Guardando…" : guardado ? "Guardado" : "Sin guardar"}
          </span>
          {c.lineas.length > 0 && (
            <button
              onClick={abrirDialogoPresupuesto}
              className="btn-ghost px-4 py-2 text-sm"
              title="Llevar estas líneas a un presupuesto de cliente con tu sobreprecio"
            >
              Añadir a presupuesto
            </button>
          )}
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
          {bloqueada ? (
            <div className="field mt-1.5 text-slate-500">{proveedorLabel}</div>
          ) : (
            <Combobox
              className={comboFieldCls}
              label={proveedorLabel}
              placeholder="Buscar proveedor…"
              items={[
                { id: "", label: "—" },
                ...proveedores.map((p) => ({ id: p.id, label: p.nombre })),
              ]}
              onPick={(id) => set({ proveedorId: id || null })}
            />
          )}
        </div>
        <div>
          <label className="label">Obra (coste real)</label>
          {bloqueada ? (
            <div className="field mt-1.5 text-slate-500">{obraLabel}</div>
          ) : (
            <Combobox
              className={comboFieldCls}
              label={obraLabel}
              placeholder="Buscar obra…"
              items={[
                { id: "", label: "—" },
                ...obras.map((o) => ({ id: o.id, label: o.nombre })),
              ]}
              onPick={(id) => set({ obraId: id || null })}
            />
          )}
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
                  { id: lid(), descripcion: "", cantidad: 1, unidad: "ud", precioUnitario: 0, descuento: 0, total: 0, articuloId: null },
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
            <table className="w-full min-w-[820px] table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-[68px]" />
                <col className="w-[62px]" />
                <col className="w-[86px]" />
                <col className="w-[64px]" />
                <col className="w-[92px]" />
                <col className="w-[230px]" />
                <col className="w-[38px]" />
              </colgroup>
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-2 py-2 text-left font-semibold">Descripción</th>
                  <th className="px-2 py-2 text-right font-semibold">Cant.</th>
                  <th className="px-2 py-2 text-left font-semibold">Ud</th>
                  <th className="px-2 py-2 text-right font-semibold">Precio</th>
                  <th className="px-2 py-2 text-right font-semibold">Dto %</th>
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
                          className="field w-full px-2 py-1.5"
                          value={l.descripcion}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { descripcion: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          className="field w-full px-2 py-1.5 text-right"
                          value={l.cantidad}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { cantidad: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="field w-full px-2 py-1.5"
                          value={l.unidad}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { unidad: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          className="field w-full px-2 py-1.5 text-right"
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
                          className="field w-full px-2 py-1.5 text-right"
                          value={l.descuento ?? 0}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { descuento: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          className="field w-full px-2 py-1.5 text-right"
                          value={l.total}
                          disabled={bloqueada}
                          onChange={(e) => updateLinea(l.id, { total: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <div className="flex items-center gap-1.5">
                          {bloqueada ? (
                            <span className="w-full truncate rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-500">
                              {art?.nombre ?? "— Sin mapear —"}
                            </span>
                          ) : (
                            <Combobox
                              className="flex w-full items-center justify-between gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left text-sm text-forge-dark hover:border-forge-orange"
                              label={art?.nombre ?? "— Sin mapear —"}
                              placeholder="Buscar artículo…"
                              items={[
                                { id: "", label: "— Sin mapear —" },
                                ...articulos.map((a) => ({ id: a.id, label: a.nombre })),
                              ]}
                              onPick={(id) => updateLinea(l.id, { articuloId: id || null })}
                            />
                          )}
                          {!bloqueada &&
                            (art == null ? (
                              <Tooltip label="Añadir al banco de precios">
                                <button
                                  onClick={() => sincronizarBanco(l)}
                                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-forge-orange hover:bg-orange-50"
                                >
                                  <IconPlus className="h-4 w-4" />
                                </button>
                              </Tooltip>
                            ) : art.coste !== costeNeto(l) ? (
                              <Tooltip label={`Actualizar en el banco: ${formatEuro(art.coste)} → ${formatEuro(costeNeto(l))}`}>
                                <button
                                  onClick={() => sincronizarBanco(l)}
                                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-amber-600 hover:bg-amber-50"
                                >
                                  <IconRefresh className="h-4 w-4" />
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip label="Ya está en el banco al mismo precio">
                                <span className="grid h-8 w-8 shrink-0 place-items-center text-green-500">
                                  <IconCheck className="h-4 w-4" />
                                </span>
                              </Tooltip>
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
