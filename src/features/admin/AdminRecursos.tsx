import { useEffect, useState } from "react";
import { recursosApi, usuariosApi, obrasApi } from "@/services";
import type { AlmacenItem, Herramienta, Usuario, Vehiculo, Obra } from "@/lib/types";
import { Badge, Cargando, ProgressBar } from "@/components/ui";
import { IconTruck, IconWrench, IconWarehouse } from "@/components/icons";

type Tab = "vehiculos" | "herramientas" | "almacen";

export default function AdminRecursos({ tab }: { tab: Tab }) {
  if (tab === "vehiculos") return <Vehiculos />;
  if (tab === "herramientas") return <Herramientas />;
  return <Almacen />;
}

function Vehiculos() {
  const [items, setItems] = useState<Vehiculo[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  useEffect(() => {
    recursosApi.listVehiculos().then(setItems);
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);
  if (!items) return <Cargando />;
  const nombre = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre ?? "Sin asignar";
  const badge = { disponible: "green", en_uso: "amber", taller: "red" } as const;
  const label = { disponible: "Disponible", en_uso: "En uso", taller: "En taller" };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((v) => (
        <div key={v.id} className="card p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-forge-dark/5 text-forge-dark">
              <IconTruck className="h-6 w-6" />
            </span>
            <Badge color={badge[v.estado]}>{label[v.estado]}</Badge>
          </div>
          <h3 className="mt-3 font-bold text-forge-dark">{v.modelo}</h3>
          <p className="font-mono text-sm text-slate-500">{v.matricula}</p>
          <p className="mt-2 text-sm text-slate-400">Conductor: {nombre(v.asignadoA)}</p>
        </div>
      ))}
    </div>
  );
}

function Herramientas() {
  const [items, setItems] = useState<Herramienta[] | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  useEffect(() => {
    recursosApi.listHerramientas().then(setItems);
    obrasApi.listObras().then(setObras);
  }, []);
  if (!items) return <Cargando />;
  const ubic = (id: string) => (id === "almacen" ? "Almacén" : obras.find((o) => o.id === id)?.nombre ?? id);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Herramienta</th>
              <th className="px-4 py-3 font-semibold">Ubicación</th>
              <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Almacen() {
  const [items, setItems] = useState<AlmacenItem[] | null>(null);
  useEffect(() => {
    recursosApi.listAlmacen().then(setItems);
  }, []);
  if (!items) return <Cargando />;

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
