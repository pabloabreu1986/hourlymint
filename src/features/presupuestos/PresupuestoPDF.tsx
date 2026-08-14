import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { presupuestosApi, clientesApi, catalogoApi } from "@/services";
import { tenantActual } from "@/lib/branding";
import { totalesLinea, totalesPresupuesto } from "@/lib/presupuestos-calc";
import { formatEuro, fechaCompleta } from "@/lib/format";
import { Cargando } from "@/components/ui";
import type { Articulo, Cliente, Presupuesto } from "@/lib/types";

/**
 * Presupuesto listo para imprimir / guardar como PDF (Ctrl/Cmd+P). Vista de
 * cara al cliente: muestra PVP, nunca coste ni margen. Estructura fiscal
 * (empresa, cliente, base/IVA/total, forma de pago, IBAN y texto legal).
 */
export default function PresupuestoPDF() {
  const { id = "" } = useParams();
  const [p, setP] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const [pre, arts] = await Promise.all([
        presupuestosApi.getPresupuesto(id),
        catalogoApi.listArticulos(),
      ]);
      setP(pre);
      setArticulos(arts);
      if (pre?.clienteId) setCliente(await clientesApi.getCliente(pre.clienteId));
      setCargando(false);
    })();
  }, [id]);

  if (cargando) return <Cargando />;
  if (!p) return <div className="p-8 text-center text-slate-500">Presupuesto no encontrado.</div>;

  const t = tenantActual();
  const acento = t.colores?.orange ?? "#BE6B39";
  const fiscal = t.fiscal;
  const ivaPct = fiscal?.ivaDefecto ?? 21;
  const tot = totalesPresupuesto(p);
  const base = tot.pvp;
  const iva = Math.round(base * ivaPct) / 100;
  const total = Math.round((base + iva) * 100) / 100;

  const refDe = (refId: string | null) =>
    refId ? articulos.find((a) => a.id === refId)?.referencia ?? "" : "";

  const dirCliente = cliente
    ? [
        cliente.direccion,
        [cliente.cp, cliente.ciudad].filter(Boolean).join(" "),
        cliente.poblacion,
      ].filter(Boolean)
    : [];

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

      <div className="mx-auto max-w-[820px] bg-white p-10 text-[13px] text-slate-700 shadow-card print:max-w-none print:p-8 print:shadow-none">
        {/* Cabecera: logo + título */}
        <div className="flex items-start justify-between">
          <div>
            {t.logoUrl ? (
              <img src={t.logoUrl} alt={t.nombre} className="mb-1 h-14 object-contain" />
            ) : (
              <p className="text-3xl font-extrabold" style={{ color: acento }}>
                {t.nombreCorto || t.nombre}
              </p>
            )}
            {t.eslogan && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t.eslogan}
              </p>
            )}
          </div>
          <h1 className="text-3xl font-light text-slate-400">Presupuesto</h1>
        </div>

        {/* Emisor (empresa) + Cliente */}
        <div className="mt-8 flex justify-between gap-8">
          <div className="text-[12px] leading-relaxed">
            <p className="font-bold text-slate-800">{fiscal?.razonSocial || t.nombre}</p>
            {fiscal?.nif && <p className="text-slate-500">NIF: {fiscal.nif}</p>}
            {fiscal?.direccion && <p className="text-slate-500">{fiscal.direccion}</p>}
            {(fiscal?.cp || fiscal?.ciudad) && (
              <p className="text-slate-500">
                {[fiscal?.cp, fiscal?.ciudad].filter(Boolean).join(" - ")}
              </p>
            )}
            {fiscal?.provincia && <p className="text-slate-500">{fiscal.provincia}</p>}
          </div>
          {cliente && (
            <div className="text-right text-[12px] leading-relaxed">
              <p>
                <span className="font-bold text-slate-800">CLIENTE:</span>{" "}
                {`${cliente.nombre} ${cliente.apellidos}`.trim()}
              </p>
              {cliente.cif && <p className="text-slate-500">NIF: {cliente.cif}</p>}
              {dirCliente.map((linea, i) => (
                <p key={i} className="text-slate-500">
                  {linea}
                </p>
              ))}
              <p className="text-slate-500">ESPAÑA</p>
            </div>
          )}
        </div>

        {/* Fecha / Nº */}
        <div className="mt-6 text-[12px]">
          <p>
            <span className="text-slate-400">Fecha:</span> {fechaCompleta(p.fecha)}
          </p>
          <p>
            <span className="text-slate-400">Nº PTO:</span>{" "}
            <span className="font-semibold text-slate-700">{p.numero}</span>
          </p>
        </div>

        {/* Líneas */}
        <table className="mt-6 w-full text-[12px]">
          <thead>
            <tr className="border-b-2 text-left text-[11px] uppercase tracking-wide text-slate-500" style={{ borderColor: acento }}>
              <th className="py-2 pr-2 font-bold">Artículo</th>
              <th className="py-2 px-2 font-bold">Concepto</th>
              <th className="py-2 px-2 text-right font-bold">Unidades</th>
              <th className="py-2 px-2 text-right font-bold">Precio</th>
              <th className="py-2 px-2 text-right font-bold">%IVA</th>
              <th className="py-2 pl-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {p.lineas.map((l) => {
              const lt = totalesLinea(l, p.margenPct);
              return (
                <tr key={l.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-2 font-mono text-[11px] text-slate-500">{refDe(l.refId)}</td>
                  <td className="py-2 px-2 font-semibold text-slate-700">{l.concepto}</td>
                  <td className="py-2 px-2 text-right text-slate-600">
                    {l.cantidad} {l.unidad !== "ud" ? l.unidad : ""}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-600">{formatEuro(lt.pvpUnitario)}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{ivaPct}%</td>
                  <td className="py-2 pl-2 text-right font-semibold text-slate-800">
                    {formatEuro(lt.pvpTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totales: base / IVA / total */}
        <div className="mt-5 flex justify-end">
          <div className="w-72 text-[12px]">
            <div className="flex justify-between border-t border-slate-200 py-1.5">
              <span className="text-slate-500">BASE IMPONIBLE</span>
              <span className="font-semibold text-slate-700">{formatEuro(base)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">IVA {ivaPct}%</span>
              <span className="font-semibold text-slate-700">{formatEuro(iva)}</span>
            </div>
            <div
              className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-white"
              style={{ background: acento }}
            >
              <span className="text-sm font-semibold">TOTAL</span>
              <span className="text-lg font-extrabold">{formatEuro(total)}</span>
            </div>
          </div>
        </div>

        {/* Observaciones (notas + disclaimers) */}
        {(p.notas.trim() || p.disclaimers.length > 0) && (
          <div className="mt-8">
            <p className="border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Observaciones
            </p>
            {p.notas.trim() && (
              <p className="mt-2 whitespace-pre-line text-[12px] text-slate-600">{p.notas}</p>
            )}
            {p.disclaimers.map((d, i) => (
              <p key={i} className="mt-1 text-[11px] text-slate-400">
                * {d}
              </p>
            ))}
          </div>
        )}

        {/* Forma de pago + IBAN */}
        {(fiscal?.formaPago || fiscal?.iban) && (
          <div className="mt-6 text-[12px]">
            {fiscal?.formaPago && (
              <p>
                <span className="font-bold text-slate-700">Forma de pago:</span> {fiscal.formaPago}
              </p>
            )}
            {fiscal?.iban && (
              <p className="mt-1">
                <span className="font-bold text-slate-700">IBAN</span>
                <br />
                <span className="font-mono text-slate-600">{fiscal.iban}</span>
              </p>
            )}
          </div>
        )}

        {/* Pie legal (RGPD) */}
        {fiscal?.textoLegal && (
          <p className="mt-10 border-t border-slate-100 pt-4 text-[8px] leading-relaxed text-slate-400">
            {fiscal.textoLegal}
          </p>
        )}

        <p className="mt-6 text-center text-[9px] text-slate-300 print:hidden">
          Presupuesto generado con fichaloop · un sistema de ENSODev
        </p>
      </div>
    </div>
  );
}
