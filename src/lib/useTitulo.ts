import { useEffect } from "react";
import { fijarTituloRuta } from "@/lib/branding";

/** Fija el <title> del documento mientras la página está montada (SEO/UX en
 *  las rutas del SPA). Pasa por branding para que la hidratación async del
 *  tenant no lo pise; al desmontar, restaura el título base. */
export function useTitulo(titulo: string) {
  useEffect(() => {
    fijarTituloRuta(titulo);
    return () => fijarTituloRuta(null);
  }, [titulo]);
}
