import { useMemo, useState } from "react";
import { facturasApi } from "@/services";
import { ESTADOS_FACTURA, totalFactura } from "@/lib/finanzas";
import { formatEuro } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { Modal, Spinner } from "@/components/ui";
import { Combobox } from "@/components/Combobox";
import type { Cliente, EstadoFactura, Factura, Obra } from "@/lib/types";

type Draft = {
  clienteId: string;
  obraId: string;
  numero: string;
  fecha: string;
  concepto: string;
  base: string;
  iva: string;
  estado: EstadoFactura;
  fechaVencimiento: string;
  fechaPago: string;
};

function draftDe(f: Factura | null, clienteIdFijo?: string): Draft {
  return {
    clienteId: f?.clienteId ?? clienteIdFijo ?? "",
    obraId: f?.obraId ?? "",
    numero: f?.numero ?? "",
    fecha: f?.fecha ?? hoyISO(),
    concepto: f?.concepto ?? "",
    base: f ? String(f.base) : "",
    iva: f ? String(f.iva) : "21",
    estado: f?.estado ?? "emitida",
    fechaVencimiento: f?.fechaVencimiento ?? "",
    fechaPago: f?.fechaPago ?? "",
  };
}

/**
 * Alta/edición de factura. Si se pasa `clienteIdFijo` (desde el perfil de un
 * cliente), el selector de cliente queda bloqueado a ese cliente.
 */
export default function FacturaForm({
  factura,
  clienteIdFijo,
  clientes,
  obras,
  onClose,
  onSaved,
}: {
  factura: Factura | null;
  clienteIdFijo?: string;
  clientes: Cliente[];
  obras: Obra[];
  onClose: () => void;
  onSaved: (f: Factura) => void;
}) {
  const [d, setD] = useState<Draft>(draftDe(factura, clienteIdFijo));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = totalFactura(Number(d.base) || 0, Number(d.iva) || 0);
  const obrasCliente = useMemo(
    () => obras.filter((o) => o.clienteId === d.clienteId),
    [obras, d.clienteId]
  );

  const clienteSel = clientes.find((c) => c.id === d.clienteId);
  const clienteLabel = clienteSel ? `${clienteSel.nombre} ${clienteSel.apellidos}`.trim() : "— Selecciona —";
  const obraLabel = obrasCliente.find((o) => o.id === d.obraId)?.nombre ?? "— General del cliente —";
  const comboFieldCls = "field mt-1.5 flex w-full items-center justify-between text-left";

  async function guardar() {
    if (!d.clienteId) return setError("Selecciona un cliente.");
    if (!d.numero.trim()) return setError("El número de factura es obligatorio.");
    if (!(Number(d.base) > 0)) return setError("La base imponible debe ser mayor que 0.");
    setGuardando(true);
    try {
      const base = Number(d.base);
      const iva = Number(d.iva) || 0;
      const payload = {
        clienteId: d.clienteId,
        obraId: d.obraId || null,
        numero: d.numero.trim(),
        fecha: d.fecha,
        concepto: d.concepto.trim(),
        base,
        iva,
        total: totalFactura(base, iva),
        estado: d.estado,
        fechaVencimiento: d.fechaVencimiento || null,
        // Si se marca pagada sin fecha de cobro, se usa la de emisión.
        fechaPago:
          d.estado === "pagada" ? d.fechaPago || d.fecha : d.fechaPago || null,
        archivo: factura?.archivo ?? null,
      };
      const saved = factura
        ? await facturasApi.actualizarFactura(factura.id, payload)
        : await facturasApi.crearFactura(payload);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={factura ? "Editar factura" : "Nueva factura"}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cliente</label>
            {clienteIdFijo ? (
              <div className="field mt-1.5 opacity-60">{clienteLabel}</div>
            ) : (
              <Combobox
                className={comboFieldCls}
                label={clienteLabel}
                placeholder="Buscar cliente…"
                items={[
                  { id: "", label: "— Selecciona —" },
                  ...clientes.map((c) => ({ id: c.id, label: `${c.nombre} ${c.apellidos}`.trim() })),
                ]}
                onPick={(id) => setD({ ...d, clienteId: id, obraId: "" })}
              />
            )}
          </div>
          <div>
            <label className="label">Obra (opcional)</label>
            <Combobox
              className={comboFieldCls}
              label={obraLabel}
              placeholder="Buscar obra…"
              items={[
                { id: "", label: "— General del cliente —" },
                ...obrasCliente.map((o) => ({ id: o.id, label: o.nombre })),
              ]}
              onPick={(id) => setD({ ...d, obraId: id })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nº de factura</label>
            <input
              className="field mt-1.5"
              placeholder="2026-001"
              value={d.numero}
              onChange={(e) => setD({ ...d, numero: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Fecha de emisión</label>
            <input
              type="date"
              className="field mt-1.5"
              value={d.fecha}
              onChange={(e) => setD({ ...d, fecha: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Concepto</label>
          <input
            className="field mt-1.5"
            value={d.concepto}
            onChange={(e) => setD({ ...d, concepto: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Base (€)</label>
            <input
              type="number"
              className="field mt-1.5"
              value={d.base}
              onChange={(e) => setD({ ...d, base: e.target.value })}
            />
          </div>
          <div>
            <label className="label">IVA (%)</label>
            <input
              type="number"
              className="field mt-1.5"
              value={d.iva}
              onChange={(e) => setD({ ...d, iva: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Total</label>
            <div className="field mt-1.5 flex items-center bg-slate-50 font-semibold text-forge-dark">
              {formatEuro(total)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Estado</label>
            <select
              className="field mt-1.5"
              value={d.estado}
              onChange={(e) => setD({ ...d, estado: e.target.value as EstadoFactura })}
            >
              {ESTADOS_FACTURA.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vencimiento</label>
            <input
              type="date"
              className="field mt-1.5"
              value={d.fechaVencimiento}
              onChange={(e) => setD({ ...d, fechaVencimiento: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Fecha de cobro</label>
            <input
              type="date"
              className="field mt-1.5"
              value={d.fechaPago}
              onChange={(e) => setD({ ...d, fechaPago: e.target.value })}
            />
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
