import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { recursosApi, usuariosApi, obrasApi } from "@/services";
import { confirmar } from "@/components/confirm";
import { errorDeTamano } from "@/lib/files";
import { importarHerramientas, type FilaHerramienta } from "@/lib/importar-herramientas";
import type { AlmacenItem, Herramienta, Usuario, Vehiculo, Obra } from "@/lib/types";
import { Badge, Cargando, EmptyState, Modal, ProgressBar, Spinner } from "@/components/ui";
import {
  IconTruck,
  IconWrench,
  IconWarehouse,
  IconPlus,
  IconDownload,
  IconTrash,
  IconEdit,
} from "@/components/icons";

type Tab = "vehiculos" | "herramientas" | "almacen";

export default function AdminRecursos({ tab }: { tab: Tab }) {
  if (tab === "vehiculos") return <Vehiculos />;
  if (tab === "herramientas") return <Herramientas />;
  return <Almacen />;
}

const VEHICULO_BADGE = { disponible: "green", en_uso: "amber", taller: "red" } as const;
const VEHICULO_LABEL = { disponible: "Disponible", en_uso: "En uso", taller: "En taller" };

function Vehiculos() {
  const [items, setItems] = useState<Vehiculo[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [editar, setEditar] = useState<Vehiculo | null>(null);
  const [nuevo, setNuevo] = useState(false);

  async function cargar() {
    setItems(await recursosApi.listVehiculos());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
    obrasApi.listObras().then(setObras);
  }, []);
  if (!items) return <Cargando />;
  const nombre = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre ?? "Sin asignar";
  const nombreObra = (id: string | null) => (id ? obras.find((o) => o.id === id)?.nombre ?? "—" : null);

  async function borrar(v: Vehiculo) {
    if (!(await confirmar({ titulo: "Eliminar vehículo", mensaje: `Se eliminará ${v.modelo} (${v.matricula}).`, peligro: true }))) return;
    await recursosApi.eliminarVehiculo(v.id);
    cargar();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} vehículos</p>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nuevo vehículo
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconTruck className="h-10 w-10" />}
          titulo="Sin vehículos"
          texto="Registra tus vehículos para poder asignarlos a obras."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((v) => (
            <div key={v.id} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-forge-dark/5 text-forge-dark">
                  <IconTruck className="h-6 w-6" />
                </span>
                <Badge color={VEHICULO_BADGE[v.estado]}>{VEHICULO_LABEL[v.estado]}</Badge>
              </div>
              <h3 className="mt-3 font-bold text-forge-dark">{v.modelo}</h3>
              <p className="font-mono text-sm text-slate-500">{v.matricula}</p>
              <p className="mt-2 text-sm text-slate-400">Conductor: {nombre(v.asignadoA)}</p>
              <p className="text-sm text-slate-400">
                Obra:{" "}
                {nombreObra(v.obraId) ? (
                  <span className="font-medium text-forge-dark">{nombreObra(v.obraId)}</span>
                ) : (
                  "Sin asignar"
                )}
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setEditar(v)} className="btn-ghost flex-1 px-3 py-2 text-sm">
                  <IconEdit className="h-4 w-4" /> Editar
                </button>
                <button
                  onClick={() => borrar(v)}
                  className="btn border border-slate-200 bg-white px-3 py-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Eliminar"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(nuevo || editar) && (
        <VehiculoForm
          vehiculo={editar}
          usuarios={usuarios}
          obras={obras}
          onClose={() => {
            setNuevo(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNuevo(false);
            setEditar(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}

/** Alta/edición de un vehículo, con conductor y obra asignada. */
function VehiculoForm({
  vehiculo,
  usuarios,
  obras,
  onClose,
  onSaved,
}: {
  vehiculo: Vehiculo | null;
  usuarios: Usuario[];
  obras: Obra[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [matricula, setMatricula] = useState(vehiculo?.matricula ?? "");
  const [modelo, setModelo] = useState(vehiculo?.modelo ?? "");
  const [estado, setEstado] = useState<Vehiculo["estado"]>(vehiculo?.estado ?? "disponible");
  const [asignadoA, setAsignadoA] = useState<string>(vehiculo?.asignadoA ?? "");
  const [obraId, setObraId] = useState<string>(vehiculo?.obraId ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conductores = usuarios.filter((u) => u.rol === "trabajador" && u.activo);

  async function guardar() {
    if (!matricula.trim()) return setError("La matrícula es obligatoria.");
    if (!modelo.trim()) return setError("El modelo es obligatorio.");
    setError(null);
    setGuardando(true);
    try {
      const payload = {
        matricula: matricula.trim().toUpperCase(),
        modelo: modelo.trim(),
        estado,
        asignadoA: asignadoA || null,
        obraId: obraId || null,
      };
      if (vehiculo) await recursosApi.actualizarVehiculo(vehiculo.id, payload);
      else await recursosApi.crearVehiculo(payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={vehiculo ? "Editar vehículo" : "Nuevo vehículo"}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Matrícula</label>
            <input
              className="field mt-1.5 uppercase"
              placeholder="1234 ABC"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Modelo</label>
            <input
              className="field mt-1.5"
              placeholder="Ford Transit"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            className="field mt-1.5"
            value={estado}
            onChange={(e) => setEstado(e.target.value as Vehiculo["estado"])}
          >
            <option value="disponible">Disponible</option>
            <option value="en_uso">En uso</option>
            <option value="taller">En taller</option>
          </select>
        </div>
        <div>
          <label className="label">Conductor (opcional)</label>
          <select className="field mt-1.5" value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)}>
            <option value="">Sin asignar</option>
            {conductores.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Obra asignada (opcional)</label>
          <select className="field mt-1.5" value={obraId} onChange={(e) => setObraId(e.target.value)}>
            <option value="">Sin asignar</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
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

function Herramientas() {
  const [items, setItems] = useState<Herramienta[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [importar, setImportar] = useState(false);
  const [editar, setEditar] = useState<Herramienta | null>(null);
  const [nueva, setNueva] = useState(false);

  async function cargar() {
    setItems(await recursosApi.listHerramientas());
  }
  useEffect(() => {
    cargar();
    obrasApi.listObras().then(setObras);
  }, []);
  if (!items) return <Cargando />;
  const ubic = (id: string) => (id === "almacen" ? "Almacén" : obras.find((o) => o.id === id)?.nombre ?? id);

  async function borrar(h: Herramienta) {
    if (!(await confirmar({ titulo: "Eliminar herramienta", mensaje: `Se eliminará "${h.nombre}".`, peligro: true }))) return;
    await recursosApi.eliminarHerramienta(h.id);
    cargar();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{items.length} herramientas</p>
        <div className="flex gap-2">
          <button onClick={() => setImportar(true)} className="btn-ghost px-4 py-2.5 text-sm">
            <IconDownload className="h-4 w-4" /> Importar (Excel/PDF/CSV)
          </button>
          <button onClick={() => setNueva(true)} className="btn-primary px-4 py-2.5 text-sm">
            <IconPlus className="h-4 w-4" /> Nueva
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconWrench className="h-10 w-10" />}
          titulo="Sin herramientas"
          texto="Añade herramientas a mano o impórtalas desde un Excel, PDF o CSV."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Herramienta</th>
                  <th className="px-4 py-3 font-semibold">Ubicación</th>
                  <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
                          <IconWrench className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-forge-dark">{h.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{ubic(h.ubicacion)}</td>
                    <td className="px-4 py-3 text-right font-bold text-forge-dark">{h.cantidad}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditar(h)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
                          aria-label="Editar"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => borrar(h)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Eliminar"
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

      {importar && (
        <ImportarHerramientasModal
          obras={obras}
          onClose={() => setImportar(false)}
          onImported={() => {
            setImportar(false);
            cargar();
          }}
        />
      )}
      {(nueva || editar) && (
        <HerramientaForm
          herramienta={editar}
          obras={obras}
          onClose={() => {
            setNueva(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNueva(false);
            setEditar(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}

/** Alta/edición manual de una herramienta. */
function HerramientaForm({
  herramienta,
  obras,
  onClose,
  onSaved,
}: {
  herramienta: Herramienta | null;
  obras: Obra[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(herramienta?.nombre ?? "");
  const [cantidad, setCantidad] = useState(String(herramienta?.cantidad ?? 1));
  const [ubicacion, setUbicacion] = useState(herramienta?.ubicacion ?? "almacen");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      const payload = { nombre: nombre.trim(), cantidad: Math.max(0, Number(cantidad) || 0), ubicacion };
      if (herramienta) await recursosApi.actualizarHerramienta(herramienta.id, payload);
      else await recursosApi.crearHerramienta(payload);
      onSaved();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={herramienta ? "Editar herramienta" : "Nueva herramienta"}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input className="field mt-1.5" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cantidad</label>
            <input
              type="number"
              min={0}
              className="field mt-1.5"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Ubicación</label>
            <select className="field mt-1.5" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}>
              <option value="almacen">Almacén</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
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

/** Importa herramientas desde Excel/PDF/CSV con tabla editable previa. */
function ImportarHerramientasModal({
  obras,
  onClose,
  onImported,
}: {
  obras: Obra[];
  onClose: () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<FilaHerramienta[]>([]);
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  /** Intenta casar el texto de ubicación importado con una obra por nombre. */
  function normalizarUbicacion(texto: string): string {
    const t = texto.trim().toLowerCase();
    if (!t || t === "almacen" || t === "almacén") return "almacen";
    const obra = obras.find((o) => o.nombre.toLowerCase() === t);
    return obra ? obra.id : "almacen";
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const err = errorDeTamano(file);
    if (err) return setError(err);
    setError(null);
    setLeyendo(true);
    setNombreArchivo(file.name);
    try {
      const detectadas = await importarHerramientas(file);
      if (detectadas.length === 0) {
        setError("No se reconoció ninguna herramienta en el archivo. Revisa el formato o añádelas a mano.");
      }
      setFilas(detectadas.map((f) => ({ ...f, ubicacion: normalizarUbicacion(f.ubicacion) })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setLeyendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function editarFila(id: string, patch: Partial<FilaHerramienta>) {
    setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function quitarFila(id: string) {
    setFilas((fs) => fs.filter((f) => f.id !== id));
  }

  async function guardar() {
    const validas = filas.filter((f) => f.nombre.trim());
    if (validas.length === 0) return;
    setGuardando(true);
    try {
      await recursosApi.crearHerramientas(
        validas.map((f) => ({
          nombre: f.nombre.trim(),
          cantidad: Math.max(0, Number(f.cantidad) || 0),
          ubicacion: f.ubicacion || "almacen",
        }))
      );
      toast.success(`${validas.length} herramientas importadas`);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Importar herramientas">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Sube un <b>Excel</b> (.xlsx), <b>PDF</b> o <b>CSV</b>. Detectamos nombre, cantidad y
          ubicación; revísalo antes de guardar. Columnas ideales: <i>Nombre, Cantidad, Ubicación</i>.
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
            accept=".xlsx,.xls,.csv,.txt,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {filas.length > 0 && (
          <>
            <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nombre</th>
                    <th className="px-3 py-2 font-semibold">Cant.</th>
                    <th className="px-3 py-2 font-semibold">Ubicación</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.map((f) => (
                    <tr key={f.id}>
                      <td className="px-2 py-1.5">
                        <input
                          className="field py-1.5"
                          value={f.nombre}
                          onChange={(e) => editarFila(f.id, { nombre: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          className="field w-20 py-1.5"
                          value={f.cantidad}
                          onChange={(e) => editarFila(f.id, { cantidad: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          className="field py-1.5"
                          value={f.ubicacion}
                          onChange={(e) => editarFila(f.id, { ubicacion: e.target.value })}
                        >
                          <option value="almacen">Almacén</option>
                          {obras.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => quitarFila(f.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Quitar"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400">{filas.length} herramientas listas para importar.</p>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || filas.length === 0}
            className="btn-primary flex-1"
          >
            {guardando ? <Spinner className="h-5 w-5" /> : `Importar ${filas.length || ""}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Almacen() {
  const [items, setItems] = useState<AlmacenItem[] | null>(null);
  useEffect(() => {
    recursosApi.listAlmacen().then(setItems);
  }, []);
  if (!items) return <Cargando />;

  if (items.length === 0)
    return <EmptyState icon={<IconWarehouse className="h-10 w-10" />} titulo="Almacén vacío" texto="Aún no hay material registrado en el almacén." />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((a) => {
        const pct = Math.min(100, Math.round((a.stock / (a.minimo * 2)) * 100));
        const bajo = a.stock < a.minimo;
        return (
          <div key={a.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-forge-orange/10 text-forge-orange">
                  <IconWarehouse className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-forge-dark">{a.nombre}</h3>
                  <p className="text-xs text-slate-400">Mínimo: {a.minimo} {a.unidad}</p>
                </div>
              </div>
              {bajo && <Badge color="red">STOCK BAJO</Badge>}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-400">Stock actual</span>
                <span className="font-bold text-forge-dark">{a.stock} {a.unidad}</span>
              </div>
              <ProgressBar value={pct} color={bajo ? "#DC2626" : "#16A34A"} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
