import { useEffect, useState } from "react";
import { partesApi, obrasApi } from "@/services";
import type { Obra, ParteDiario } from "@/lib/types";
import { Cargando, EmptyState } from "@/components/ui";
import { IconBox } from "@/components/icons";

interface Fila {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  obra: string;
  color: string;
}

export default function AdminMateriales() {
  const [filas, setFilas] = useState<Fila[] | null>(null);

  useEffect(() => {
    (async () => {
      const [partes, obras] = await Promise.all([partesApi.listPartes(), obrasApi.listObras()]);
      const obraDe = (id: string) => obras.find((o: Obra) => o.id === id);
      const out: Fila[] = [];
      partes.forEach((p: ParteDiario) => {
        const o = obraDe(p.obraId);
        p.materialesPendientes.forEach((m) =>
          out.push({
            id: `${p.id}_${m.id}`,
            nombre: m.nombre,
            cantidad: m.cantidad,
            unidad: m.unidad,
            obra: o?.nombre ?? "—",
            color: o?.color ?? "#94A3B8",
          })
        );
      });
      setFilas(out);
    })();
  }, []);

  if (!filas) return <Cargando />;

  const totalUds = filas.reduce((s, f) => s + f.cantidad, 0);

  return (
    <div>
      <p className="mb-5 text-sm text-slate-500">
        {filas.length} líneas pendientes · {totalUds} unidades por entregar
      </p>
      {filas.length === 0 ? (
        <EmptyState icon={<IconBox className="h-12 w-12" />} titulo="Sin material pendiente" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Material</th>
                  <th className="px-4 py-3 font-semibold">Obra</th>
                  <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-50 text-forge-orange">
                          <IconBox className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-forge-dark">{f.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-slate-500">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />
                        {f.obra}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-forge-dark">
                      {f.cantidad} {f.unidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
