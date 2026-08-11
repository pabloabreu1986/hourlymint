import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { KineticGridBackground } from "@/components/KineticGridBackground";
import { DOMINIO_PLATAFORMA } from "@/lib/host";

// Login del operador de plataforma (super-admin) en el apex (fichaloop.com).
// Ruta estable y directa: fichaloop.com/login. La navegación tras entrar la
// resuelve <App> según el rol (superadmin → /super).
export default function LoginOperador() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-12 overflow-hidden bg-forge-dark px-6 py-16 text-white">
      <KineticGridBackground className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-forge-dark/70" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <Logo variant="light" showText={false} markClassName="h-20 w-20" />
        <h1 className="mt-8 text-center text-lg font-semibold text-white/90">
          Acceso operador de plataforma
        </h1>
        <p className="mt-1 text-center text-sm text-white/40">
          Panel de administración de {DOMINIO_PLATAFORMA}
        </p>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-sm">
        <LoginForm />
        <Link
          to="/"
          className="mt-6 block text-center text-sm text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white/70"
        >
          ← Acceso de clientes
        </Link>
      </div>
    </div>
  );
}
