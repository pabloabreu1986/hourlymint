// Captura de GPS. Usa la API del navegador; si falla o el usuario
// deniega el permiso, cae a una posición simulada (Madrid) para el mock.
import type { Coordenada } from "./types";

const FALLBACK: Coordenada = { lat: 40.4168, lng: -3.7038 };

export function capturarGPS(): Promise<Coordenada> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(jitter(FALLBACK));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(jitter(FALLBACK)),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  });
}

function jitter(c: Coordenada): Coordenada {
  return {
    lat: c.lat + (Math.random() - 0.5) * 0.05,
    lng: c.lng + (Math.random() - 0.5) * 0.05,
  };
}

/** Texto corto de coordenadas: "40.4168, -3.7038" */
export function coordText(c: Coordenada | null): string {
  if (!c) return "Sin ubicación";
  return `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`;
}
