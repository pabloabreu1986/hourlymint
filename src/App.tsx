import { useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Cargando } from "@/components/ui";
import { alertasApi } from "@/services";
import { tenantActual } from "@/lib/branding";
import { tenantTieneFuncion, usuarioVeModulo } from "@/lib/funciones";
import { esApex, recordarEspacio } from "@/lib/host";
import type { Rol } from "@/lib/types";
import type { ReactNode } from "react";

import Login from "@/features/auth/Login";

/**
 * Si falla la carga de un chunk lazy (típico justo tras un despliegue:
 * la pestaña tiene el index antiguo y pide un archivo que ya no existe
 * en el servidor), recargamos una vez para coger la versión nueva en
 * vez de dejar la página en blanco.
 */
const CLAVE_RECARGA = "fichaloop.recarga-chunk";
function lazyConRecarga(fn: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    fn().then(
      (mod) => {
        sessionStorage.removeItem(CLAVE_RECARGA);
        return mod;
      },
      (err) => {
        if (!sessionStorage.getItem(CLAVE_RECARGA)) {
          sessionStorage.setItem(CLAVE_RECARGA, "1");
          window.location.reload();
        }
        throw err;
      }
    )
  );
}

// La web de marketing (logos grandes) solo se carga en el apex.
const Landing = lazyConRecarga(() => import("@/features/marketing/Landing"));
const Terminos = lazyConRecarga(() => import("@/features/marketing/Terminos"));
const Funcionalidades = lazyConRecarga(() => import("@/features/marketing/Funcionalidades"));
// Mini-web pública de cada cliente (en su subdominio).
const WebCliente = lazyConRecarga(() => import("@/features/web/WebCliente"));
// Vista previa del dosier a pantalla completa (imprimible a PDF).
const DosierPreview = lazyConRecarga(() => import("@/features/dosier/DosierPreview"));

/** Al cambiar de ruta, vuelve arriba (React Router conserva el scroll). */
function ScrollArriba() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Trabajador (móvil)
import WorkerLayout from "@/features/worker/WorkerLayout";
import Home from "@/features/worker/Home";
import MisObras from "@/features/worker/MisObras";
import ObraDetalle from "@/features/worker/ObraDetalle";
import ParteDiario from "@/features/worker/ParteDiario";
import CierreParte from "@/features/worker/CierreParte";
import Fotografias from "@/features/worker/Fotografias";
import Notificaciones from "@/features/worker/Notificaciones";
import Perfil from "@/features/worker/Perfil";
import MisAusencias from "@/features/worker/MisAusencias";
import MisGastos from "@/features/worker/MisGastos";
import MisDocumentos from "@/features/worker/MisDocumentos";
import MiEmpresa from "@/features/worker/MiEmpresa";

// Admin (escritorio)
import AdminLayout from "@/features/admin/AdminLayout";
import Dashboard from "@/features/admin/Dashboard";
import AdminObras from "@/features/admin/AdminObras";
import AdminTrabajadores from "@/features/admin/AdminTrabajadores";
import AdminPartes from "@/features/admin/AdminPartes";
import AdminFotografias from "@/features/admin/AdminFotografias";
import AdminMateriales from "@/features/admin/AdminMateriales";
import AdminIncidencias from "@/features/admin/AdminIncidencias";
import AdminRecursos from "@/features/admin/AdminRecursos";
import AdminInformes from "@/features/admin/AdminInformes";
import AdminHoras from "@/features/admin/AdminHoras";
import AdminConfiguracion from "@/features/admin/AdminConfiguracion";
import AdminDosier from "@/features/admin/AdminDosier";
import AdminPerfil from "@/features/admin/AdminPerfil";
import AdminNotificaciones from "@/features/admin/AdminNotificaciones";
// Suite RRHH
import AdminAusencias from "@/features/admin/AdminAusencias";
import AdminTurnos from "@/features/admin/AdminTurnos";
import AdminGastos from "@/features/admin/AdminGastos";
import AdminNomina from "@/features/admin/AdminNomina";
import AdminDocumentos from "@/features/admin/AdminDocumentos";
import AdminTalento from "@/features/admin/AdminTalento";
import AdminOrganigrama from "@/features/admin/AdminOrganigrama";
import AdminComunicados from "@/features/admin/AdminComunicados";
import AdminDenuncias from "@/features/admin/AdminDenuncias";

