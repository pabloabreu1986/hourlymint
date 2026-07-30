import { useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Cargando } from "@/components/ui";
import { alertasApi } from "@/services";
import { tenantActual } from "@/lib/branding";
import { tenantTieneFuncion } from "@/lib/funciones";
import { esApex } from "@/lib/host";
import type { Rol } from "@/lib/types";
import type { ReactNode } from "react";

import Login from "@/features/auth/Login";
// La web de marketing (logos grandes) solo se carga en el apex.
const Landing = lazy(() => import("@/features/marketing/Landing"));
const Terminos = lazy(() => import("@/features/marketing/Terminos"));

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
import AdminPerfil from "@/features/admin/AdminPerfil";
import AdminNotificaciones from "@/features/admin/AdminNotificaciones";

// Super-admin (consola de plataforma)
import SuperLayout from "@/features/super/SuperLayout";
import SuperClientes from "@/features/super/SuperClientes";
import SuperTenantEditor from "@/features/super/SuperTenantEditor";

const INTERVALO_REVISION_FICHAJES = 5 * 60 * 1000; // 5 min

/** Ruta de inicio según el rol del usuario. */
function inicioDe(rol: Rol): string {
  return rol === "superadmin" ? "/super" : rol === "admin" ? "/admin" : "/inicio";
}

/**
 * Raíz pública ("/"). Sin sesión: en el apex (fichaloop.com) muestra la
 * web de marketing; en un subdominio de cliente, su login con su marca.
 * Con sesión, redirige al inicio según el rol.
 */
function RaizPublica() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (usuario) return <Navigate to={inicioDe(usuario.rol)} replace />;
  if (!esApex()) return <Login />;
  return (
    <Suspense fallback={<Cargando />}>
      <Landing />
    </Suspense>
  );
}

function Guard({ rol, children }: { rol: Rol; children: ReactNode }) {
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
  if (usuario.rol !== rol) {
    return <Navigate to={inicioDe(usuario.rol)} replace />;
  }
  return <>{children}</>;
}

/** Bloquea el acceso directo a un módulo admin desactivado para el tenant. */
function FuncionRoute({ clave, children }: { clave: string; children: ReactNode }) {
  if (!tenantTieneFuncion(tenantActual().funciones, clave)) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Raíz pública: web de marketing (apex) o login de cliente (subdominio) */}
      <Route path="/" element={<RaizPublica />} />
      <Route path="/login" element={<RaizPublica />} />
      <Route
        path="/terminos"
        element={
          <Suspense fallback={<Cargando />}>
            <Terminos />
          </Suspense>
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
      </Route>

      {/* ── Admin ── */}
      <Route
        element={
          <Guard rol="admin">
            <AdminLayout />
          </Guard>
        }
      >
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/obras" element={<AdminObras />} />
        <Route path="/admin/trabajadores" element={<AdminTrabajadores />} />
        <Route path="/admin/partes" element={<FuncionRoute clave="partes"><AdminPartes /></FuncionRoute>} />
        <Route path="/admin/fotografias" element={<FuncionRoute clave="fotografias"><AdminFotografias /></FuncionRoute>} />
        <Route path="/admin/materiales" element={<FuncionRoute clave="materiales"><AdminMateriales /></FuncionRoute>} />
        <Route path="/admin/incidencias" element={<FuncionRoute clave="incidencias"><AdminIncidencias /></FuncionRoute>} />
        <Route path="/admin/vehiculos" element={<FuncionRoute clave="vehiculos"><AdminRecursos tab="vehiculos" /></FuncionRoute>} />
        <Route path="/admin/herramientas" element={<FuncionRoute clave="herramientas"><AdminRecursos tab="herramientas" /></FuncionRoute>} />
        <Route path="/admin/almacen" element={<FuncionRoute clave="almacen"><AdminRecursos tab="almacen" /></FuncionRoute>} />
        <Route path="/admin/informes" element={<FuncionRoute clave="informes"><AdminInformes /></FuncionRoute>} />
        <Route path="/admin/horas" element={<FuncionRoute clave="horas"><AdminHoras /></FuncionRoute>} />
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
  );
}
