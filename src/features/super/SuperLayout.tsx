import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui";
import { IconLogout } from "@/components/icons";

// Consola de plataforma (super-admin). Su aspecto es fijo y neutro: es
// el panel del operador, no de un cliente, así que no se tiñe con la
// marca de ningún tenant.
export default function SuperLayout() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;

  return (
    <div className="flex min-h-full flex-col bg-slate-100">
      <header
        className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight">
            fichaloop<span className="text-sky-400">.</span>
          </span>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
            Consola
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar nombre={usuario.nombre} color={usuario.color} size={32} />
            <span className="hidden text-sm font-medium sm:block">{usuario.nombre}</span>
          </div>
          <button
            onClick={logout}
            className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar sesión"
          >
            <IconLogout className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 pb-24 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
