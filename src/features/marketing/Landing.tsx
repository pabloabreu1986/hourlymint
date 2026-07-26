import { type ReactNode } from "react";
import { LoginForm } from "@/components/LoginForm";
import { KineticGridBackground } from "@/components/KineticGridBackground";
import LiquidHover from "@/components/LiquidHover";
import logoDark from "@/assets/fichaloop_logo_dark_transparente.png";
import blueprint from "@/assets/blueprint_full.png";
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

const NARANJA = "#E8721C";

export default function Landing() {
  return (
    <div className="min-h-full bg-[#F5F3EE] text-[#101418] selection:bg-[#E8721C] selection:text-white">
      <Nav />
      <main>
        <Hero />
        <Dolores />
        <Funciones />
        <ComoFunciona />
        <WhiteLabel />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Marca({ className = "h-8" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logoDark} alt="" className={`${className} w-auto`} />
      <span className="text-xl font-extrabold tracking-[-0.04em] text-[#101418]">
        ficha<span style={{ color: NARANJA }}>loop</span>
      </span>
    </div>
  );
}

function Flecha() {
  return <span aria-hidden="true" className="text-lg leading-none">↗</span>;
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#F5F3EE]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8">
        <Marca />
        <nav className="hidden items-center gap-8 text-[13px] font-semibold uppercase tracking-[0.12em] md:flex">
          <a href="#dolores" className="transition-opacity hover:opacity-50">El problema</a>
          <a href="#funciones" className="transition-opacity hover:opacity-50">Producto</a>
          <a href="#como" className="transition-opacity hover:opacity-50">Proceso</a>
        </nav>
        <a href="#acceso" className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-50">
          Acceso <Flecha />
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="overflow-hidden">
      <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-12 sm:px-8 md:pb-24 md:pt-20">
        <div className="relative border-b border-black/20 pb-12">
          <div className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-black/50">
            <span className="h-2 w-2 rounded-full bg-[#E8721C]" />
            Control de obra, sin papeles
          </div>

          <div className="relative z-10 isolate grid items-center gap-10 md:grid-cols-12">
            <h1 className="relative z-10 text-[clamp(3.7rem,8.2vw,8rem)] font-black leading-[0.84] tracking-[-0.075em] md:col-span-8">
              Tu obra,
              <br />
              <span className="text-[#E8721C]">bajo control.</span>
            </h1>
          </div>

          <div className="absolute right-0 top-1/2 z-0 hidden h-[clamp(260px,28vw,390px)] w-[28%] -translate-y-1/2 overflow-hidden sm:block">
            <LiquidHover
              imageSrc={blueprint}
              fit="cover"
              resolution={7}
              intensity={17}
              cursorSize={50}
            />
          </div>
        </div>

        <div className="grid gap-12 pt-8 md:grid-cols-12 md:items-start">
          <p className="max-w-2xl text-xl font-medium leading-snug tracking-[-0.02em] md:col-span-7 md:text-3xl">
            Fichajes, partes, fotos y horas reales. Todo lo que pasa fuera,
            visible desde tu oficina.
          </p>
          <div className="md:col-span-4 md:col-start-9">
            <p className="mb-6 max-w-sm leading-relaxed text-black/60">
              Una herramienta directa para empresas de obra y servicios de campo.
              Tu equipo la usa desde el móvil. Tú recuperas el control.
            </p>
            <a
              href="mailto:hola@fichaloop.com"
              className="inline-flex items-center gap-3 border-b-2 border-[#E8721C] pb-2 font-bold transition-all hover:gap-5"
            >
              Solicitar una demo <Flecha />
            </a>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-[#101418] text-white">
        {/* Mismo efecto que el login de FORGEVIA, en blanco y negro (grayscale). */}
        <KineticGridBackground className="absolute inset-0 [filter:grayscale(1)_brightness(1.35)]" />
        <div className="pointer-events-none absolute inset-0 bg-[#101418]/60" />
        <div className="relative z-10 mx-auto grid max-w-[1400px] md:grid-cols-2">
          <div className="flex min-h-[400px] flex-col justify-between border-white/15 p-5 sm:p-8 md:min-h-[570px] md:border-r md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Lo esencial, cada día</p>
            <div className="space-y-5">
              {[
                "Quién ha fichado",
                "Dónde está tu equipo",
                "Qué se ha hecho hoy",
                "Cuántas horas son reales",
              ].map((item, i) => (
                <div key={item} className="flex items-baseline gap-5 border-b border-white/15 pb-5">
                  <span className="text-xs text-[#E8721C]">0{i + 1}</span>
                  <p className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="acceso" className="scroll-mt-24 p-5 sm:p-8 md:p-12">
            <div className="mx-auto flex h-full max-w-md flex-col justify-center">
              <span className="mb-10 text-xs font-bold uppercase tracking-[0.18em] text-white/45">Área de clientes</span>
              <h2 className="mb-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Bienvenido.</h2>
              <p className="mb-9 text-white/50">
                Entra en tu espacio de trabajo o{" "}
                <a href="#contacto" className="text-white underline decoration-white/30 underline-offset-4">
                  habla con nosotros
                </a>.
              </p>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const DOLORES = [
  ["«No sé si han fichado.»", "Ubicación y hora exacta, al instante."],
  ["«Los partes llegan tarde.»", "Parte digital, cerrado y firmado cada día."],
  ["«Las fotos están en WhatsApp.»", "Cada imagen, en su obra y en su fecha."],
  ["«No me cuadran las horas.»", "Horas reales listas para nómina y facturación."],
];

function Dolores() {
  return (
    <section id="dolores" className="scroll-mt-20 border-b border-black/15">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-32">
        <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-black/45">01 — El problema</p>
        <div className="grid gap-12 md:grid-cols-12">
          <h2 className="text-[clamp(3.2rem,7vw,7.5rem)] font-black leading-[0.88] tracking-[-0.07em] md:col-span-7">
            Menos perseguir.
            <br />
            <span className="text-black/25">Más decidir.</span>
          </h2>
          <p className="max-w-md self-end text-lg leading-relaxed text-black/60 md:col-span-4 md:col-start-9">
            La información ya existe. El problema es que llega tarde, repartida entre
            papeles, llamadas y chats. Fichaloop la pone en orden.
          </p>
        </div>

        <div className="mt-20 border-t border-black/20 md:mt-28">
          {DOLORES.map(([dolor, solucion], i) => (
            <div key={dolor} className="grid gap-3 border-b border-black/20 py-7 md:grid-cols-12 md:items-center">
              <span className="text-xs text-black/35 md:col-span-1">0{i + 1}</span>
              <p className="text-2xl font-semibold tracking-[-0.03em] md:col-span-5 md:text-3xl">{dolor}</p>
              <p className="text-black/55 md:col-span-5 md:col-start-8">{solucion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FUNCIONES: Array<{ icon: (p: { className?: string }) => ReactNode; titulo: string; texto: string }> = [
  { icon: IconMapPin, titulo: "Fichaje con GPS", texto: "Entrada y salida con ubicación y hora. Retrasos y olvidos visibles al momento." },
  { icon: IconClipboard, titulo: "Partes diarios", texto: "Trabajo, materiales e incidencias en un parte firmado por el encargado." },
  { icon: IconCamera, titulo: "Fotos de obra", texto: "El avance documentado y ordenado automáticamente por obra y día." },
  { icon: IconChart, titulo: "Horas e informes", texto: "Datos reales por trabajador y obra, listos para pagar y facturar." },
  { icon: IconBox, titulo: "Materiales", texto: "Stock, pendientes y almacén sin memoria ni hojas de cálculo." },
  { icon: IconAlert, titulo: "Incidencias", texto: "Los problemas quedan registrados antes de convertirse en retrasos." },
  { icon: IconTruck, titulo: "Recursos", texto: "Vehículos y herramientas: dónde están y quién los tiene." },
  { icon: IconClock, titulo: "Tiempo real", texto: "Una vista clara de lo que está ocurriendo ahora en cada obra." },
];

function Funciones() {
  return (
    <section id="funciones" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-32">
        <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-black/45">02 — El producto</p>
        <h2 className="max-w-5xl text-[clamp(3.2rem,7vw,7.5rem)] font-black leading-[0.88] tracking-[-0.07em]">
          Todo conectado.
          <br />
          <span className="text-[#E8721C]">Nada de ruido.</span>
        </h2>

        <div className="mt-20 grid border-t border-black/15 sm:grid-cols-2 lg:grid-cols-4 md:mt-28">
          {FUNCIONES.map((f, i) => (
            <article
              key={f.titulo}
              className="group min-h-64 border-b border-black/15 py-7 sm:pr-7 sm:[&:nth-child(2n)]:pl-7 lg:min-h-72 lg:border-r lg:px-7 lg:first:pl-0 lg:[&:nth-child(4n)]:border-r-0 lg:[&:nth-child(4n+1)]:pl-0"
            >
              <div className="flex items-center justify-between">
                <f.icon className="h-6 w-6 text-[#E8721C]" />
                <span className="text-xs text-black/30">0{i + 1}</span>
              </div>
              <h3 className="mt-14 text-2xl font-bold tracking-[-0.035em]">{f.titulo}</h3>
              <p className="mt-3 max-w-xs leading-relaxed text-black/50">{f.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const PASOS = [
  ["Ficha", "Tu equipo registra entrada y salida desde el móvil, con GPS."],
  ["Reporta", "El encargado añade trabajo, fotos, materiales e incidencias."],
  ["Controla", "Tú ves obras, horas, avance y recursos desde un único panel."],
];

function ComoFunciona() {
  return (
    <section id="como" className="scroll-mt-20 bg-[#E8721C] text-[#101418]">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-32">
        <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-black/55">03 — Así de simple</p>
        <div className="border-t border-black/30">
          {PASOS.map(([titulo, texto], i) => (
            <div key={titulo} className="grid gap-5 border-b border-black/30 py-9 md:grid-cols-12 md:items-center">
              <span className="text-sm font-bold md:col-span-1">0{i + 1}</span>
              <h3 className="text-[clamp(3rem,6.5vw,6.5rem)] font-black leading-none tracking-[-0.065em] md:col-span-6">
                {titulo}
              </h3>
              <p className="max-w-md text-lg leading-relaxed text-black/65 md:col-span-4 md:col-start-9">{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhiteLabel() {
  return (
    <section className="overflow-hidden bg-[#101418] text-white">
      <div className="mx-auto grid max-w-[1400px] md:grid-cols-12">
        <div className="px-5 py-20 sm:px-8 md:col-span-8 md:py-32 md:pr-12">
          <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-white/40">04 — Tu identidad</p>
          <h2 className="text-[clamp(3.3rem,7.5vw,8rem)] font-black leading-[0.86] tracking-[-0.075em]">
            Parece tuya.
            <br />
            <span className="text-white/25">Porque lo es.</span>
          </h2>
          <p className="mt-12 max-w-2xl text-xl leading-relaxed text-white/55 md:text-2xl">
            Tu logo, tus colores y tu propio dominio. Tus trabajadores entran en la
            herramienta de tu empresa, no en «otra app más».
          </p>
        </div>
        <div className="flex flex-col justify-between border-t border-white/15 p-5 sm:p-8 md:col-span-4 md:border-l md:border-t-0 md:p-10">
          <IconObras className="h-10 w-10 text-[#E8721C]" />
          <div className="mt-24">
            <p className="break-all font-mono text-xl sm:text-2xl">
              tuempresa<span className="text-white/30">.fichaloop.com</span>
            </p>
            <ul className="mt-8 space-y-4 border-t border-white/15 pt-6 text-sm text-white/60">
              {["Logo y colores propios", "Funciones a tu medida", "Configuración incluida"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <IconCheck className="h-4 w-4 text-[#E8721C]" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contacto" className="scroll-mt-20 bg-[#F5F3EE]">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-32">
        <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-black/45">Hablemos</p>
        <h2 className="max-w-6xl text-[clamp(3.5rem,8.5vw,8.5rem)] font-black leading-[0.86] tracking-[-0.075em]">
          Menos papeleo.
          <br />
          <span className="text-[#E8721C]">Más obra.</span>
        </h2>
        <div className="mt-14 flex flex-col gap-8 border-t border-black/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-lg text-black/55">
            Cuéntanos cómo trabajas. Te enseñamos cómo fichaloop encaja en tu empresa.
          </p>
          <a
            href="mailto:hola@fichaloop.com"
            className="inline-flex w-fit items-center gap-4 bg-[#101418] px-7 py-4 font-bold text-white transition-all hover:gap-6 hover:bg-[#E8721C]"
          >
            Solicitar una demo <Flecha />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/15 bg-[#F5F3EE]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Marca />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-black/45">
            Control de fichajes, obras y partes diarios para empresas que trabajan fuera.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium">
          <a href="#funciones" className="hover:text-[#E8721C]">Producto</a>
          <a href="#como" className="hover:text-[#E8721C]">Cómo funciona</a>
          <a href="#acceso" className="hover:text-[#E8721C]">Acceso</a>
          <a href="mailto:hola@fichaloop.com" className="hover:text-[#E8721C]">Contacto</a>
        </div>
        <div className="text-xs leading-relaxed text-black/40 md:text-right">
          <p>© 2026 fichaloop.</p>
          <a href="https://ensodev.eu" target="_blank" rel="noopener noreferrer" className="hover:text-black">
            Desarrollado por ensodev.eu
          </a>
        </div>
      </div>
    </footer>
  );
}
