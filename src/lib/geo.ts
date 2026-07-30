// Captura de GPS del teléfono al fichar. Usa la API del navegador. Si el
// usuario deniega el permiso o falla, se guarda `null` ("Sin ubicación"):
// preferimos no registrar una posición que no sea la real (el admin ve
// ubicaciones fiables).
import type { Coordenada } from "./types";

export function capturarGPS(): Promise<Coordenada | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });
}

/** Texto corto de coordenadas: "40.4168, -3.7038" */
export function coordText(c: Coordenada | null): string {
  if (!c) return "Sin ubicación";
  return `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`;
}
