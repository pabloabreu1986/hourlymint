import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/ui";
import { IconUser, IconEye, IconEyeOff, IconClock } from "@/components/icons";

export default function Login() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  function irAContrasena(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(usuario, password);
      // La navegación la resuelve <App> según el rol.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-forge-dark px-6 pb-10 pt-16 text-white">
      {/* Logo / splash */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <Logo variant="light" className="scale-125" />
        <h1 className="mt-10 text-lg font-semibold text-white/90">Iniciar sesión</h1>
      </div>

      {/* Formulario */}
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
        <div className="relative">
          <IconUser className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <input
            className="w-full rounded-xl border border-white/15 bg-white/10 py-3.5 pl-12 pr-4 text-white placeholder:text-white/40 outline-none focus:border-forge-orange focus:ring-2 focus:ring-forge-orange/30"
            placeholder="Usuario"
            name="username"
            autoComplete="username"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            onKeyDown={irAContrasena}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </div>

        <div className="relative">
          <IconClock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <input
            ref={passwordRef}
            className="w-full rounded-xl border border-white/15 bg-white/10 py-3.5 pl-12 pr-12 text-white placeholder:text-white/40 outline-none focus:border-forge-orange focus:ring-2 focus:ring-forge-orange/30"
            placeholder="Contraseña"
            name="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            type={verPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setVerPass((v) => !v)}
            className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-white/50"
            style={{ touchAction: "manipulation" }}
            aria-label="Mostrar contraseña"
          >
            {verPass ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        <button
          type="submit"
          disabled={cargando}
          style={{ touchAction: "manipulation" }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-forge-orange py-3.5 font-bold text-white transition hover:bg-forge-orange-600 active:scale-[.99] disabled:opacity-60"
        >
          {cargando ? <Spinner className="h-5 w-5" /> : "ENTRAR"}
        </button>

        <button
          type="button"
          className="mx-auto block text-sm text-white/50"
          onClick={() =>
            setError(
              "Contacta con administración para restablecer tu contraseña."
            )
          }
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </div>
  );
}