// Super-admin (consola de plataforma)
import SuperLayout from "@/features/super/SuperLayout";
import SuperClientes from "@/features/super/SuperClientes";
import SuperTenantEditor from "@/features/super/SuperTenantEditor";

const INTERVALO_REVISION_FICHAJES = 5 * 60 * 1000; // 5 min

/** Ruta de inicio según el rol del usuario. */
function inicioDe(rol: Rol): string {
  if (rol === "superadmin") return "/super";
  if (rol === "admin" || rol === "directivo") return "/admin";
  return "/inicio";
}

/**
 * Raíz pública ("/"). Sin sesión: en el apex (fichaloop.com) muestra la
 * web de marketing; en un subdominio de cliente, su mini-web pública si
 * la tiene configurada (WebCliente cae al login si no la hay). Con
 * sesión, redirige al inicio según el rol.
 */
function RaizPublica() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (usuario) return <Navigate to={inicioDe(usuario.rol)} replace />;
  return (
    <Suspense fallback={<Cargando />}>
      {esApex() ? <Landing /> : <WebCliente />}
    </Suspense>
  );
}

/** "/login": en un subdominio siempre es el login del cliente (aunque
 * tenga web pública); en el apex se comporta como la raíz. */
function LoginPublico() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (usuario) return <Navigate to={inicioDe(usuario.rol)} replace />;
  if (!esApex()) return <Login />;
  return <RaizPublica />;
}

function Guard({ rol, children }: { rol: Rol | Rol[]; children: ReactNode }) {
  const { usuario, cargando } = useAuth();

  useEffect(() => {
    if (!usuario) return;
    const revisar = () => {
      alertasApi.revisarFichajesFaltantes();
      alertasApi.revisarSalidasAutomaticas();
    };
    revisar();
    const id = setInterval(revisar, INTERVALO_REVISION_FICHAJES);
    return () => clearInterval(id);
  }, [usuario]);

  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/" replace />;
  const permitidos = Array.isArray(rol) ? rol : [rol];
  if (!permitidos.includes(usuario.rol)) {
    return <Navigate to={inicioDe(usuario.rol)} replace />;
  }
  return <>{children}</>;
}

/** Bloquea el acceso directo a un módulo admin desactivado para el tenant
 * o no habilitado para este usuario (permisos por directivo). */
