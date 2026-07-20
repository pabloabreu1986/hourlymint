// Comprime una imagen a un data URL pequeño para poder guardarla en
// localStorage sin agotar la cuota. Mock: en producción subiríamos el
// fichero a un bucket y guardaríamos la URL.
export function fileToThumbDataURL(file: File, maxSize = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convierte un data URL (base64) a Blob para subirlo a Storage. */
export function dataURLtoBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
