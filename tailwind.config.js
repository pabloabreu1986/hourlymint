/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta de marca FORGEVIA (extraída del logo)
        forge: {
          // Azul carbón / navy del logo y sidebars
          dark: "#232B36",
          slate: "#2E3846",
          steel: "#3B4756",
          // Naranja terracota (acento principal)
          orange: "#BE6B39",
          "orange-600": "#A85B2E",
          "orange-400": "#D08853",
          // Fondos
          canvas: "#F4F5F7",
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
