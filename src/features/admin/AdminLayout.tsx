import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { notificacionesApi } from "@/services";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import { fechaCompleta, saludo } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import {
  IconGrid,
  IconObras,
  IconUsers,
  IconClipboard,
  IconCamera,
  IconBox,
  IconAlert,
  IconTruck,
  IconWrench,
  IconWarehouse,
  IconChart,
  IconSettings,
  IconLogout,
  IconBell,
  IconClock,
  IconUser,
} from "@/components/icons";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: IconGrid, end: true },
  { to: "/admin/obras", label: "Obras", icon: IconObras },
  { to: "/admin/trabajadores", label: "Trabajadores", icon: IconUsers },
  { to: "/admin/partes", label: "Partes diarios", icon: IconClipboard },
  { to: "/admin/fotografias", label: "Fotografías", icon: IconCamera },
  { to: "/admin/materiales", label: "Materiales", icon: IconBox },
  { to: "/admin/incidencias", label: "Incidencias", icon: IconAlert },
  { to: "/admin/vehiculos", label: "Vehículos", icon: IconTruck },
  { to: "/admin/herramientas", label: "Herramientas", icon: IconWrench },
  { to: "/admin/almacen", label: "Almacén", icon: IconWarehouse },
  { to: "/admin/informes", label: "Informes", icon: IconChart },
  { to: "/admin/horas", label: "Horas", icon: IconClock },
  { to: "/admin/notificaciones", label: "Notificaciones", icon: IconBell },
  { to: "/admin/configuracion", label: "Configuración", icon: IconSettings },
];

// Barra de navegación inferior en móvil: mismo patrón que la vista de trabajador.
const TABS_MOBILE = [
  { to: "/admin", label: "Dashboard", icon: IconGrid, end: true },
  { to: "/admin/obras", label: "Obras", icon: IconObras, end: false },
  { to: "/admin/trabajadores", label: "Trabajadores", icon: IconUsers, end: false },
  { to: "/admin/perfil", label: "Perfil", icon: IconUser, end: false },
];

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const [sinLeer, setSinLeer] = useState(0);
  const location = useLocation();
  const titulo =
    NAV.find((n) => n.to === location.pathname)?.label ??
    TABS_MOBILE.find((n) => n.to === location.pathname)?.label ??
    "Panel";

  useEffect(() => {
    if (!usuario) return;
    notificacionesApi
      .listNotificaciones()
      .then((ns) => setSinLeer(ns.filter((n) => !n.leida).length));
  }, [usuario, location.pathname]);

  if (!usuario) return null;

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-forge-dark text-white">
      <div className="px-5 py-5">
        <Logo variant="light" />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-forge-orange text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
      >
        <IconLogout className="h-5 w-5" /> Cerrar sesión
      </button>
    </aside>
  );

  return (
    <div className="flex h-full bg-forge-canvas">
      {/* Sidebar escritorio */}
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header móvil: mismo look & feel que la vista de trabajador
            (logo + avatar arriba, saludo con nombre debajo), respetando
            el notch/isla dinámica del iPhone. */}
        <header
          className="rounded-b-3xl bg-white px-5 pb-5 shadow-card lg:hidden"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <NavLink to="/admin/notificaciones" className="relative text-forge-dark">
              <Avatar nombre={usuario.nombre} color={usuario.color} size={38} />
              {sinLeer > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-forge-orange px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {sinLeer}
                </span>
              )}
            </NavLink>
          </div>
          <div className="mt-5">
            <h1 className="text-xl font-extrabold text-forge-dark">
              Hola, {usuario.nombre.split(" ")[0]}
            </h1>
            <p className="text-sm text-slate-400">
              {saludo()} · {titulo} · {fechaCompleta(hoyISO())}
            </p>
          </div>
        </header>

        {/* Header de escritorio (sin cambios) */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-3 lg:flex">
          <h1 className="text-xl font-bold text-forge-dark">{titulo}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{fechaCompleta(hoyISO())}</span>
            <NavLink to="/admin/notificaciones" className="relative text-slate-400 hover:text-forge-dark">
              <IconBell className="h-6 w-6" />
              {sinLeer > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-forge-orange px-1 text-[9px] font-bold text-white">
                  {sinLeer}
                </span>
              )}
            </NavLink>
            <div className="flex items-center gap-2">
              <Avatar nombre={usuario.nombre} color={usuario.color} size={36} />
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight text-forge-dark">{usuario.nombre}</p>
                <p className="text-xs text-slate-400">{usuario.puesto}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Barra de navegación inferior en móvil */}
      <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {TABS_MOBILE.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? "text-forge-orange" : "text-slate-400"
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
