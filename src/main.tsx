import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { aplicarTema } from "@/lib/branding";
import App from "./App";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Pinta la marca del tenant activo antes del primer render.
aplicarTema();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
