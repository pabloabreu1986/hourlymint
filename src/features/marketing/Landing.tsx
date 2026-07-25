import { type ReactNode } from "react";
import { LoginForm } from "@/components/LoginForm";
import logoDark from "@/assets/fichaloop_white.png"; // escudo claro → fondos oscuros
import logoLight from "@/assets/fichaloop_black.png"; // escudo oscuro → fondos claros
import {
  IconMapPin,
  IconClipboard,
  IconCamera,
  IconBox,
  IconAlert,
  IconTruck,
  IconChart,
  IconClock,
  IconObras,
  IconCheck,
} from "@/components/icons";

// ─── Web pública de fichaloop.com (dominio raíz / apex). Enfocada a
// dueños de pymes de obra y servicios de campo. El login del hero entra
// a la app; en el subdominio de cada cliente se ve su login con su marca.

const NARANJA = "#E8721C";
const CARBON = "#0F1720";

export default function Landing() {
  return (
    <div className="min-h-full bg-white text-slate-800">
      <Nav />
      <Hero />
      <Dolores />
      <Funciones />
      <ComoFunciona />
      <WhiteLabel />
      <CTA />
      <Footer />
    </div>
  );
}

function Marca({ oscuro = false, className = "h-9" }: { oscuro?: boolean; className?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={oscuro ? logoDark : logoLight} alt="fichaloop" className={`${className} w-auto`} />
      <span
        className={`text-xl font-extrabold tracking-tight ${oscuro ? "text-white" : "text-slate-900"}`}
      >
        ficha<span style={{ color: NARANJA }}>loop</span>
      </span>
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0F1720]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Marca oscuro />
        <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
          <a href="#dolores" className="transition hover:text-white">El problema</a>
          <a href="#funciones" className="transition hover:text-white">Funciones</a>
          <a href="#como" className="transition hover:text-white">Cómo funciona</a>
        </nav>
        <a
          href="#acceso"
          className="rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          style={{ background: NARANJA }}
        >
          Acceder
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0F1720] text-white">
      {/* Glow decorativo */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: NARANJA }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        {/* Copy */}
        <div>
          <span
            className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70"
          >
            Control de obra y equipo · sin papeles
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Sabe quién trabaja, dónde y cuánto —{" "}
            <span style={{ color: NARANJA }}>en tiempo real</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            fichaloop reúne fichajes con GPS, partes diarios, fotos de obra y horas
            reales en una sola app. Tus encargados y trabajadores la usan desde el
            móvil; tú lo ves todo desde el panel.
          </p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              "Fichajes con ubicación y hora exacta",
              "Partes diarios firmados, sin papel",
              "Horas listas para la nómina",
              "Tu marca y tu dominio propio",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-white/80">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white"
                  style={{ background: NARANJA }}
                >
                  <IconCheck className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Acceso / login */}
        <div id="acceso" className="scroll-mt-24">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
            <h2 className="text-lg font-bold text-white">Acceso clientes</h2>
            <p className="mt-1 text-sm text-white/50">
              Entra con tu usuario. ¿Tu empresa aún no está?{" "}
              <a href="#contacto" className="underline decoration-white/30 hover:text-white">
                Habla con nosotros
              </a>
              .
            </p>
            <div className="mt-5">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const DOLORES: Array<{ dolor: string; solucion: string }> = [
  {
    dolor: "«No sé si han fichado ni a qué hora llegaron de verdad.»",
    solucion: "Fichaje con GPS y hora exacta. Ves entradas, salidas y retrasos al instante.",
  },
  {
    dolor: "«Los partes llegan en papel, tarde, o directamente se pierden.»",
    solucion: "Parte diario digital firmado por el encargado. Nada se traspapela.",
  },
  {
    dolor: "«Las fotos de obra están desperdigadas en chats de WhatsApp.»",
    solucion: "Todas las fotos ordenadas por obra y por día, en un solo sitio.",
  },
  {
    dolor: "«A fin de mes no sé las horas reales para pagar la nómina.»",
    solucion: "Horas calculadas automáticamente por trabajador y por obra.",
  },
  {
    dolor: "«Materiales e incidencias los llevo de memoria y algo siempre falla.»",
    solucion: "Registro de materiales pendientes e incidencias, visibles para todos.",
  },
  {
    dolor: "«Tengo varias obras y no sé por dónde va cada una.»",
    solucion: "Panel con el avance de cada obra, su equipo y su actividad del día.",
  },
];

