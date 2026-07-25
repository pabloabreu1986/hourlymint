import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { aplicarTema, fijarTenant } from "@/lib/branding";
import { tenantApi } from "@/services";
import App from "./App";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Pinta la marca al instante (por defecto o desde caché) antes del render…
aplicarTema();
// …y refresca desde la fuente real (Supabase por subdominio) en segundo
// plano; cuando llega, re-aplica el tema y actualiza la caché local.
tenantApi
  .getTenant()
  .then((t) => t && fijarTenant(t))
  .catch(() => {});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
