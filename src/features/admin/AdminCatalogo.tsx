import { useEffect, useMemo, useState } from "react";
import { catalogoApi } from "@/services";
import {
  CATEGORIAS_ARTICULO,
  costePartida,
  labelCategoria,
} from "@/lib/presupuestos-calc";
import { formatEuro } from "@/lib/format";
import { Badge, Cargando, Modal, Spinner } from "@/components/ui";
import { IconPlus, IconEdit, IconTrash } from "@/components/icons";
import type {
  Articulo,
  CategoriaArticulo,
  ComponentePartida,
  Partida,
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
  const [filtroProv, setFiltroProv] = useState<string>("");
  const provNombre = (id: string | null) =>
    id ? proveedores.find((p) => p.id === id)?.nombre ?? "—" : "—";

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
        <select
          className="field max-w-xs py-2 text-sm"
          value={filtroProv}
          onChange={(e) => setFiltroProv(e.target.value)}
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
          <option value="__none__">Sin proveedor</option>
        </select>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nuevo artículo
        </button>
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
                      <p className="font-semibold text-forge-dark">{a.nombre}</p>
                      {a.referencia && <p className="text-xs text-slate-400">Ref. {a.referencia}</p>}
                      {a.especificaciones && (
                        <p className="mt-0.5 text-xs italic text-slate-400">{a.especificaciones}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color="slate">{labelCategoria(a.categoria)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{provNombre(a.proveedorId)}</td>
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
    </div>
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
  const [especificaciones, setEspecificaciones] = useState(articulo?.especificaciones ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    try {
      const data = {
        nombre: nombre.trim(),
        referencia: referencia.trim(),
        categoria,
        unidad: unidad.trim() || "ud",
        coste: Number(coste) || 0,
        proveedorId: proveedorId || null,
        especificaciones: especificaciones.trim() || undefined,
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
            <select
              className="field mt-1.5"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
            >
              <option value="">—</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
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
            <select className="field flex-1" value={addId} onChange={(e) => setAddId(e.target.value)}>
              <option value="">— Añadir artículo —</option>
              {articulos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} ({formatEuro(a.coste)}/{a.unidad})
                </option>
              ))}
            </select>
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
