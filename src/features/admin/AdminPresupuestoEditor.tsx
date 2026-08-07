import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  presupuestosApi,
  clientesApi,
  obrasApi,
  catalogoApi,
  usuariosApi,
} from "@/services";
import {
  costePartida,
  totalesLinea,
  totalesPresupuesto,
  ESTADOS_PRESUPUESTO,
} from "@/lib/presupuestos-calc";
import { formatEuro } from "@/lib/format";
import { Cargando } from "@/components/ui";
import {
  IconChevronLeft,
  IconPlus,
  IconTrash,
  IconClipboard,
} from "@/components/icons";
import type {
  Articulo,
  Cliente,
  LineaPresupuesto,
  Obra,
  Partida,
  PlantillaDisclaimer,
  Presupuesto,
  Usuario,
} from "@/lib/types";

let seq = 0;
const lid = () => `l_${Date.now().toString(36)}_${seq++}`;

export default function AdminPresupuestoEditor() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [p, setP] = useState<Presupuesto | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaDisclaimer[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(true);

  useEffect(() => {
    (async () => {
      const [pre, cs, os, ar, pa, us, pl] = await Promise.all([
        presupuestosApi.getPresupuesto(id),
        clientesApi.listClientes(),
        obrasApi.listObras(),
        catalogoApi.listArticulos(),
        catalogoApi.listPartidas(),
        usuariosApi.listUsuarios(),
        presupuestosApi.listDisclaimers(),
      ]);
      setP(pre);
      setClientes(cs);
      setObras(os);
      setArticulos(ar);
      setPartidas(pa);
      setUsuarios(us);
      setPlantillas(pl);
      setCargando(false);
    })();
  }, [id]);

  const byArt = useMemo(() => new Map(articulos.map((a) => [a.id, a])), [articulos]);

  function set(patch: Partial<Presupuesto>) {
    setP((prev) => (prev ? { ...prev, ...patch } : prev));
    setGuardado(false);
  }
  function setLineas(lineas: LineaPresupuesto[]) {
    set({ lineas });
  }

  async function guardar(): Promise<Presupuesto | null> {
    if (!p) return null;
    setGuardando(true);
    try {
      const saved = await presupuestosApi.actualizarPresupuesto(p.id, p);
      setGuardado(true);
      return saved;
    } finally {
      setGuardando(false);
    }
  }

  async function verPDF() {
    await guardar();
    window.open(`/presupuesto/${id}`, "_blank");
  }

  if (cargando) return <Cargando />;
  if (!p) {
    return (
      <div className="card p-8 text-center text-slate-500">
        Presupuesto no encontrado.{" "}
        <button onClick={() => navigate("/admin/presupuestos")} className="text-forge-orange underline">
          Volver
        </button>
      </div>
    );
  }

  const obrasCliente = obras.filter((o) => o.clienteId === p.clienteId);
  const tot = totalesPresupuesto(p);

  // ── Añadir líneas ──
  function addArticulo(art: Articulo) {
    setLineas([
      ...p!.lineas,
      {
        id: lid(),
        tipo: "articulo",
        refId: art.id,
        concepto: art.nombre,
        unidad: art.unidad,
        cantidad: 1,
        costeUnitario: art.coste,
        margenPct: null,
      },
    ]);
  }
  function addPartida(part: Partida) {
    setLineas([
      ...p!.lineas,
      {
        id: lid(),
        tipo: "partida",
        refId: part.id,
        concepto: part.nombre,
        unidad: part.unidad,
        cantidad: 1,
        costeUnitario: costePartida(part, articulos),
        margenPct: null,
      },
    ]);
  }
  function addManoObra(u: Usuario) {
    setLineas([
      ...p!.lineas,
      {
        id: lid(),
        tipo: "mano_obra",
        refId: u.id,
        concepto: `Mano de obra · ${u.nombre}`,
        unidad: "h",
        cantidad: 1,
        costeUnitario: u.costeHora ?? 0,
        margenPct: null,
      },
    ]);
  }
  function addLibre() {
    setLineas([
      ...p!.lineas,
      { id: lid(), tipo: "libre", refId: null, concepto: "", unidad: "ud", cantidad: 1, costeUnitario: 0, margenPct: null },
    ]);
  }
  function updateLinea(lid_: string, patch: Partial<LineaPresupuesto>) {
    setLineas(p!.lineas.map((l) => (l.id === lid_ ? { ...l, ...patch } : l)));
  }
  function delLinea(lid_: string) {
    setLineas(p!.lineas.filter((l) => l.id !== lid_));
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/presupuestos")}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-forge-dark"
        >
          <IconChevronLeft className="h-4 w-4" /> Presupuestos
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {guardando ? "Guardando…" : guardado ? "Guardado" : "Sin guardar"}
          </span>
          <button onClick={guardar} disabled={guardando} className="btn-ghost px-4 py-2 text-sm">
            Guardar
          </button>
          <button onClick={verPDF} className="btn-primary px-4 py-2 text-sm">
            <IconClipboard className="h-4 w-4" /> Ver / PDF
          </button>
        </div>
      </div>

      {/* Datos del presupuesto */}
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">Nº</label>
          <input className="field mt-1.5" value={p.numero} onChange={(e) => set({ numero: e.target.value })} />
        </div>
        <div>
          <label className="label">Fecha</label>
          <input
            type="date"
            className="field mt-1.5"
            value={p.fecha}
            onChange={(e) => set({ fecha: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            className="field mt-1.5"
            value={p.estado}
            onChange={(e) => set({ estado: e.target.value as Presupuesto["estado"] })}
          >
            {ESTADOS_PRESUPUESTO.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cliente</label>
          <select
            className="field mt-1.5"
            value={p.clienteId ?? ""}
            onChange={(e) => set({ clienteId: e.target.value || null, obraId: null })}
          >
            <option value="">— Sin asignar —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellidos}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Obra</label>
          <select
            className="field mt-1.5"
            value={p.obraId ?? ""}
            onChange={(e) => set({ obraId: e.target.value || null })}
          >
            <option value="">— General —</option>
            {obrasCliente.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Margen por defecto (%)</label>
          <input
            type="number"
            className="field mt-1.5"
            value={p.margenPct}
            onChange={(e) => set({ margenPct: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* Líneas */}
      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-bold text-forge-dark">Líneas</h3>
          <AddDropdown label="+ Artículo" items={articulos.map((a) => ({ id: a.id, label: `${a.nombre} · ${formatEuro(a.coste)}/${a.unidad}` }))} onPick={(id) => { const a = byArt.get(id); if (a) addArticulo(a); }} />
          <AddDropdown label="+ Receta" items={partidas.map((pa) => ({ id: pa.id, label: `${pa.nombre} · ${formatEuro(costePartida(pa, articulos))}/${pa.unidad}` }))} onPick={(id) => { const pa = partidas.find((x) => x.id === id); if (pa) addPartida(pa); }} />
          <AddDropdown label="+ Mano de obra" items={usuarios.map((u) => ({ id: u.id, label: `${u.nombre} · ${formatEuro(u.costeHora ?? 0)}/h` }))} onPick={(id) => { const u = usuarios.find((x) => x.id === id); if (u) addManoObra(u); }} />
          <button onClick={addLibre} className="btn-ghost px-3 py-1.5 text-sm">+ Línea libre</button>
        </div>

        {p.lineas.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Añade líneas desde tu banco de precios o crea líneas libres.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-2 font-semibold">Concepto</th>
                  <th className="py-2 px-2 font-semibold">Ud</th>
                  <th className="py-2 px-2 text-right font-semibold">Cant.</th>
                  <th className="py-2 px-2 text-right font-semibold">Coste ud</th>
                  <th className="py-2 px-2 text-right font-semibold">Margen</th>
                  <th className="py-2 px-2 text-right font-semibold">PVP ud</th>
                  <th className="py-2 px-2 text-right font-semibold">Total</th>
                  <th className="py-2 pl-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {p.lineas.map((l) => {
                  const t = totalesLinea(l, p.margenPct);
                  return (
                    <tr key={l.id}>
                      <td className="py-1.5 pr-2">
                        <input
                          className="field w-full min-w-[180px] py-1.5"
                          value={l.concepto}
                          onChange={(e) => updateLinea(l.id, { concepto: e.target.value })}
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          className="field w-16 py-1.5"
                          value={l.unidad}
                          onChange={(e) => updateLinea(l.id, { unidad: e.target.value })}
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          className="field w-20 py-1.5 text-right"
                          value={l.cantidad}
                          onChange={(e) => updateLinea(l.id, { cantidad: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          className="field w-24 py-1.5 text-right"
                          value={l.costeUnitario}
                          onChange={(e) => updateLinea(l.id, { costeUnitario: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          className="field w-16 py-1.5 text-right"
                          placeholder={String(p.margenPct)}
                          value={l.margenPct ?? ""}
                          onChange={(e) =>
                            updateLinea(l.id, {
                              margenPct: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-500">{formatEuro(t.pvpUnitario)}</td>
                      <td className="py-1.5 px-2 text-right font-semibold text-forge-dark">
                        {formatEuro(t.pvpTotal)}
                      </td>
                      <td className="py-1.5 pl-2 text-right">
                        <button
                          onClick={() => delLinea(l.id)}
                          className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales */}
        <div className="mt-4 flex flex-wrap justify-end gap-6 border-t border-slate-100 pt-3 text-sm">
          <Tot label="Coste" valor={formatEuro(tot.coste)} />
          <Tot label="Beneficio" valor={formatEuro(tot.beneficio)} tono="verde" />
          <Tot label={`PVP (margen ${tot.margenEfectivo}%)`} valor={formatEuro(tot.pvp)} grande />
        </div>
      </div>

      {/* Disclaimers */}
      <Disclaimers
        disclaimers={p.disclaimers}
        plantillas={plantillas}
        onChange={(ds) => set({ disclaimers: ds })}
        onNuevaPlantilla={async (titulo, texto) => {
          await presupuestosApi.crearDisclaimer({ titulo, texto });
          setPlantillas(await presupuestosApi.listDisclaimers());
        }}
      />

      {/* Notas */}
      <div className="card p-4">
        <label className="label">Notas internas</label>
        <textarea
          className="field mt-1.5"
          rows={2}
          value={p.notas}
          onChange={(e) => set({ notas: e.target.value })}
        />
      </div>
    </div>
  );
}

function Tot({ label, valor, tono, grande }: { label: string; valor: string; tono?: "verde"; grande?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`font-extrabold ${grande ? "text-xl" : "text-base"} ${
          tono === "verde" ? "text-green-600" : "text-forge-dark"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function AddDropdown({
  label,
  items,
  onPick,
}: {
  label: string;
  items: { id: string; label: string }[];
  onPick: (id: string) => void;
}) {
  return (
    <select
      className="btn-ghost cursor-pointer px-3 py-1.5 text-sm"
      value=""
      onChange={(e) => {
        if (e.target.value) onPick(e.target.value);
        e.target.value = "";
      }}
    >
      <option value="">{label}</option>
      {items.map((it) => (
        <option key={it.id} value={it.id}>
          {it.label}
        </option>
      ))}
    </select>
  );
}

function Disclaimers({
  disclaimers,
  plantillas,
  onChange,
  onNuevaPlantilla,
}: {
  disclaimers: string[];
  plantillas: PlantillaDisclaimer[];
  onChange: (ds: string[]) => void;
  onNuevaPlantilla: (titulo: string, texto: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState("");

  return (
    <div className="card p-4">
      <h3 className="mb-2 font-bold text-forge-dark">Avisos / disclaimers</h3>
      <div className="space-y-2">
        {disclaimers.map((d, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 text-slate-600">{d}</span>
            <button
              onClick={() => onChange(disclaimers.filter((_, j) => j !== i))}
              className="rounded-lg p-1 text-slate-300 hover:text-red-500"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        ))}
        {disclaimers.length === 0 && <p className="text-xs text-slate-400">Sin avisos.</p>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {plantillas.length > 0 && (
          <select
            className="field max-w-xs py-1.5 text-sm"
            value=""
            onChange={(e) => {
              const pl = plantillas.find((x) => x.id === e.target.value);
              if (pl) onChange([...disclaimers, pl.texto]);
              e.target.value = "";
            }}
          >
            <option value="">Insertar plantilla…</option>
            {plantillas.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.titulo}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="field flex-1 text-sm"
          placeholder="Escribe un aviso (p. ej. Pendiente de confirmar con visita de obra)"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button
          onClick={() => {
            if (texto.trim()) {
              onChange([...disclaimers, texto.trim()]);
              setTexto("");
            }
          }}
          className="btn-ghost px-3 py-2 text-sm"
        >
          <IconPlus className="h-4 w-4" /> Añadir
        </button>
        <button
          onClick={async () => {
            if (texto.trim()) {
              await onNuevaPlantilla(texto.trim().slice(0, 40), texto.trim());
            }
          }}
          className="btn-ghost px-3 py-2 text-sm"
          title="Guardar como plantilla reutilizable"
        >
          Guardar plantilla
        </button>
      </div>
    </div>
  );
}
