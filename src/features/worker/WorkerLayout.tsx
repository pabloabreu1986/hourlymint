import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { notificacionesApi } from "@/services";
import { IconHome, IconObras, IconBell, IconUser, IconHelp } from "@/components/icons";
import Tour from "@/features/onboarding/Tour";
import { TOUR_BIENVENIDA_TRABAJADOR, tourDeRutaTrabajador, type DefTour } from "@/features/onboarding/tour-content";

const TABS = [
  { to: "/inicio", label: "Inicio", icon: IconHome, end: true },
  { to: "/obras", label: "Obras", icon: IconObras, end: false },
  { to: "/notificaciones", label: "Avisos", icon: IconBell, end: false },
  { to: "/perfil", label: "Perfil", icon: IconUser, end: false },
];

export default function WorkerLayout() {
  const { usuario } = useAuth();
  const [sinLeer, setSinLeer] = useState(0);
  const [tour, setTour] = useState<DefTour | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!usuario) return;
    notificacionesApi
      .notificacionesDe(usuario.id)
      .then((ns) => setSinLeer(ns.filter((n) => !n.leida).length));
  }, [usuario]);

  // Lanza el tour de bienvenida la primera vez que este trabajador entra.
  useEffect(() => {
    if (!usuario) return;
    const clave = `fichaloop.onboarding.${usuario.id}`;
    try {
      if (!localStorage.getItem(clave)) {
        localStorage.setItem(clave, "1");
        setTour(TOUR_BIENVENIDA_TRABAJADOR);
      }
    } catch {
      /* modo privado / cuota: sin autoarranque */
    }
  }, [usuario]);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-forge-canvas shadow-card-lg">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Botón flotante de ayuda (guía de la pantalla actual), anclado al
          borde derecho de la columna de la app (no al centro de la pantalla). */}
      <div
        className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          data-tour="help-trab"
          onClick={() => setTour(tourDeRutaTrabajador(location.pathname))}
          className="pointer-events-auto ml-auto grid h-11 w-11 place-items-center rounded-full bg-forge-dark text-white shadow-card-lg hover:bg-forge-slate"
          aria-label="Ayuda / guía de esta pantalla"
          title="Ayuda"
        >
          <IconHelp className="h-6 w-6" />
        </button>
      </div>

      {/* Barra de navegación inferior */}
      <nav data-tour="nav-trab" className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur">
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

      {tour && <Tour tour={tour} onClose={() => setTour(null)} />}
    </div>
  );
}
