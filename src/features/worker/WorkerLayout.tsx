import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { notificacionesApi } from "@/services";
import { IconHome, IconObras, IconBell, IconUser } from "@/components/icons";

const TABS = [
  { to: "/", label: "Inicio", icon: IconHome, end: true },
  { to: "/obras", label: "Obras", icon: IconObras, end: false },
  { to: "/notificaciones", label: "Avisos", icon: IconBell, end: false },
  { to: "/perfil", label: "Perfil", icon: IconUser, end: false },
];

export default function WorkerLayout() {
  const { usuario } = useAuth();
  const [sinLeer, setSinLeer] = useState(0);

  useEffect(() => {
    if (!usuario) return;
    notificacionesApi
      .notificacionesDe(usuario.id)
      .then((ns) => setSinLeer(ns.filter((n) => !n.leida).length));
  }, [usuario]);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-forge-canvas shadow-card-lg">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Barra de navegación inferior */}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? "text-forge-orange" : "text-slate-400"
                }`
              }
            >
              <span className="relative">
                <Icon className="h-6 w-6" />
                {to === "/notificaciones" && sinLeer > 0 && (
                  <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-forge-orange px-1 text-[9px] font-bold text-white">
                    {sinLeer}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
