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
  IconMenu,
  IconX,
  IconBell,
  IconClock,
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

// En móvil el menú lateral solo muestra los 3 accesos principales.
const NAV_MOBILE = NAV.filter((n) =>
  ["/admin", "/admin/obras", "/admin/trabajadores"].includes(n.to)
);

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [sinLeer, setSinLeer] = useState(0);
  const location = useLocation();
  const titulo = NAV.find((n) => n.to === location.pathname)?.label ?? "Panel";

  useEffect(() => {
    if (!usuario) return;
    notificacionesApi
      .listNotificaciones()
      .then((ns) => setSinLeer(ns.filter((n) => !n.leida).length));
  }, [usuario, location.pathname]);

  if (!usuario) return null;

  const renderSidebar = (items: typeof NAV) => (
    <aside className="flex h-full w-64 flex-col bg-forge-dark text-white">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo variant="light" />
        <button className="lg:hidden" onClick={() => setOpen(false)}>
          <IconX className="h-5 w-5 text-white/60" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
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
      <div className="hidden lg:block">{renderSidebar(NAV)}</div>

      {/* Sidebar móvil: solo los 3 accesos principales */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative">{renderSidebar(NAV_MOBILE)}</div>
        </div>
      )}

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
            <button onClick={() => setOpen(true)} aria-label="Abrir menú">
              <IconMenu className="h-6 w-6 text-forge-dark" />
            </button>
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

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
