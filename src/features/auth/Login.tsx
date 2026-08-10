import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { KineticGridBackground } from "@/components/KineticGridBackground";
import { CreditoFichaloop } from "@/components/CreditoFichaloop";
import { tenantActual } from "@/lib/branding";

// Login de cliente (se muestra en su subdominio: nombreempresa.fichaloop.com),
// pintado con la marca del tenant activo.
export default function Login() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-12 overflow-hidden bg-forge-dark px-6 py-16 text-white">
      <KineticGridBackground className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-forge-dark/70" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <Logo variant="light" showText={false} markClassName="h-24 w-24" />
        <h1 className="mt-8 text-center text-lg font-semibold text-white/90">
          Inicia tu sesión en {tenantActual().nombreCorto}
        </h1>
      </div>

      {/* Formulario */}
      <div className="relative z-10 mx-auto w-full max-w-sm">
        <LoginForm />
      </div>

      {/* Crédito de la plataforma */}
      <div className="absolute inset-x-0 bottom-5 z-10 text-center">
        <CreditoFichaloop className="text-xs text-white/40" />
      </div>
    </div>
  );
}
