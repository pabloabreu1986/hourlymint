import { useEffect, useMemo, useRef, useState } from "react";
import { catalogoApi } from "@/services";
import {
  CATEGORIAS_ARTICULO,
  costePartida,
  labelCategoria,
} from "@/lib/presupuestos-calc";
import { formatEuro } from "@/lib/format";
import { errorDeTamano } from "@/lib/files";
import { importarCatalogo, type ArticuloImportado } from "@/lib/importar-catalogo";
import { toast } from "sonner";
import { Badge, Cargando, Modal, Spinner } from "@/components/ui";
import { confirmar } from "@/components/confirm";
import { Combobox } from "@/components/Combobox";
import { IconPlus, IconEdit, IconTrash, IconCamera, IconBox, IconDownload } from "@/components/icons";
import type {
  Articulo,
  CategoriaArticulo,
  ComponentePartida,
  Partida,
  PrecioProveedor,
  Proveedor,
} from "@/lib/types";

type Tab = "articulos" | "recetas" | "proveedores";

export default function AdminCatalogo() {
  const [tab, setTab] = useState<Tab>("articulos");
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const [a, p, pr] = await Promise.all([
      catalogoApi.listArticulos(),
      catalogoApi.listPartidas(),
      catalogoApi.listProveedores(),
    ]);
    setArticulos(a);
    setPartidas(p);
    setProveedores(pr);
    setCargando(false);
  }
  useEffect(() => {
    cargar();
  }, []);

  if (cargando) return <Cargando />;

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "articulos", label: "Artículos", n: articulos.length },
    { id: "recetas", label: "Packs", n: partidas.length },
    { id: "proveedores", label: "Proveedores", n: proveedores.length },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-forge-dark text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-forge-dark"
            }`}
          >
            {t.label} <span className="opacity-60">({t.n})</span>
          </button>
        ))}
      </div>

      {tab === "articulos" && (
        <ArticulosTab articulos={articulos} proveedores={proveedores} onCambio={cargar} />
      )}
      {tab === "recetas" && (
        <RecetasTab partidas={partidas} articulos={articulos} onCambio={cargar} />
      )}
      {tab === "proveedores" && <ProveedoresTab proveedores={proveedores} onCambio={cargar} />}
    </div>
  );
}

// ─────────────────────────── Artículos ───────────────────────────
function ArticulosTab({
  articulos,
  proveedores,
  onCambio,
}: {
  articulos: Articulo[];
  proveedores: Proveedor[];
  onCambio: () => void;
}) {
  const [editar, setEditar] = useState<Articulo | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [importar, setImportar] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [filtroProv, setFiltroProv] = useState<string>("");
  const provNombre = (id: string | null) =>
    id ? proveedores.find((p) => p.id === id)?.nombre ?? "—" : "—";

  async function exportarExcel() {
    setExportando(true);
    try {
      const XLSX: any = await import("xlsx");
      const provNames = [...new Set(articulos.flatMap((a) => (a.precios ?? []).map((p) => p.proveedor)))];
      const rows = articulos.map((a) => {
        const base: Record<string, unknown> = {
          Familia: a.familia ?? "",
          Artículo: a.nombre,
          Unidad: a.unidad,
          "Coste (s/IVA)": a.coste,
        };
        for (const pn of provNames) {
          const p = (a.precios ?? []).find((x) => x.proveedor === pn);
          base[`${pn} Ref`] = p?.referencia ?? "";
          base[`${pn} s/IVA`] = p?.precioSinIva ?? "";
          base[`${pn} c/IVA`] = p?.precioConIva ?? "";
        }
        return base;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Productos");
      XLSX.writeFile(wb, "catalogo-productos.xlsx");
    } finally {
      setExportando(false);
    }
  }

  const visibles = articulos.filter((a) =>
    filtroProv === ""
      ? true
      : filtroProv === "__none__"
        ? !a.proveedorId
        : a.proveedorId === filtroProv
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Combobox
          className="field flex max-w-xs items-center justify-between py-2 text-left text-sm"
          label={
            filtroProv === ""
              ? "Todos los proveedores"
              : filtroProv === "__none__"
                ? "Sin proveedor"
                : proveedores.find((p) => p.id === filtroProv)?.nombre ?? "Todos los proveedores"
          }
          placeholder="Buscar proveedor…"
          items={[
            { id: "", label: "Todos los proveedores" },
            ...proveedores.map((p) => ({ id: p.id, label: p.nombre })),
            { id: "__none__", label: "Sin proveedor" },
          ]}
          onPick={(id) => setFiltroProv(id)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setImportar(true)} className="btn-ghost px-3 py-2.5 text-sm">
            <IconDownload className="h-4 w-4" /> Importar Excel
          </button>
          <button
            onClick={exportarExcel}
            disabled={exportando || articulos.length === 0}
            className="btn-ghost px-3 py-2.5 text-sm disabled:opacity-50"
          >
            {exportando ? <Spinner className="h-4 w-4" /> : <IconEdit className="h-4 w-4" />} Exportar Excel
          </button>
          <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
            <IconPlus className="h-4 w-4" /> Nuevo artículo
          </button>
        </div>
      </div>
      {articulos.length === 0 ? (
        <Vacio texto="Sin artículos. Añade materiales, mano de obra o maquinaria con su coste." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Artículo</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Proveedor</th>
                  <th className="px-4 py-3 font-semibold">Unidad</th>
                  <th className="px-4 py-3 text-right font-semibold">Coste</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                      Ningún artículo de este proveedor.
                    </td>
                  </tr>
                )}
                {visibles.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
                          {a.imagen ? (
                            <img src={a.imagen} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <IconBox className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-forge-dark">{a.nombre}</p>
                            {a.familia && <Badge color="slate">{a.familia}</Badge>}
                          </div>
                          {a.referencia && <p className="text-xs text-slate-400">Ref. {a.referencia}</p>}
                          {a.especificaciones && (
                            <p className="mt-0.5 text-xs italic text-slate-400">{a.especificaciones}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color="slate">{labelCategoria(a.categoria)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {a.precios && a.precios.length > 0 ? (
                        <div className="space-y-0.5">
                          {(() => {
                            const min = Math.min(
                              ...a.precios.filter((p) => p.precioSinIva != null).map((p) => p.precioSinIva as number)
                            );
                            return a.precios.map((p, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-600">{p.proveedor || "—"}</span>
                                <span
                                  className={`font-semibold ${
                                    p.precioSinIva === min ? "text-green-600" : "text-slate-400"
                                  }`}
                                >
                                  {p.precioSinIva != null ? formatEuro(p.precioSinIva) : "—"}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      ) : (
                        provNombre(a.proveedorId)
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{a.unidad}</td>
                    <td className="px-4 py-3 text-right font-semibold text-forge-dark">
                      {formatEuro(a.coste)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditar(a)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!(await confirmar({ titulo: "Eliminar artículo", mensaje: `Se eliminará "${a.nombre}" del banco de precios.` }))) return;
                            await catalogoApi.eliminarArticulo(a.id);
                            onCambio();
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(nuevo || editar) && (
        <ArticuloForm
          articulo={editar}
          proveedores={proveedores}
          onClose={() => {
            setNuevo(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNuevo(false);
            setEditar(null);
            onCambio();
          }}
        />
      )}
      {importar && (
        <ImportarCatalogoModal
          onClose={() => setImportar(false)}
          onImported={() => {
            setImportar(false);
            onCambio();
          }}
        />
      )}
    </div>
  );
}

/** Importa el Excel de materiales (todas las pestañas) al banco de precios. */
function ImportarCatalogoModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ArticuloImportado[] | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const err = errorDeTamano(file);
    if (err) return setError(err);
    setError(null);
    setLeyendo(true);
    setNombreArchivo(file.name);
    try {
      const parsed = await importarCatalogo(file);
      if (parsed.length === 0) setError("No se reconoció ningún producto. Revisa el formato del Excel.");
      setItems(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setLeyendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function guardar() {
    if (!items || items.length === 0) return;
    setGuardando(true);
    try {
      await catalogoApi.crearArticulos(items.map((a) => ({ ...a, proveedorId: null })));
      toast.success(`${items.length} productos importados`);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar.");
    } finally {
      setGuardando(false);
    }
  }

  // Recuento por familia (pestaña).
  const porFamilia = (items ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.familia] = (acc[a.familia] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Modal open onClose={onClose} title="Importar catálogo desde Excel">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Sube el <b>.xlsx</b> de materiales. Se leen <b>todas las pestañas</b> (cada una es una
          familia) y los <b>precios por proveedor</b> (Obramat, Leroy Merlin…). Las fotos incrustadas
          no se importan aquí: se pegan luego en cada producto.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={leyendo}
            className="btn-ghost px-4 py-2.5 text-sm"
          >
            {leyendo ? <Spinner className="h-4 w-4" /> : <IconDownload className="h-4 w-4" />}
            {leyendo ? "Leyendo…" : nombreArchivo ? "Cambiar archivo" : "Elegir archivo"}
          </button>
          {nombreArchivo && <span className="truncate text-xs text-slate-400">{nombreArchivo}</span>}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {items && items.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-forge-dark">
              {items.length} productos en {Object.keys(porFamilia).length} familias
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(porFamilia).map(([fam, n]) => (
                <Badge key={fam} color="slate">
                  {fam} ({n})
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || !items || items.length === 0}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {guardando ? <Spinner className="h-5 w-5" /> : `Importar ${items?.length || ""}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ArticuloForm({
  articulo,
  proveedores,
  onClose,
  onSaved,
}: {
  articulo: Articulo | null;
  proveedores: Proveedor[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(articulo?.nombre ?? "");
  const [referencia, setReferencia] = useState(articulo?.referencia ?? "");
  const [categoria, setCategoria] = useState<CategoriaArticulo>(articulo?.categoria ?? "material");
  const [unidad, setUnidad] = useState(articulo?.unidad ?? "ud");
  const [coste, setCoste] = useState(articulo ? String(articulo.coste) : "");
  const [proveedorId, setProveedorId] = useState(articulo?.proveedorId ?? "");
  const [familia, setFamilia] = useState(articulo?.familia ?? "");
  const [precios, setPrecios] = useState<PrecioProveedor[]>(articulo?.precios ?? []);
  const [especificaciones, setEspecificaciones] = useState(articulo?.especificaciones ?? "");
  const [imagen, setImagen] = useState<string | null>(articulo?.imagen ?? null);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function subirImagen(file: File | Blob) {
    if (file instanceof File) {
      const err = errorDeTamano(file);
      if (err) return setError(err);
    }
    setError(null);
    setSubiendoImg(true);
    try {
      setImagen(await catalogoApi.subirImagenArticulo(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendoImg(false);
    }
  }

  /** Pegar (Ctrl+V): imagen del portapapeles (p. ej. copiada de Obramat) o,
   *  si es texto, una URL de imagen directa. */
  async function onPaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items ?? []);
    const img = items.find((it) => it.type.startsWith("image/"));
    if (img) {
      e.preventDefault();
      const file = img.getAsFile();
      if (file) await subirImagen(file);
      return;
    }
    const texto = e.clipboardData?.getData("text")?.trim();
    if (texto && /^https?:\/\/\S+/i.test(texto)) {
      e.preventDefault();
      setImagen(texto);
    }
  }

  function setPrecio(i: number, patch: Partial<PrecioProveedor>) {
    setPrecios((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function addPrecio() {
    setPrecios((ps) => [...ps, { proveedor: "", referencia: "", precioSinIva: null, precioConIva: null }]);
  }
  function quitarPrecio(i: number) {
    setPrecios((ps) => ps.filter((_, idx) => idx !== i));
  }
  /** Copia al coste el precio sin IVA más barato de los proveedores. */
  function usarMasBarato() {
    const conPrecio = precios.filter((p) => p.precioSinIva != null);
    if (!conPrecio.length) return;
    const min = Math.min(...conPrecio.map((p) => p.precioSinIva as number));
    setCoste(String(min));
    const barato = conPrecio.find((p) => p.precioSinIva === min);
    if (barato?.referencia) setReferencia(barato.referencia);
  }

  async function guardar() {
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    try {
      const preciosLimpios = precios.filter((p) => p.proveedor.trim() || p.referencia.trim());
      const data = {
        nombre: nombre.trim(),
        referencia: referencia.trim(),
        categoria,
        familia: familia.trim() || undefined,
        unidad: unidad.trim() || "ud",
        coste: Number(coste) || 0,
        precios: preciosLimpios.length ? preciosLimpios : undefined,
        proveedorId: proveedorId || null,
        especificaciones: especificaciones.trim() || undefined,
        imagen: imagen ?? null,
      };
      if (articulo) await catalogoApi.actualizarArticulo(articulo.id, data);
      else await catalogoApi.crearArticulo(data);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={articulo ? "Editar artículo" : "Nuevo artículo"}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input className="field mt-1.5" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        {/* Foto del producto: pegar (Ctrl+V) desde la web del proveedor, subir o URL */}
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Foto del producto</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-semibold text-forge-orange hover:underline"
              >
                Subir archivo
              </button>
              {imagen && (
                <button
                  type="button"
                  onClick={() => setImagen(null)}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
          <div
            tabIndex={0}
            onPaste={onPaste}
            className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-3 outline-none focus:border-forge-orange focus:ring-2 focus:ring-forge-orange/20"
            onClick={() => !imagen && fileRef.current?.click()}
          >
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
              {subiendoImg ? (
                <Spinner className="h-5 w-5 text-slate-400" />
              ) : imagen ? (
                <img src={imagen} alt="" className="h-full w-full object-cover" />
              ) : (
                <IconBox className="h-7 w-7 text-slate-300" />
              )}
            </div>
            <div className="min-w-0 text-sm text-slate-500">
              <p className="font-semibold text-forge-dark">
                <IconCamera className="mr-1 inline h-4 w-4 text-forge-orange" />
                Pega la foto aquí (Ctrl+V)
              </p>
              <p className="mt-0.5 text-xs">
                Copia la imagen desde la web del proveedor (Obramat…) con “Copiar imagen” y pégala
                aquí. También puedes subir un archivo o pegar una URL de imagen.
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subirImagen(f);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Referencia</label>
            <input
              className="field mt-1.5"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="field mt-1.5"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaArticulo)}
            >
              {CATEGORIAS_ARTICULO.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Unidad</label>
            <input
              className="field mt-1.5"
              placeholder="ud, m², ml, h…"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Coste (€)</label>
            <input
              type="number"
              className="field mt-1.5"
              value={coste}
              onChange={(e) => setCoste(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Proveedor</label>
            <Combobox
              className="field mt-1.5 flex w-full items-center justify-between text-left"
              label={proveedores.find((p) => p.id === proveedorId)?.nombre ?? "—"}
              placeholder="Buscar proveedor…"
              items={[
                { id: "", label: "—" },
                ...proveedores.map((p) => ({ id: p.id, label: p.nombre })),
              ]}
              onPick={(id) => setProveedorId(id)}
            />
          </div>
        </div>
        <div>
          <label className="label">Familia / gremio</label>
          <input
            className="field mt-1.5"
            placeholder="Baños, Fontanería, Electricidad…"
            value={familia}
            onChange={(e) => setFamilia(e.target.value)}
          />
        </div>

        {/* Precios por proveedor (comparativa Obramat / Leroy Merlin…) */}
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Precios por proveedor</label>
            <div className="flex items-center gap-3">
              {precios.some((p) => p.precioSinIva != null) && (
                <button
                  type="button"
                  onClick={usarMasBarato}
                  className="text-xs font-semibold text-forge-orange hover:underline"
                >
                  Coste = más barato
                </button>
              )}
              <button
                type="button"
                onClick={addPrecio}
                className="text-xs font-semibold text-forge-orange hover:underline"
              >
                + Añadir proveedor
              </button>
            </div>
          </div>
          {precios.length === 0 ? (
            <p className="mt-1 text-xs text-slate-400">
              Sin proveedores. Añade Obramat, Leroy Merlin… con su referencia y precio.
            </p>
          ) : (
            <div className="mt-1.5 space-y-2">
              {precios.map((p, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-1.5">
                  <input
                    className="field col-span-3 py-1.5"
                    placeholder="Proveedor"
                    value={p.proveedor}
                    onChange={(e) => setPrecio(i, { proveedor: e.target.value })}
                  />
                  <input
                    className="field col-span-3 py-1.5"
                    placeholder="Referencia"
                    value={p.referencia}
                    onChange={(e) => setPrecio(i, { referencia: e.target.value })}
                  />
                  <input
                    type="number"
                    className="field col-span-2 py-1.5"
                    placeholder="s/IVA"
                    value={p.precioSinIva ?? ""}
                    onChange={(e) =>
                      setPrecio(i, { precioSinIva: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                  <input
                    type="number"
                    className="field col-span-2 py-1.5"
                    placeholder="c/IVA"
                    value={p.precioConIva ?? ""}
                    onChange={(e) =>
                      setPrecio(i, { precioConIva: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => quitarPrecio(i)}
                    className="col-span-2 grid h-8 place-items-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Quitar proveedor"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label">Ficha técnica / especificaciones</label>
            {(nombre.trim() || referencia.trim()) && (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${nombre} ${referencia} ficha técnica`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-forge-orange hover:underline"
              >
                Buscar en la web ↗
              </a>
            )}
          </div>
          <textarea
            className="field mt-1.5"
            rows={2}
            placeholder="Fabricante, medidas, espesor, normas… (la IA lo rellena al escanear facturas)"
            value={especificaciones}
            onChange={(e) => setEspecificaciones(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex-1">
            {guardando ? <Spinner className="h-5 w-5" /> : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────── Recetas ───────────────────────────
function RecetasTab({
  partidas,
  articulos,
  onCambio,
}: {
  partidas: Partida[];
  articulos: Articulo[];
  onCambio: () => void;
}) {
  const [editar, setEditar] = useState<Partida | null>(null);
  const [nuevo, setNuevo] = useState(false);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Packs: agrupan materiales y mano de obra (baño, cocina, fontanería, electricidad…) para
          soltarlos de golpe en un presupuesto.
        </p>
        <button
          onClick={() => setNuevo(true)}
          disabled={articulos.length === 0}
          className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
          title={articulos.length === 0 ? "Crea antes artículos" : undefined}
        >
          <IconPlus className="h-4 w-4" /> Nuevo pack
        </button>
      </div>
      {partidas.length === 0 ? (
        <Vacio texto="Sin packs. Agrupa artículos (baño, cocina, fontanería…) para añadirlos de golpe a un presupuesto." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {partidas.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-forge-dark">{p.nombre}</p>
                  <p className="text-xs text-slate-400">
                    por {p.unidad} · {p.componentes.length} componentes
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditar(p)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!(await confirmar({ titulo: "Eliminar pack", mensaje: `Se eliminará el pack "${p.nombre}".` }))) return;
                      await catalogoApi.eliminarPartida(p.id);
                      onCambio();
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">Coste por {p.unidad}</span>
                <span className="font-bold text-forge-dark">
                  {formatEuro(costePartida(p, articulos))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(nuevo || editar) && (
        <RecetaForm
          partida={editar}
          articulos={articulos}
          onClose={() => {
            setNuevo(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNuevo(false);
            setEditar(null);
            onCambio();
          }}
        />
      )}
    </div>
  );
}

function RecetaForm({
  partida,
  articulos,
  onClose,
  onSaved,
}: {
  partida: Partida | null;
  articulos: Articulo[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(partida?.nombre ?? "");
  const [unidad, setUnidad] = useState(partida?.unidad ?? "ud");
  const [descripcion, setDescripcion] = useState(partida?.descripcion ?? "");
  const [componentes, setComponentes] = useState<ComponentePartida[]>(partida?.componentes ?? []);
  const [addId, setAddId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(articulos.map((a) => [a.id, a])), [articulos]);
  const coste = componentes.reduce((s, c) => {
    const a = byId.get(c.articuloId);
    return s + (a ? a.coste * c.cantidad : 0);
  }, 0);

  function addComponente() {
    if (!addId) return;
    if (componentes.some((c) => c.articuloId === addId)) return;
    setComponentes((cs) => [
      ...cs,
      { id: `c_${addId}_${cs.length}`, articuloId: addId, cantidad: 1 },
    ]);
    setAddId("");
  }

  async function guardar() {
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    try {
      const data = {
        nombre: nombre.trim(),
        unidad: unidad.trim() || "ud",
        descripcion: descripcion.trim(),
        componentes,
      };
      if (partida) await catalogoApi.actualizarPartida(partida.id, data);
      else await catalogoApi.crearPartida(data);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={partida ? "Editar pack" : "Nuevo pack"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">Nombre</label>
            <input
              className="field mt-1.5"
              placeholder="Baño 4×4 con plato de ducha"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Unidad</label>
            <input className="field mt-1.5" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Descripción (opcional)</label>
          <input
            className="field mt-1.5"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <label className="label">Componentes</label>
          <div className="mt-2 flex gap-2">
            <Combobox
              className="field flex flex-1 items-center justify-between text-left"
              label={(() => {
                const a = articulos.find((x) => x.id === addId);
                return a ? `${a.nombre} (${formatEuro(a.coste)}/${a.unidad})` : "— Añadir artículo —";
              })()}
              placeholder="Buscar artículo…"
              items={[
                { id: "", label: "— Añadir artículo —" },
                ...articulos.map((a) => ({ id: a.id, label: `${a.nombre} (${formatEuro(a.coste)}/${a.unidad})` })),
              ]}
              onPick={(id) => setAddId(id)}
            />
            <button onClick={addComponente} className="btn-ghost px-3 py-2 text-sm">
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {componentes.length === 0 && (
              <p className="text-xs text-slate-400">Sin componentes todavía.</p>
            )}
            {componentes.map((c) => {
              const a = byId.get(c.articuloId);
              return (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-forge-dark">{a?.nombre ?? "—"}</span>
                  <input
                    type="number"
                    className="field w-24 py-1.5"
                    value={c.cantidad}
                    onChange={(e) =>
                      setComponentes((cs) =>
                        cs.map((x) =>
                          x.id === c.id ? { ...x, cantidad: Number(e.target.value) || 0 } : x
                        )
                      )
                    }
                  />
                  <span className="w-12 text-xs text-slate-400">{a?.unidad}</span>
                  <span className="w-24 text-right font-medium text-forge-dark">
                    {formatEuro((a?.coste ?? 0) * c.cantidad)}
                  </span>
                  <button
                    onClick={() => setComponentes((cs) => cs.filter((x) => x.id !== c.id))}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-sm text-slate-500">Coste por {unidad || "ud"}</span>
            <span className="font-bold text-forge-dark">{formatEuro(coste)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex-1">
            {guardando ? <Spinner className="h-5 w-5" /> : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────── Proveedores ───────────────────────────
function ProveedoresTab({
  proveedores,
  onCambio,
}: {
  proveedores: Proveedor[];
  onCambio: () => void;
}) {
  const [editar, setEditar] = useState<Proveedor | null>(null);
  const [nuevo, setNuevo] = useState(false);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nuevo proveedor
        </button>
      </div>
      {proveedores.length === 0 ? (
        <Vacio texto="Sin proveedores (Obramat, Leroy Merlin, Bauhaus…)." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {proveedores.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-forge-dark">{p.nombre}</p>
                  <p className="truncate text-xs text-slate-400">
                    {[p.telefono, p.email].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setEditar(p)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!(await confirmar({ titulo: "Eliminar proveedor", mensaje: `Se eliminará "${p.nombre}".` }))) return;
                      await catalogoApi.eliminarProveedor(p.id);
                      onCambio();
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(nuevo || editar) && (
        <ProveedorForm
          proveedor={editar}
          onClose={() => {
            setNuevo(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNuevo(false);
            setEditar(null);
            onCambio();
          }}
        />
      )}
    </div>
  );
}

function ProveedorForm({
  proveedor,
  onClose,
  onSaved,
}: {
  proveedor: Proveedor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState({
    nombre: proveedor?.nombre ?? "",
    cif: proveedor?.cif ?? "",
    telefono: proveedor?.telefono ?? "",
    email: proveedor?.email ?? "",
    notas: proveedor?.notas ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!d.nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    try {
      if (proveedor) await catalogoApi.actualizarProveedor(proveedor.id, d);
      else await catalogoApi.crearProveedor(d);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={proveedor ? "Editar proveedor" : "Nuevo proveedor"}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input
            className="field mt-1.5"
            value={d.nombre}
            onChange={(e) => setD({ ...d, nombre: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">CIF</label>
            <input className="field mt-1.5" value={d.cif} onChange={(e) => setD({ ...d, cif: e.target.value })} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="field mt-1.5"
              value={d.telefono}
              onChange={(e) => setD({ ...d, telefono: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="field mt-1.5" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Notas</label>
          <textarea
            className="field mt-1.5"
            rows={2}
            value={d.notas}
            onChange={(e) => setD({ ...d, notas: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex-1">
            {guardando ? <Spinner className="h-5 w-5" /> : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="card grid place-items-center gap-2 py-14 text-center">
      <p className="max-w-sm text-sm text-slate-400">{texto}</p>
    </div>
  );
}
