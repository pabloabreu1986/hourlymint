// Genera el "usuario" corto de login a partir del nombre completo.
// El nombre completo (legal) se usa en documentos; el usuario es el handle
// corto para entrar en la app.

/** Normaliza a minúsculas, sin acentos ni caracteres no alfanuméricos. */
export function normalizaHandle(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Usuario de login corto a partir del nombre completo, evitando colisiones
 * con `existentes` (los usuarios ya en uso en la empresa).
 *
 * Reglas (ej. "Pablo Luis Abreu"):
 *   1. nombre                      → pablo
 *   2. + inicial del 1er apellido  → pablol
 *   3. + inicial del 2º apellido   → pablola
 *   4. + número incremental (0..)  → pablola0, pablola1, …
 */
export function generarUsuario(nombreCompleto: string, existentes: string[]): string {
  const taken = new Set(existentes.map(normalizaHandle).filter(Boolean));
  const palabras = (nombreCompleto ?? "")
    .trim()
    .split(/\s+/)
    .map(normalizaHandle)
    .filter(Boolean);

  const base = palabras[0] || "usuario";
  const a1 = palabras[1]?.[0] ?? "";
  const a2 = palabras[2]?.[0] ?? "";

  const candidatos = [base];
  if (a1) candidatos.push(base + a1);
  if (a1 && a2) candidatos.push(base + a1 + a2);

  for (const c of candidatos) if (!taken.has(c)) return c;

  const stem = candidatos[candidatos.length - 1];
  let i = 0;
  while (taken.has(stem + i)) i++;
  return stem + i;
}
