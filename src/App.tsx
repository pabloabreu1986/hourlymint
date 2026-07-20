import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Cargando } from "@/components/ui";
import { alertasApi } from "@/services";
import type { Rol } from "@/lib/types";
import type { ReactNode } from "react";

import Login from "@/features/auth/Login";

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
import AdminConfiguracion from "@/features/admin/AdminConfiguracion";
import AdminNotificaciones from "@/features/admin/AdminNotificaciones";

const INTERVALO_REVISION_FICHAJES = 5 * 60 * 1000; // 5 min

function Guard({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { usuario, cargando } = useAuth();

  useEffect(() => {
    if (!usuario) return;
    alertasApi.revisarFichajesFaltantes();
    const id = setInterval(alertasApi.revisarFichajesFaltantes, INTERVALO_REVISION_FICHAJES);
    return () => clearInterval(id);
  }, [usuario]);

  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol !== rol) {
    return <Navigate to={usuario.rol === "admin" ? "/admin" : "/"} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { usuario, cargando } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          cargando ? (
            <Cargando />
          ) : usuario ? (
            <Navigate to={usuario.rol === "admin" ? "/admin" : "/"} replace />
          ) : (
            <Login />
          )
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
        <Route path="/" element={<Home />} />
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
        <Route path="/admin/partes" element={<AdminPartes />} />
        <Route path="/admin/fotografias" element={<AdminFotografias />} />
        <Route path="/admin/materiales" element={<AdminMateriales />} />
        <Route path="/admin/incidencias" element={<AdminIncidencias />} />
        <Route path="/admin/vehiculos" element={<AdminRecursos tab="vehiculos" />} />
        <Route path="/admin/herramientas" element={<AdminRecursos tab="herramientas" />} />
        <Route path="/admin/almacen" element={<AdminRecursos tab="almacen" />} />
        <Route path="/admin/informes" element={<AdminInformes />} />
        <Route path="/admin/notificaciones" element={<AdminNotificaciones />} />
        <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
