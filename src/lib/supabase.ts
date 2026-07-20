// Cliente Supabase. Se activa SOLO si hay credenciales en el entorno
// (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY). Si no, la app funciona
// con la capa mock de localStorage. Así el mismo código corre en ambos
// modos y la migración es simplemente rellenar el .env.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true si hay credenciales y debemos usar Supabase en vez de los mocks. */
export const isSupabaseEnabled = Boolean(url && anonKey);

/** Bucket de Storage (privado) donde se guardan las fotos de obra. */
export const FOTOS_BUCKET =
  (import.meta.env.VITE_SUPABASE_FOTOS_BUCKET as string | undefined) || "fotos-obra";

let _client: SupabaseClient | null = null;

/** Cliente Supabase. Lanza si se usa sin credenciales (no debería pasar:
 * los servicios comprueban `isSupabaseEnabled` antes). */
export function sb(): SupabaseClient {
  if (!_client) {
    if (!isSupabaseEnabled) {
      throw new Error(
        "Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY."
      );
    }
    _client = createClient(url!, anonKey!, {
      auth: { persistSession: false }, // usamos nuestra propia sesión simple
    });
  }
  return _client;
}