function Dolores() {
  return (
    <section id="dolores" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">¿Te suena?</h2>
        <p className="mt-3 text-slate-500">
          Los dueños de empresas de obra y servicios pierden horas cada semana persiguiendo
          información. fichaloop lo resuelve.
        </p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {DOLORES.map((d) => (
          <div key={d.dolor} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-[15px] font-semibold italic text-slate-700">{d.dolor}</p>
            <div className="mt-4 flex items-start gap-2">
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white"
                style={{ background: NARANJA }}
              >
                <IconCheck className="h-3 w-3" />
              </span>
              <p className="text-sm text-slate-600">{d.solucion}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const FUNCIONES: Array<{ icon: (p: { className?: string }) => ReactNode; titulo: string; texto: string }> = [
  { icon: IconMapPin, titulo: "Fichaje con GPS", texto: "Entrada y salida con ubicación y hora. Detecta retrasos y olvidos automáticamente." },
  { icon: IconClipboard, titulo: "Partes diarios", texto: "Trabajo realizado, materiales e incidencias. Cierre con firma del encargado." },
  { icon: IconCamera, titulo: "Fotos de obra", texto: "Documenta el avance con fotos ordenadas por obra y por día." },
  { icon: IconChart, titulo: "Informes y horas", texto: "Horas reales por trabajador y obra, listas para nómina y para facturar." },
  { icon: IconBox, titulo: "Materiales", texto: "Controla stock, material pendiente y almacén sin hojas de cálculo." },
  { icon: IconAlert, titulo: "Incidencias", texto: "Registra y sigue problemas de obra antes de que se conviertan en retrasos." },
  { icon: IconTruck, titulo: "Vehículos y herramientas", texto: "Sabe qué recurso está en cada obra y quién lo tiene asignado." },
  { icon: IconClock, titulo: "En tiempo real", texto: "Todo lo que pasa en obra, visible desde tu panel al momento." },
];

function Funciones() {
  return (
    <section id="funciones" className="scroll-mt-20 bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Todo el control de tu obra, en una app
          </h2>
          <p className="mt-3 text-slate-500">
            Pensada para que la usen tus trabajadores desde el móvil, con la potencia que tú
            necesitas en el escritorio.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FUNCIONES.map((f) => (
            <div key={f.titulo} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span
                className="grid h-11 w-11 place-items-center rounded-xl text-white"
                style={{ background: CARBON }}
              >
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{f.titulo}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PASOS = [
  { n: 1, titulo: "Tu equipo ficha y reporta", texto: "Trabajadores y encargados fichan con GPS y suben el parte y las fotos desde el móvil." },
  { n: 2, titulo: "El encargado cierra el día", texto: "Revisa el trabajo, añade materiales e incidencias y firma el parte diario." },
  { n: 3, titulo: "Tú lo ves todo", texto: "Desde el panel controlas obras, horas, avance y recursos en tiempo real." },
];

function ComoFunciona() {
  return (
    <section id="como" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Cómo funciona</h2>
        <p className="mt-3 text-slate-500">Tres pasos. Cero papel.</p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {PASOS.map((p) => (
          <div key={p.n} className="relative">
            <span
              className="grid h-12 w-12 place-items-center rounded-xl text-lg font-extrabold text-white"
              style={{ background: NARANJA }}
            >
              {p.n}
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{p.titulo}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhiteLabel() {
  return (
    <section className="bg-[#0F1720] py-20 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
        <div>
          <span
            className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70"
          >
            Marca blanca
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight">
            Tu empresa, tu marca, tu dominio.
          </h2>
          <p className="mt-4 max-w-lg text-white/70">
            Tus trabajadores no entran a «otra app más»: entran a la de tu empresa. Con tu
            logo, tus colores y tu propia dirección web. Nosotros la configuramos para ti.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Tu logo y tus colores en toda la app",
              "Dominio propio: tuempresa.fichaloop.com",
              "Activa solo las funciones que necesitas",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-white/80">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white" style={{ background: NARANJA }}>
                  <IconCheck className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 font-mono text-sm text-white/80">
            <IconObras className="h-5 w-5" style={{ color: NARANJA }} />
            tuempresa<span className="text-white/40">.fichaloop.com</span>
          </div>
          <p className="mt-4 text-sm text-white/50">
            Cada cliente accede a su espacio en su propio subdominio, con su identidad. Igual
            que ves aquí, pero con tu marca.
          </p>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contacto" className="scroll-mt-20 bg-slate-50 py-20">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Deja el papel atrás.
        </h2>
        <p className="mt-3 text-slate-500">
          Cuéntanos cómo trabajas y montamos fichaloop a la medida de tu empresa.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="mailto:hola@fichaloop.com"
            className="rounded-xl px-6 py-3.5 font-bold text-white transition hover:brightness-110"
            style={{ background: NARANJA }}
          >
            Solicitar una demo
          </a>
          <a
            href="#acceso"
            className="rounded-xl border border-slate-300 px-6 py-3.5 font-bold text-slate-700 transition hover:bg-white"
          >
            Ya soy cliente
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0F1720] text-white">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Marca oscuro />
            <p className="mt-4 text-sm text-white/50">
              Control de fichajes, obras y partes diarios para empresas de obra y servicios de
              campo. Sin papeles, en tiempo real.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <p className="font-semibold text-white/90">Producto</p>
              <ul className="mt-3 space-y-2 text-white/50">
                <li><a href="#funciones" className="hover:text-white">Funciones</a></li>
                <li><a href="#como" className="hover:text-white">Cómo funciona</a></li>
                <li><a href="#acceso" className="hover:text-white">Acceso clientes</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white/90">Contacto</p>
              <ul className="mt-3 space-y-2 text-white/50">
                <li><a href="mailto:hola@fichaloop.com" className="hover:text-white">hola@fichaloop.com</a></li>
                <li><a href="#contacto" className="hover:text-white">Solicitar demo</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
          <p>© {"2026"} fichaloop. Todos los derechos reservados.</p>
          <p>
            Desarrollado por{" "}
            <a
              href="https://ensodev.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/70 underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              ensodev.eu
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
