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
        // ── Tokens semánticos shadcn/ui (definidos en index.css) ──
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 2px)",
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
