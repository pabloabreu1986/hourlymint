import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Usuario } from "@/lib/types";
import { authApi } from "@/services";
import { esApex, usuarioPermitidoEnHost } from "@/lib/host";

const SESSION_KEY = "forgevia.session";

function errorDeAcceso(): Error {
  return new Error(
    esApex()
      ? "Acceso reservado a la plataforma. Entra desde el dominio de tu empresa."
      : "El administrador de la plataforma accede desde fichaloop.com."
  );
}

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean;
  login: (usuario: string, password: string) => Promise<Usuario>;
  logout: () => void;
  /** Refresca el usuario en sesión desde la BD (tras editar el perfil). */
  refrescar: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Rehidratar la sesión guardada (persiste "para siempre" en localStorage).
  useEffect(() => {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      setCargando(false);
      return;
    }
    authApi
      .getUsuarioById(id)
      .then((u) => {
        if (u && u.activo && usuarioPermitidoEnHost(u)) {
          setUsuario(u);
        } else {
          // Sesión no válida para este dominio: la limpiamos.
          localStorage.removeItem(SESSION_KEY);
          setUsuario(null);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  async function login(nombre: string, password: string) {
    const u = await authApi.login({ usuario: nombre, password });
    // Credenciales correctas, pero el usuario no puede entrar por este dominio.
    if (!usuarioPermitidoEnHost(u)) throw errorDeAcceso();
    localStorage.setItem(SESSION_KEY, u.id);
    setUsuario(u);
    return u;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUsuario(null);
  }

  async function refrescar() {
    if (!usuario) return;
    const u = await authApi.getUsuarioById(usuario.id);
    setUsuario(u);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, refrescar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
