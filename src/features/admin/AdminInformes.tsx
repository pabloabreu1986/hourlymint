import { useEffect, useState } from "react";
import { obrasApi, partesApi, dashboardApi } from "@/services";
import type { Obra, ParteDiario } from "@/lib/types";
import type { DashboardData } from "@/services/dashboard";
import { Cargando, Donut, ProgressBar } from "@/components/ui";
import { IconChart, IconClipboard, IconObras } from "@/components/icons";

export default function AdminInformes() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [partes, setPartes] = useState<ParteDiario[]>([]);
  const [dash, setDash] = useState<DashboardData | null>(null);

  useEffect(() => {
    obrasApi.listObras().then(setObras);
    partesApi.listPartes().then(setPartes);
    dashboardApi.getDashboard().then(setDash);
  }, []);

  if (!dash) return <Cargando />;

  const avanceMedio = obras.length
    ? Math.round(obras.reduce((s, o) => s + o.avance, 0) / obras.length)
    : 0;
  const partesCerrados = partes.filter((p) => p.estado === "cerrado").length;

  const porEstado = {
    en_curso: obras.filter((o) => o.estado === "en_curso").length,
    pendiente: obras.filter((o) => o.estado === "pendiente").length,
    finalizada: obras.filter((o) => o.estado === "finalizada").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<IconObras className="h-6 w-6" />} label="Avance medio" value={`${avanceMedio}%`} color="#5B7A4B" />
        <Kpi icon={<IconClipboard className="h-6 w-6" />} label="Partes cerrados" value={String(partesCerrados)} color="#BE6B39" />
        <Kpi icon={<IconChart className="h-6 w-6" />} label="Partes totales" value={String(partes.length)} color="#2E6F8E" />
        <Kpi icon={<IconObras className="h-6 w-6" />} label="Obras" value={String(obras.length)} color="#8E4B6F" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-bold text-forge-dark">Avance por obra</h2>
          <div className="space-y-4">
            {obras.map((o) => (
              <div key={o.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">{o.nombre}</span>
                  <span className="font-semibold text-forge-dark">{o.avance}%</span>
                </div>
                <ProgressBar value={o.avance} color={o.color} />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-bold text-forge-dark">Estado de las obras</h2>
          <div className="flex items-center gap-6">
            <Donut
              size={140}
              segments={[
                { value: porEstado.en_curso, color: "#16A34A" },
                { value: porEstado.pendiente, color: "#D97706" },
                { value: porEstado.finalizada, color: "#94A3B8" },
              ]}
              center={
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-forge-dark">{obras.length}</p>
                  <p className="text-[10px] uppercase text-slate-400">Obras</p>
                </div>
              }
            />
            <div className="space-y-2 text-sm">
              <Leyenda color="#16A34A" label="En curso" value={porEstado.en_curso} />
              <Leyenda color="#D97706" label="Pendientes" value={porEstado.pendiente} />
              <Leyenda color="#94A3B8" label="Finalizadas" value={porEstado.finalizada} />
            </div>
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-slate-400">
        Informes de demostración con datos mock. La exportación a PDF/Excel se añadirá con la base de datos real.
      </p>
    </div>
  );
}

function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card p-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${color}15`, color }}>
        {icon}
      </span>
      <p className="mt-3 text-2xl font-extrabold text-forge-dark">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function Leyenda({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto font-semibold text-forge-dark">{value}</span>
    </div>
  );
}
