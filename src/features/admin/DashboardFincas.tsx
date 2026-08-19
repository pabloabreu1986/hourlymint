import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientesApi, oportunidadesApi, obrasApi, facturasApi } from "@/services";
import {
  kpisFincas,
  rankingAdministradores,
  accionVencida,
  esAdminFincas,
  type KpisFincas,
  type MetricasAdministrador,
} from "@/lib/fincas";
import { hoyISO } from "@/lib/seed";
import { formatEuro } from "@/lib/format";
import { Cargando } from "@/components/ui";
import { IconBuilding, IconTarget, IconEuro, IconChevronRight } from "@/components/icons";
import type { Cliente, Factura, Obra, Oportunidad } from "@/lib/types";

export default function DashboardFincas() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);

  useEffect(() => {
    Promise.all([
      clientesApi.listClientes(),
      oportunidadesApi.listOportunidades(),
      obrasApi.listObras(),
      facturasApi.listFacturas(),
    ]).then(([c, ops, o, f]) => {
      setClientes(c);
      setOportunidades(ops);
      setObras(o);
      setFacturas(f);
    });
  }, []);

  if (!clientes) return <Cargando />;

  const hoy = hoyISO();
  const k: KpisFincas = kpisFincas(clientes, oportunidades, obras, facturas, hoy);
  const ranking: MetricasAdministrador[] = rankingAdministradores(clientes, oportunidades, obras, facturas);
  const vencidos = clientes
    .filter(esAdminFincas)
    .filter((a) => accionVencida(a.fechaProximaAccion, hoy));

  return (
    <div className="space-y-6">
      {/* Aviso de seguimiento vencido */}
      {vencidos.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-600">
            {vencidos.length} {vencidos.length === 1 ? "administrador tiene" : "administradores tienen"} una
            próxima acción vencida
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {vencidos.slice(0, 8).map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/admin/clientes/${a.id}`)}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                {a.nombreAdministracion || a.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Administradores */}
      <Grupo titulo="Administradores">
        <Kpi icon={<IconBuilding className="h-5 w-5" />} label="Total" valor={k.administradoresTotales} />
        <Kpi label="Nuevos este mes" valor={k.nuevosEsteMes} />
        <Kpi label="Contactados" valor={k.contactados} />
        <Kpi label="Dossiers enviados" valor={k.dossiersEnviados} />
        <Kpi label="Proveedores aceptados" valor={k.proveedoresAceptados} />
        <Kpi label="Activos" valor={k.administradoresActivos} tono="verde" />
      </Grupo>

      {/* Negocio */}
      <Grupo titulo="Negocio">
        <Kpi icon={<IconTarget className="h-5 w-5" />} label="Oportunidades recibidas" valor={k.oportunidadesRecibidas} />
        <Kpi label="Visitas realizadas" valor={k.visitasRealizadas} />
        <Kpi label="Presupuestos enviados" valor={k.presupuestosEnviados} />
        <Kpi label="Obras adjudicadas" valor={k.obrasAdjudicadas} tono="verde" />
        <Kpi label="Tasa de conversión" valor={`${Math.round(k.tasaConversion * 100)}%`} />
      </Grupo>

      {/* Importes */}
      <Grupo titulo="Importes">
        <Kpi icon={<IconEuro className="h-5 w-5" />} label="Presupuestado" valor={formatEuro(k.importePresupuestado)} />
        <Kpi label="Contratado" valor={formatEuro(k.importeContratado)} />
        <Kpi label="Facturación generada" valor={formatEuro(k.facturacionGenerada)} tono="verde" />
      </Grupo>

      {/* Ranking */}
      <div className="card p-4">
        <h3 className="mb-3 font-bold text-forge-dark">TOP administradores</h3>
        {ranking.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Aún no hay administradores de fincas. Créalos desde Clientes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-3 font-semibold">#</th>
                  <th className="py-2 pr-3 font-semibold">Administración</th>
                  <th className="py-2 pr-3 text-right font-semibold">Facturación</th>
                  <th className="py-2 pr-3 text-right font-semibold">Obras</th>
                  <th className="py-2 pr-3 text-right font-semibold">Oportunidades</th>
                  <th className="py-2 pr-3 text-right font-semibold">Comunidades</th>
                  <th className="py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranking.map((m, i) => (
                  <tr
                    key={m.admin.id}
                    onClick={() => navigate(`/admin/clientes/${m.admin.id}`)}
                    className="cursor-pointer hover:bg-slate-50/50"
                  >
                    <td className="py-2 pr-3 font-bold text-slate-400">{i + 1}</td>
                    <td className="py-2 pr-3 font-semibold text-forge-dark">
                      {m.admin.nombreAdministracion || m.admin.nombre}
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold text-forge-dark">
                      {formatEuro(m.facturacionGenerada)}
                    </td>
                    <td className="py-2 pr-3 text-right text-slate-600">{m.numObrasAdjudicadas}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">{m.numOportunidades}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">{m.numComunidades}</td>
                    <td className="py-2 text-right">
                      <IconChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">{titulo}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{children}</div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  valor,
  tono,
}: {
  icon?: React.ReactNode;
  label: string;
  valor: string | number;
  tono?: "verde";
}) {
  return (
    <div className="card p-4">
      {icon && <div className="mb-1 text-forge-orange">{icon}</div>}
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-0.5 text-xl font-extrabold ${tono === "verde" ? "text-green-600" : "text-forge-dark"}`}>
        {valor}
      </p>
    </div>
  );
}
