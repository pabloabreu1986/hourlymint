// Mapa real (OpenStreetMap + Leaflet) con la ubicación GPS de los fichajes.
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { Coordenada } from "@/lib/types";

export interface MapPin {
  id: string;
  coord: Coordenada;
  color: string;
  label?: string;
}

const MADRID: [number, number] = [40.4168, -3.7038];

function pinIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

/** Centra/ajusta el mapa a los pines cada vez que cambian. */
function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].coord.lat, pins[0].coord.lng], 15);
    } else {
      map.fitBounds(
        L.latLngBounds(pins.map((p) => [p.coord.lat, p.coord.lng])),
        { padding: [30, 30] }
      );
    }
  }, [pins, map]);
  return null;
}

export function WorkerMap({
  pins,
  className = "",
  height = 200,
}: {
  pins: MapPin[];
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={MADRID}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pins={pins} />
        {pins.map((p) => (
          <Marker key={p.id} position={[p.coord.lat, p.coord.lng]} icon={pinIcon(p.color)}>
            {p.label && <Tooltip>{p.label}</Tooltip>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
