// Límite de tamaño para subidas (fotos y vídeo). Coincide con el
// file_size_limit configurado en el bucket `fotos-obra` de Supabase.
export const MAX_UPLOAD_MB = 50;

/** null si el archivo es válido; si no, un mensaje listo para mostrar. */
export function errorDeTamano(file: File): string | null {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `"${file.name}" pesa ${mb}MB. El máximo permitido es ${MAX_UPLOAD_MB}MB.`;
  }
  return null;
}