function FuncionRoute({ clave, children }: { clave: string; children: ReactNode }) {
  const { usuario } = useAuth();
  if (!tenantTieneFuncion(tenantActual().funciones, clave)) {
    return <Navigate to="/admin" replace />;
  }
  if (usuario && !usuarioVeModulo(usuario.rol, usuario.modulos, clave)) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  // En un subdominio de cliente, recuerda el espacio en la cookie del
  // dominio padre (para el "Continuar a tuempresa →" del apex).
  useEffect(() => {
    recordarEspacio();
  }, []);

  return (
    <>
    <ScrollArriba />
    <Routes>
      {/* Raíz pública: web de marketing (apex) o login de cliente (subdominio) */}
      <Route path="/" element={<RaizPublica />} />
      <Route path="/login" element={<LoginPublico />} />
      <Route
        path="/terminos"
        element={
          <Suspense fallback={<Cargando />}>
            <Terminos />
          </Suspense>
        }
      />
      <Route
        path="/funcionalidades"
        element={
          <Suspense fallback={<Cargando />}>
            <Funcionalidades />
          </Suspense>
        }
      />

      {/* Vista previa del dosier a pantalla completa (fuera del layout
          admin para imprimirse limpia). Solo el admin de la empresa. */}
      <Route
        path="/dosier"
        element={
          <Guard rol={["admin", "directivo"]}>
            <Suspense fallback={<Cargando />}>
              <DosierPreview />
            </Suspense>
          </Guard>
        }
      />

      {/* ── Trabajador ── */}
      <Route
        element={
          <Guard rol="trabajador">
            <WorkerLayout />
          </Guard>
        }
      >
        <Route path="/inicio" element={<Home />} />
        <Route path="/obras" element={<MisObras />} />
        <Route path="/obras/:id" element={<ObraDetalle />} />
        <Route path="/obras/:id/parte" element={<ParteDiario />} />
        <Route path="/obras/:id/cierre" element={<CierreParte />} />
        <Route path="/fotos" element={<Fotografias />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/perfil" element={<Perfil />} />
        {/* Suite RRHH (según funciones del tenant; accesos desde Perfil) */}
        <Route path="/ausencias" element={<MisAusencias />} />
        <Route path="/gastos" element={<MisGastos />} />
        <Route path="/documentos" element={<MisDocumentos />} />
        <Route path="/empresa" element={<MiEmpresa />} />
      </Route>

      {/* ── Admin ── */}
      <Route
        element={
          <Guard rol={["admin", "directivo"]}>
            <AdminLayout />
          </Guard>
        }
      >
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/obras" element={<FuncionRoute clave="obras"><AdminObras /></FuncionRoute>} />
        <Route path="/admin/trabajadores" element={<FuncionRoute clave="trabajadores"><AdminTrabajadores /></FuncionRoute>} />
        <Route path="/admin/partes" element={<FuncionRoute clave="partes"><AdminPartes /></FuncionRoute>} />
        <Route path="/admin/fotografias" element={<FuncionRoute clave="fotografias"><AdminFotografias /></FuncionRoute>} />
        <Route path="/admin/materiales" element={<FuncionRoute clave="materiales"><AdminMateriales /></FuncionRoute>} />
        <Route path="/admin/incidencias" element={<FuncionRoute clave="incidencias"><AdminIncidencias /></FuncionRoute>} />
        <Route path="/admin/vehiculos" element={<FuncionRoute clave="vehiculos"><AdminRecursos tab="vehiculos" /></FuncionRoute>} />
        <Route path="/admin/herramientas" element={<FuncionRoute clave="herramientas"><AdminRecursos tab="herramientas" /></FuncionRoute>} />
        <Route path="/admin/almacen" element={<FuncionRoute clave="almacen"><AdminRecursos tab="almacen" /></FuncionRoute>} />
        <Route path="/admin/informes" element={<FuncionRoute clave="informes"><AdminInformes /></FuncionRoute>} />
        <Route path="/admin/horas" element={<FuncionRoute clave="horas"><AdminHoras /></FuncionRoute>} />
        {/* Suite RRHH */}
        <Route path="/admin/ausencias" element={<FuncionRoute clave="ausencias"><AdminAusencias /></FuncionRoute>} />
        <Route path="/admin/turnos" element={<FuncionRoute clave="turnos"><AdminTurnos /></FuncionRoute>} />
        <Route path="/admin/gastos" element={<FuncionRoute clave="gastos"><AdminGastos /></FuncionRoute>} />
        <Route path="/admin/nomina" element={<FuncionRoute clave="nomina"><AdminNomina /></FuncionRoute>} />
        <Route path="/admin/documentos" element={<FuncionRoute clave="documentos"><AdminDocumentos /></FuncionRoute>} />
        <Route path="/admin/evaluaciones" element={<FuncionRoute clave="evaluaciones"><AdminTalento tab="evaluaciones" /></FuncionRoute>} />
        <Route path="/admin/metas" element={<FuncionRoute clave="metas"><AdminTalento tab="metas" /></FuncionRoute>} />
        <Route path="/admin/onboarding" element={<FuncionRoute clave="onboarding"><AdminTalento tab="onboarding" /></FuncionRoute>} />
        <Route path="/admin/organigrama" element={<FuncionRoute clave="organigrama"><AdminOrganigrama /></FuncionRoute>} />
        <Route path="/admin/comunicados" element={<FuncionRoute clave="comunicados"><AdminComunicados /></FuncionRoute>} />
        <Route path="/admin/denuncias" element={<FuncionRoute clave="denuncias"><AdminDenuncias /></FuncionRoute>} />
        <Route path="/admin/dosier" element={<FuncionRoute clave="dosier"><AdminDosier /></FuncionRoute>} />
        <Route path="/admin/notificaciones" element={<AdminNotificaciones />} />
        <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
        <Route path="/admin/perfil" element={<AdminPerfil />} />
      </Route>

      {/* ── Super-admin (plataforma) ── */}
      <Route
        element={
          <Guard rol="superadmin">
            <SuperLayout />
          </Guard>
        }
      >
        <Route path="/super" element={<SuperClientes />} />
        <Route path="/super/clientes/:id" element={<SuperTenantEditor />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
