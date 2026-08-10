import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { presupuestosApi, clientesApi } from "@/services";
import { tenantActual } from "@/lib/branding";
import { totalesLinea, totalesPresupuesto } from "@/lib/presupuestos-calc";
import { formatEuro, fechaLarga } from "@/lib/format";
import { Cargando } from "@/components/ui";
import type { Cliente, Presupuesto } from "@/lib/types";

/**
 * Presupuesto listo para imprimir / guardar como PDF (Ctrl/Cmd+P). Vista de
 * cara al cliente: muestra PVP, nunca coste ni margen. Fuera del layout admin
 * para imprimirse limpio, como la vista previa del dosier.
 */
export default function PresupuestoPDF() {
  const { id = "" } = useParams();
  const [p, setP] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const pre = await presupuestosApi.getPresupuesto(id);
      setP(pre);
      if (pre?.clienteId) setCliente(await clientesApi.getCliente(pre.clienteId));
      setCargando(false);
    })();
  }, [id]);

  if (cargando) return <Cargando />;
  if (!p) return <div className="p-8 text-center text-slate-500">Presupuesto no encontrado.</div>;

  const t = tenantActual();
  const acento = t.colores?.orange ?? "#BE6B39";
  const tot = totalesPresupuesto(p);

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Barra de acciones (no se imprime) */}
      <div className="mx-auto mb-4 flex max-w-[820px] justify-end gap-2 px-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white"
          style={{ background: acento }}
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="mx-auto max-w-[820px] bg-white p-10 shadow-card print:max-w-none print:p-0 print:shadow-none">
        {/* Cabecera con marca */}
        <div className="flex items-start justify-between border-b-4 pb-5" style={{ borderColor: acento }}>
          <div>
            {t.logoUrl ? (
              <img src={t.logoUrl} alt={t.nombre} className="mb-2 h-12 object-contain" />
            ) : (
              <p className="text-2xl font-extrabold" style={{ color: acento }}>
                {t.nombreCorto || t.nombre}
              </p>
            )}
            {t.eslogan && <p className="text-xs text-slate-400">{t.eslogan}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-slate-800">PRESUPUESTO</p>
            <p className="text-sm text-slate-500">{p.numero}</p>
            <p className="text-xs text-slate-400">{fechaLarga(p.fecha)}</p>
          </div>
        </div>

        {/* Cliente */}
        {cliente && (
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Para</p>
            <p className="font-semibold text-slate-800">
              {cliente.nombre} {cliente.apellidos}
            </p>
            <p className="text-sm text-slate-500">
              {[cliente.direccion, cliente.telefono, cliente.email].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}

        {/* Líneas (solo PVP) */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-2 font-semibold">Concepto</th>
              <th className="py-2 px-2 text-right font-semibold">Cant.</th>
              <th className="py-2 px-2 font-semibold">Ud</th>
              <th className="py-2 px-2 text-right font-semibold">Precio</th>
              <th className="py-2 pl-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {p.lineas.map((l) => {
              const lt = totalesLinea(l, p.margenPct);
              return (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 text-slate-700">{l.concepto}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{l.cantidad}</td>
                  <td className="py-2 px-2 text-slate-500">{l.unidad}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{formatEuro(lt.pvpUnitario)}</td>
                  <td className="py-2 pl-2 text-right font-semibold text-slate-800">
                    {formatEuro(lt.pvpTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="w-64">
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3 text-white"
              style={{ background: acento }}
            >
              <span className="text-sm font-semibold">TOTAL</span>
              <span className="text-lg font-extrabold">{formatEuro(tot.pvp)}</span>
            </div>
            <p className="mt-1 text-right text-[10px] text-slate-400">IVA no incluido</p>
          </div>
        </div>

        {/* Disclaimers */}
        {p.disclaimers.length > 0 && (
          <div className="mt-8 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
            {p.disclaimers.map((d, i) => (
              <p key={i} className="mb-1 last:mb-0">
                * {d}
              </p>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[10px] text-slate-300">
          Presupuesto generado con fichaloop · un sistema de ENSODev
        </p>
      </div>
    </div>
  );
}
