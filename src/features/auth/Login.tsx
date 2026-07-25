import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { KineticGridBackground } from "@/components/KineticGridBackground";

// Login de cliente (se muestra en su subdominio: nombreempresa.fichaloop.com),
// pintado con la marca del tenant activo.
export default function Login() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-12 overflow-hidden bg-forge-dark px-6 py-16 text-white">
      <KineticGridBackground className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-forge-dark/70" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <Logo variant="light" className="scale-125" />
        <h1 className="mt-10 text-lg font-semibold text-white/90">Iniciar sesión</h1>
      </div>

      {/* Formulario */}
      <div className="relative z-10 mx-auto w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
