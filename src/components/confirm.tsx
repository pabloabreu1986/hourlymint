import { useEffect, useState, type ReactNode } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

// Diálogo de confirmación imperativo, con la marca (sustituye a window.confirm).
// Uso:  if (!(await confirmar({ titulo: "¿Eliminar?", mensaje: "…" }))) return;
// Requiere montar <ConfirmHost /> una vez en el árbol (está en App.tsx).

export interface OpcionesConfirm {
  titulo?: string;
  mensaje?: ReactNode;
  confirmar?: string; // texto del botón de aceptar
  cancelar?: string; // texto del botón de cancelar
  peligro?: boolean; // botón rojo (acción destructiva)
}

interface Peticion extends OpcionesConfirm {
  id: number;
  resolver: (ok: boolean) => void;
}

let emitir: ((p: Peticion) => void) | null = null;
let contador = 0;

export function confirmar(opts: OpcionesConfirm = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!emitir) {
      // Sin host montado: no bloqueamos la app, aceptamos por defecto.
      resolve(true);
      return;
    }
    emitir({ id: ++contador, resolver: resolve, ...opts });
  });
}

export function ConfirmHost() {
  const [peticion, setPeticion] = useState<Peticion | null>(null);

  useEffect(() => {
    emitir = (p) => setPeticion(p);
    return () => {
      emitir = null;
    };
  }, []);

  const cerrar = (ok: boolean) => {
    peticion?.resolver(ok);
    setPeticion(null);
  };

  const abierto = peticion !== null;
  const peligro = peticion?.peligro ?? true;

  return (
    <AlertDialog.Root open={abierto} onOpenChange={(o) => { if (!o) cerrar(false); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[1500] bg-black/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[1500] w-[min(26rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-card focus:outline-none">
          <AlertDialog.Title className="text-lg font-bold text-forge-dark">
            {peticion?.titulo ?? "¿Confirmar?"}
          </AlertDialog.Title>
          {peticion?.mensaje != null && (
            <AlertDialog.Description className="mt-2 text-sm text-slate-500">
              {peticion.mensaje}
            </AlertDialog.Description>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-forge-dark hover:bg-slate-50">
              {peticion?.cancelar ?? "Cancelar"}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={() => cerrar(true)}
              className={
                "rounded-xl px-4 py-2 text-sm font-semibold text-white " +
                (peligro
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-forge-orange hover:brightness-95")
              }
            >
              {peticion?.confirmar ?? "Eliminar"}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
