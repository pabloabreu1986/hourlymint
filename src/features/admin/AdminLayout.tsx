import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { notificacionesApi } from "@/services";
import { tenantActual } from "@/lib/branding";
import { claveDeRutaAdmin, tenantTieneFuncion, usuarioVeModulo } from "@/lib/funciones";
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
  IconCalendar,
  IconTurnos,
  IconEuro,
  IconReceipt,
  IconFolder,
  IconStar,
  IconTarget,
  IconCheckSquare,
  IconSitemap,
  IconMegaphone,
  IconShield,
  IconHelp,
  IconBriefcase,
  IconMenu,
  IconX,
} from "@/components/icons";
import Tour from "@/features/onboarding/Tour";
import { TOUR_BIENVENIDA, tourDeRuta, type DefTour } from "@/features/onboarding/tour-content";

// Menú lateral agrupado por áreas. Cada entrada se filtra por las
// funciones activas del tenant (los títulos de sección desaparecen si
// no les queda ninguna entrada visible).
interface NavItem {
  to: string;
  label: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
  end?: boolean;
}

const NAV_SECCIONES: { titulo: string | null; items: NavItem[] }[] = [
  {
    titulo: null,
    items: [
      { to: "/admin", label: "Dashboard", icon: IconGrid, end: true },
      { to: "/admin/obras", label: "Obras", icon: IconObras },
      { to: "/admin/trabajadores", label: "Trabajadores", icon: IconUsers },
    ],
  },
  {
    titulo: "Comercial",
    items: [
      { to: "/admin/clientes", label: "Clientes", icon: IconBriefcase },
      { to: "/admin/facturas", label: "Facturas", icon: IconReceipt },
    ],
  },
  {
    titulo: "Presupuestos",
    items: [
      { to: "/admin/presupuestos", label: "Presupuestos", icon: IconClipboard },
      { to: "/admin/catalogo", label: "Banco de precios", icon: IconBox },
      { to: "/admin/compras", label: "Facturas de proveedor", icon: IconReceipt },
    ],
  },
  {
    titulo: "Finanzas",
    items: [
      { to: "/admin/gastos", label: "Gastos", icon: IconEuro },
      { to: "/admin/nomina", label: "Nómina", icon: IconReceipt },
    ],
  },
  {
    titulo: "Obra",
    items: [
      { to: "/admin/partes", label: "Partes diarios", icon: IconClipboard },
      { to: "/admin/fotografias", label: "Fotografías", icon: IconCamera },
      { to: "/admin/materiales", label: "Materiales", icon: IconBox },
      { to: "/admin/incidencias", label: "Incidencias", icon: IconAlert },
      { to: "/admin/vehiculos", label: "Vehículos", icon: IconTruck },
      { to: "/admin/herramientas", label: "Herramientas", icon: IconWrench },
      { to: "/admin/almacen", label: "Almacén", icon: IconWarehouse },
    ],
  },
  {
    titulo: "Tiempo",
    items: [
      { to: "/admin/horas", label: "Horas", icon: IconClock },
      { to: "/admin/ausencias", label: "Ausencias", icon: IconCalendar },
      { to: "/admin/turnos", label: "Turnos", icon: IconTurnos },
    ],
  },
  {
    titulo: "Talento",
    items: [
      { to: "/admin/evaluaciones", label: "Evaluaciones", icon: IconStar },
      { to: "/admin/metas", label: "Metas y objetivos", icon: IconTarget },
      { to: "/admin/onboarding", label: "Onboarding", icon: IconCheckSquare },
      { to: "/admin/organigrama", label: "Organigrama", icon: IconSitemap },
    ],
  },
  {
    titulo: "Comunicación",
    items: [
      { to: "/admin/comunicados", label: "Comunicados", icon: IconMegaphone },
      { to: "/admin/denuncias", label: "Canal de denuncias", icon: IconShield },
      { to: "/admin/documentos", label: "Documentos", icon: IconFolder },
      { to: "/admin/notificaciones", label: "Notificaciones", icon: IconBell },
    ],
  },
  {
    titulo: "Marketing",
    items: [{ to: "/admin/dosier", label: "Dosier corporativo", icon: IconClipboard }],
  },
  {
    titulo: "Sistema",
    items: [
      { to: "/admin/informes", label: "Informes", icon: IconChart },
      { to: "/admin/configuracion", label: "Configuración", icon: IconSettings },
    ],
  },
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
  const [tour, setTour] = useState<DefTour | null>(null);
  const [menu, setMenu] = useState(false); // drawer del menú en móvil
  const location = useLocation();

  // Cierra el menú móvil al cambiar de ruta.
  useEffect(() => {
    setMenu(false);
  }, [location.pathname]);

  // Lanza el tour de bienvenida la primera vez que este usuario entra.
  useEffect(() => {
    if (!usuario) return;
    const clave = `fichaloop.onboarding.${usuario.id}`;
    try {
      if (!localStorage.getItem(clave)) {
        localStorage.setItem(clave, "1");
        setTour(TOUR_BIENVENIDA);
      }
    } catch {
      /* modo privado / cuota: sin autoarranque */
    }
  }, [usuario]);

  function abrirAyuda() {
    setTour(tourDeRuta(location.pathname));
  }

  // Filtra el menú por las funciones activas del cliente (tenant) y por los
  // módulos que un directivo le haya habilitado a este usuario admin.
  const funciones = tenantActual().funciones;
  const puedeVer = (to: string) => {
    const clave = claveDeRutaAdmin(to);
    if (!tenantTieneFuncion(funciones, clave)) return false;
    return usuario ? usuarioVeModulo(usuario.rol, usuario.modulos, clave) : true;
  };
  const secciones = NAV_SECCIONES.map((s) => ({
    ...s,
    items: s.items.filter((n) => puedeVer(n.to)),
  })).filter((s) => s.items.length > 0);
  const nav = secciones.flatMap((s) => s.items);
  const tabsMobile = TABS_MOBILE.filter((n) => puedeVer(n.to));

  // Título de la cabecera: coincidencia exacta, o por prefijo para las rutas
  // de detalle/editor (p. ej. /admin/clientes/:id → "Clientes").
  const enRuta = (n: NavItem) =>
    location.pathname === n.to ||
    (n.to !== "/admin" && location.pathname.startsWith(n.to + "/"));
  const titulo = [...nav, ...tabsMobile].find(enRuta)?.label ?? "Panel";

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
      <nav data-tour="nav" className="flex-1 overflow-y-auto px-3 py-2">
        {secciones.map((s, i) => (
          <div key={s.titulo ?? i} className="mb-1">
            {s.titulo && (
              <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {s.titulo}
              </p>
            )}
            <div className="space-y-1">
              {s.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
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
            </div>
          </div>
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

      {/* Menú lateral en móvil (drawer). z alto para tapar el mapa Leaflet. */}
      {menu && (
        <div className="fixed inset-0 z-[1200] flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenu(false)} />
          <div className="relative z-10 h-full">
            {Sidebar}
            <button
              onClick={() => setMenu(false)}
              className="absolute right-3 top-4 text-white/60 hover:text-white"
              aria-label="Cerrar menú"
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenu(true)}
                className="text-forge-dark hover:text-forge-orange"
                aria-label="Menú"
              >
                <IconMenu className="h-6 w-6" />
              </button>
              <Logo />
            </div>
            <div className="flex items-center gap-3">
              <button data-tour="help" onClick={abrirAyuda} className="text-slate-400 hover:text-forge-orange" aria-label="Ayuda / guía del módulo" title="Ayuda">
                <IconHelp className="h-6 w-6" />
              </button>
              <NavLink to="/admin/notificaciones" className="relative text-forge-dark">
                <Avatar nombre={usuario.nombre} color={usuario.color} size={38} />
                {sinLeer > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-forge-orange px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {sinLeer}
                  </span>
                )}
              </NavLink>
            </div>
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
            <button data-tour="help" onClick={abrirAyuda} className="text-slate-400 hover:text-forge-orange" aria-label="Ayuda / guía del módulo" title="Ayuda de este módulo">
              <IconHelp className="h-6 w-6" />
            </button>
            <NavLink to="/admin/notificaciones" data-tour="bell" className="relative text-slate-400 hover:text-forge-dark">
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

        <main data-tour="content" className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Barra de navegación inferior en móvil */}
      <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {tabsMobile.map(({ to, label, icon: Icon, end }) => (
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

      {tour && <Tour tour={tour} onClose={() => setTour(null)} />}
    </div>
  );
}
