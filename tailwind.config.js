/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta de marca por cliente (white-label). Los valores viven en
        // variables CSS (--brand-*) que inyecta src/lib/branding.ts en
        // runtime; así cada tenant repinta la app sin rebuild. El formato
        // `rgb(var(--x) / <alpha-value>)` preserva las opacidades (p.ej.
        // bg-forge-orange/10). Valores por defecto (FORGEVIA) en index.css.
        forge: {
          dark: "rgb(var(--brand-dark) / <alpha-value>)",
          slate: "rgb(var(--brand-slate) / <alpha-value>)",
          steel: "rgb(var(--brand-steel) / <alpha-value>)",
          orange: "rgb(var(--brand-orange) / <alpha-value>)",
          "orange-600": "rgb(var(--brand-orange-600) / <alpha-value>)",
          "orange-400": "rgb(var(--brand-orange-400) / <alpha-value>)",
          canvas: "rgb(var(--brand-canvas) / <alpha-value>)",
        },
        estado: {
          curso: "#16A34A",
          pendiente: "#D97706",
          alerta: "#DC2626",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
        "card-lg": "0 4px 16px rgba(16,24,40,0.08)",
      },
    },
  },
  plugins: [],
};
