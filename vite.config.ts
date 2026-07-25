import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Ya mantenemos public/manifest.webmanifest a mano (enlazado desde
      // index.html); el plugin solo aporta el service worker necesario
      // para que Chrome/Android ofrezcan la instalación completa como app.
      manifest: false,
      injectRegister: "auto",
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Los logos de la web de marketing son grandes y solo se ven en el
        // apex; no tiene sentido precachearlos en la app de cada cliente.
        globIgnores: ["**/fichaloop_*"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Permite abrir el dev server a través de túneles ngrok (pruebas desde
    // el móvil fuera de la red local). Solo afecta al server de desarrollo.
    allowedHosts: [".ngrok-free.app", ".ngrok.app", ".ngrok.io"],
  },
});
