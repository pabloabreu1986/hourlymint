import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LoginForm } from "@/components/LoginForm";
import { tenantApi } from "@/services";
import { ultimoEspacio, urlDeEspacio, DOMINIO_PLATAFORMA } from "@/lib/host";
import { DemoForm } from "./DemoForm";
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
  IconCalendar,
  IconTurnos,
  IconEuro,
  IconReceipt,
  IconFolder,
  IconStar,
  IconTarget,
  IconCheckSquare,
  IconSitemap,
  IconMegaphone,
  IconShield,
  IconBriefcase,
} from "@/components/icons";

const NARANJA = "#E8721C";

export default function Landing() {
  const [demo, setDemo] = useState<{ open: boolean; plan?: string }>({ open: false });
  const abrirDemo = (plan?: string) => setDemo({ open: true, plan });
  return (
    <div className="min-h-full bg-[#F5F3EE] text-[#101418] selection:bg-[#E8721C] selection:text-white">
      <Nav />
      <main>
        <Hero onDemo={abrirDemo} />
        <Dolores />
        <Funciones />
        <SuiteRRHH />
        <ComoFunciona />
        <Precios onDemo={abrirDemo} />
        <WhiteLabel />
        <CTA onDemo={abrirDemo} />
      </main>
      <Footer />
      <DemoForm open={demo.open} plan={demo.plan} onClose={() => setDemo({ open: false })} />
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
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#F5F3EE]/90 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8">
        <Marca />
        <nav className="hidden items-center gap-8 text-[13px] font-semibold uppercase tracking-[0.12em] md:flex">
          <a href="#dolores" className="transition-opacity hover:opacity-50">El problema</a>
          <a href="#funciones" className="transition-opacity hover:opacity-50">Producto</a>
          <a href="#rrhh" className="transition-opacity hover:opacity-50">RRHH</a>
          <a href="#precios" className="transition-opacity hover:opacity-50">Precios</a>
          <Link to="/funcionalidades" className="transition-opacity hover:opacity-50">
            Módulos
          </Link>
        </nav>
        <a href="#acceso" className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-50">
          Acceso <Flecha />
        </a>
      </div>
    </header>
  );
}

function Hero({ onDemo }: { onDemo: (plan?: string) => void }) {
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

          {/* Anclada al bloque del titular: del borde superior (eyebrow) a la
              línea divisoria inferior, sin sobresalir hacia el nav. */}
          <div className="absolute inset-y-0 right-0 z-0 hidden w-[28%] overflow-hidden sm:block">
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
            Fichajes, partes, fotos y horas reales. Y también vacaciones, turnos,
            gastos y nómina. Todo lo que pasa fuera, visible desde tu oficina.
          </p>
          <div className="md:col-span-4 md:col-start-9">
            <p className="mb-6 max-w-sm leading-relaxed text-black/60">
              Una herramienta directa para empresas de obra y servicios de campo.
              Tu equipo la usa desde el móvil. Tú recuperas el control.
            </p>
            <button
              type="button"
              onClick={() => onDemo()}
              className="inline-flex items-center gap-3 border-b-2 border-[#E8721C] pb-2 font-bold transition-all hover:gap-5"
            >
              Solicitar una demo <Flecha />
            </button>
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
                Entra en el espacio de tu empresa o{" "}
                <a href="#contacto" className="text-white underline decoration-white/30 underline-offset-4">
                  habla con nosotros
                </a>.
              </p>
              <AccesoEspacio />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Tenant discovery (patrón Slack): el cliente escribe el nombre de su
 * espacio y le llevamos a su subdominio, validando antes que existe.
 * Si ya visitó su espacio (cookie compartida en .fichaloop.com), se le
 * ofrece continuar directamente. El login con credenciales del operador
 * de plataforma queda plegado detrás de un enlace discreto.
 */
function AccesoEspacio() {
  const recordado = ultimoEspacio();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [modoPlataforma, setModoPlataforma] = useState(false);

  /** Admite "miempresa", "miempresa.fichaloop.com" o la URL completa. */
  function normalizar(v: string): string {
    return v
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(new RegExp(`\\.${DOMINIO_PLATAFORMA.replace(".", "\\.")}.*$`), "")
      .replace(/[^a-z0-9-]/g, "");
  }

  async function ir(e: FormEvent) {
    e.preventDefault();
    const s = normalizar(slug);
    if (!s) {
      setError("Escribe el nombre de tu espacio.");
      return;
    }
    setBuscando(true);
    setError("");
    try {
      const tenant = await tenantApi.getTenantPorSlug(s);
      if (!tenant) {
        setError(`No encontramos «${s}». Revisa la dirección o pide una demo.`);
        return;
      }
      window.location.href = urlDeEspacio(s);
    } catch {
      setError("No se pudo comprobar el espacio. Inténtalo de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  if (modoPlataforma) {
    return (
      <div>
        <LoginForm />
        <button
          type="button"
          onClick={() => setModoPlataforma(false)}
          className="mt-6 text-sm text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white/70"
        >
          ← Volver al acceso de clientes
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Continuar al último espacio visitado */}
      {recordado && (
        <a
          href={urlDeEspacio(recordado)}
          className="mb-4 flex w-full items-center justify-between rounded-xl bg-forge-orange px-5 py-3.5 font-bold text-white transition hover:bg-forge-orange-600"
        >
          Continuar a {recordado}.{DOMINIO_PLATAFORMA}
          <Flecha />
        </a>
      )}

      {/* Buscar tu espacio por su dirección */}
      <form onSubmit={ir} className="space-y-4">
        <div className="flex items-center overflow-hidden rounded-xl border border-white/15 bg-white/10 focus-within:border-forge-orange focus-within:ring-2 focus-within:ring-forge-orange/30">
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setError("");
            }}
            placeholder="tuempresa"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-3.5 pl-4 text-white placeholder:text-white/40 outline-none"
          />
          <span className="shrink-0 pr-4 text-white/40">.{DOMINIO_PLATAFORMA}</span>
        </div>
        {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
        <button
          type="submit"
          disabled={buscando}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition active:scale-[.99] disabled:opacity-60 ${
            recordado
              ? "border border-white/20 hover:bg-white/5"
              : "bg-forge-orange hover:bg-forge-orange-600"
          }`}
        >
          {buscando ? "Comprobando…" : recordado ? "Ir a otro espacio" : "Ir a mi espacio"}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/40">
        Tu espacio es la dirección que usa tu equipo cada día, p.ej.{" "}
        <span className="font-mono text-white/60">tuempresa.{DOMINIO_PLATAFORMA}</span>.
        ¿No la recuerdas? Pregunta a tu administrador.
      </p>

      <button
        type="button"
        onClick={() => setModoPlataforma(true)}
        className="mt-8 text-sm font-medium text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white/90"
      >
        Acceso operador de plataforma →
      </button>
    </div>
  );
}

const DOLORES = [
  ["«No sé si han fichado.»", "Ubicación y hora exacta, al instante."],
  ["«Los partes llegan tarde.»", "Parte digital, cerrado y firmado cada día."],
  ["«Las fotos están en WhatsApp.»", "Cada imagen, en su obra y en su fecha."],
  ["«No me cuadran las horas.»", "Horas reales listas para nómina y facturación."],
  ["«Las vacaciones se piden por WhatsApp.»", "Solicitud, aprobación y saldo de días, en la app."],
  ["«Los tickets aparecen a fin de mes.»", "Gastos con foto del ticket y aprobación al momento."],
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
  { icon: IconClipboard, titulo: "Presupuestos rápidos", texto: "Arrastra artículos y packs, aplica tu margen y exporta el PDF con tu marca." },
  { icon: IconBox, titulo: "Banco de precios", texto: "Materiales y mano de obra con coste por proveedor. Packs por gremio listos." },
  { icon: IconReceipt, titulo: "Facturas de proveedor (IA)", texto: "Sube la factura y la IA extrae precios que alimentan tu banco automáticamente." },
  { icon: IconBriefcase, titulo: "Clientes (CRM)", texto: "Ficha, obras, facturas y rentabilidad real por cliente y por obra." },
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

        <div className="mt-10">
          <Link
            to="/funcionalidades"
            className="inline-flex items-center gap-3 border-b-2 border-[#E8721C] pb-2 font-bold transition-all hover:gap-5"
          >
            Ver todas las funcionalidades, una a una <Flecha />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Suite RRHH: los módulos de gestión de personas (tipo Factorial),
// activables por cliente desde el panel de la plataforma.
const MODULOS_RRHH: Array<{ icon: (p: { className?: string }) => ReactNode; titulo: string; texto: string }> = [
  { icon: IconCalendar, titulo: "Ausencias y vacaciones", texto: "Tu equipo solicita desde el móvil; tú apruebas con el saldo de días a la vista." },
  { icon: IconTurnos, titulo: "Turnos", texto: "Planifica la semana por persona y obra. Cada uno sabe dónde y a qué hora." },
  { icon: IconEuro, titulo: "Gastos", texto: "Dietas, transporte y material con foto del ticket. Aprobar o rechazar, un clic." },
  { icon: IconReceipt, titulo: "Nómina", texto: "Horas, extras, ausencias y gastos del mes en un CSV listo para tu gestoría." },
  { icon: IconFolder, titulo: "Documentos", texto: "Nóminas, contratos y documentación de empresa, entregados en el móvil de cada uno." },
  { icon: IconStar, titulo: "Evaluaciones", texto: "Desempeño por periodos con criterios claros: puntualidad, calidad, seguridad, equipo." },
  { icon: IconTarget, titulo: "Metas y objetivos", texto: "Objetivos de empresa o personales con su avance, visibles para quien corresponde." },
  { icon: IconCheckSquare, titulo: "Onboarding", texto: "Checklist de alta y de salida: contrato, EPIs, formación… nada se queda sin hacer." },
  { icon: IconSitemap, titulo: "Organigrama", texto: "Quién es quién y en qué obra está, generado solo a partir de tus datos." },
  { icon: IconMegaphone, titulo: "Comunicados", texto: "Un tablón de empresa que llega a toda la plantilla con aviso en el móvil." },
  { icon: IconShield, titulo: "Canal de denuncias", texto: "Canal ético confidencial, con opción de anonimato real para tu equipo." },
];

function SuiteRRHH() {
  return (
    <section id="rrhh" className="scroll-mt-20 bg-[#101418] text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-32">
        <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-white/40">03 — Las personas</p>
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <h2 className="text-[clamp(3.2rem,7vw,7.5rem)] font-black leading-[0.88] tracking-[-0.07em] md:col-span-8">
            No solo fichajes.
            <br />
            <span className="text-[#E8721C]">Todo tu equipo.</span>
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-white/50 md:col-span-4">
            La gestión de personal completa — vacaciones, turnos, gastos, nómina,
            talento — en la misma herramienta con la que tu equipo ya ficha.
            Activa solo los módulos que necesitas.
          </p>
        </div>

        <div className="mt-20 grid border-t border-white/15 sm:grid-cols-2 lg:grid-cols-3 md:mt-28">
          {MODULOS_RRHH.map((m, i) => (
            <article
              key={m.titulo}
              className="group min-h-52 border-b border-white/15 py-7 sm:pr-7 sm:[&:nth-child(2n)]:pl-7 lg:min-h-60 lg:border-r lg:px-7 lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(2n)]:pl-7"
            >
              <div className="flex items-center justify-between">
                <m.icon className="h-6 w-6 text-[#E8721C]" />
                <span className="text-xs text-white/25">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-10 text-2xl font-bold tracking-[-0.035em]">{m.titulo}</h3>
              <p className="mt-3 max-w-xs leading-relaxed text-white/45">{m.texto}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/40">
            Cada módulo se activa o desactiva por cliente. Pagas por lo que usas, y tu
            panel solo muestra lo que necesitas.
          </p>
          <Link
            to="/funcionalidades"
            className="inline-flex w-fit shrink-0 items-center gap-3 border-b-2 border-[#E8721C] pb-2 font-bold text-white transition-all hover:gap-5"
          >
            Cómo funciona cada módulo <Flecha />
          </Link>
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
        <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-black/55">04 — Así de simple</p>
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

const PLANES = [
  {
    nombre: "Esencial",
    precio: "39",
    descripcion: "Para equipos pequeños que quieren dejar atrás el papel.",
    limite: "Hasta 5 trabajadores",
    funciones: [
      "Fichaje con GPS",
      "Partes y fotos de obra",
      "3 obras activas",
      "Control de horas",
      "Ausencias y vacaciones",
      "Soporte por email",
    ],
  },
  {
    nombre: "Equipo",
    precio: "79",
    descripcion: "El control completo para una empresa que está creciendo.",
    limite: "Hasta 15 trabajadores",
    recomendado: true,
    funciones: [
      "Obras activas ilimitadas",
      "Materiales e incidencias",
      "Vehículos y herramientas",
      "Turnos, gastos y nómina",
      "Documentos y comunicados",
      "Logo y colores propios",
      "Soporte prioritario",
    ],
  },
  {
    nombre: "Pro",
    precio: "149",
    descripcion: "Más capacidad, permisos y personalización para estructuras mayores.",
    limite: "Hasta 40 trabajadores",
    funciones: [
      "Todo lo incluido en Equipo",
      "Suite RRHH completa",
      "Evaluaciones, metas y onboarding",
      "Canal de denuncias",
      "Roles y permisos avanzados",
      "Dominio propio",
      "Puesta en marcha guiada",
    ],
  },
];

function Precios({ onDemo }: { onDemo: (plan?: string) => void }) {
  return (
    <section id="precios" className="scroll-mt-20 bg-[#F5F3EE]">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-32">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-black/45">
              05 — Precios claros
            </p>
            <h2 className="text-[clamp(3.2rem,7vw,7.5rem)] font-black leading-[0.88] tracking-[-0.07em]">
              Empieza pequeño.
              <br />
              <span className="text-[#E8721C]">Crece sin líos.</span>
            </h2>
          </div>
          <div className="md:col-span-4">
            <p className="max-w-md text-lg leading-relaxed text-black/55">
              Una cuota previsible para todo tu equipo. Sin permanencia, sin costes
              ocultos y con la puesta en marcha incluida.
            </p>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em]">
              Pago anual · 2 meses gratis
            </p>
          </div>
        </div>

        <div className="mt-20 grid border-t border-black/20 md:grid-cols-3 md:mt-28">
          {PLANES.map((plan) => (
            <article
              key={plan.nombre}
              className={`relative flex flex-col border-b border-black/20 px-0 py-8 md:min-h-[610px] md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0 ${
                plan.recomendado ? "md:bg-[#E8721C] md:px-8" : ""
              }`}
            >
              {plan.recomendado && (
                <p className="mb-8 w-fit bg-[#101418] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white">
                  El más elegido
                </p>
              )}
              <div className={plan.recomendado ? "" : "md:pt-[46px]"}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl font-black tracking-[-0.04em]">{plan.nombre}</h3>
                  <p className="text-xs font-bold uppercase tracking-[0.12em]">{plan.limite}</p>
                </div>
                <div className="mt-9 flex items-end gap-2">
                  <span className="text-[clamp(4.8rem,7vw,7rem)] font-black leading-none tracking-[-0.08em]">
                    {plan.precio}
                  </span>
                  <div className="pb-2">
                    <p className="text-xl font-bold">€</p>
                    <p className="text-xs text-black/55">al mes</p>
                  </div>
                </div>
                <p className="mt-7 max-w-sm leading-relaxed text-black/60">{plan.descripcion}</p>
              </div>

              <ul className="mt-10 space-y-4 border-t border-black/20 pt-7">
                {plan.funciones.map((funcion) => (
                  <li key={funcion} className="flex items-center gap-3 text-sm font-medium">
                    <IconCheck className="h-4 w-4 shrink-0" />
                    {funcion}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onDemo(plan.nombre)}
                className={`mt-auto inline-flex w-full items-center justify-between border-t px-0 pt-5 font-bold transition-all hover:px-2 ${
                  plan.recomendado ? "border-black/30" : "border-black/20"
                }`}
              >
                Solicitar una demo <Flecha />
              </button>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-5 border-b border-black/20 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-bold tracking-[-0.03em]">¿Más de 40 trabajadores?</p>
            <p className="mt-1 text-sm text-black/50">
              Preparamos un plan a medida para varias sedes, equipos o empresas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDemo("A medida")}
            className="inline-flex w-fit items-center gap-3 font-bold transition-all hover:gap-5"
          >
            Hablar con nosotros <Flecha />
          </button>
        </div>

        <p className="mt-5 text-xs text-black/40">
          Precios sin IVA. La cuota incluye actualizaciones, alojamiento y copias de seguridad.
        </p>
      </div>
    </section>
  );
}

function WhiteLabel() {
  return (
    <section className="overflow-hidden bg-[#101418] text-white">
      <div className="mx-auto grid max-w-[1400px] md:grid-cols-12">
        <div className="px-5 py-20 sm:px-8 md:col-span-8 md:py-32 md:pr-12">
          <p className="mb-12 text-xs font-bold uppercase tracking-[0.18em] text-white/40">06 — Tu identidad</p>
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

function CTA({ onDemo }: { onDemo: (plan?: string) => void }) {
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
          <button
            type="button"
            onClick={() => onDemo()}
            className="inline-flex w-fit items-center gap-4 bg-[#101418] px-7 py-4 font-bold text-white transition-all hover:gap-6 hover:bg-[#E8721C]"
          >
            Solicitar una demo <Flecha />
          </button>
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
            Control de fichajes, obras y partes diarios; presupuestos rápidos con banco de
            precios y lectura de facturas por IA; clientes (CRM) y la gestión completa de tu
            equipo: ausencias, turnos, gastos, nómina y talento.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium">
          <a href="#funciones" className="hover:text-[#E8721C]">Producto</a>
          <Link to="/funcionalidades" className="hover:text-[#E8721C]">Funcionalidades</Link>
          <a href="#como" className="hover:text-[#E8721C]">Cómo funciona</a>
          <a href="#acceso" className="hover:text-[#E8721C]">Acceso</a>
          <a href="mailto:hola@fichaloop.com" className="hover:text-[#E8721C]">Contacto</a>
          <Link to="/terminos" className="hover:text-[#E8721C]">Términos y condiciones</Link>
        </div>
        <div className="text-xs leading-relaxed text-black/40 md:text-right">
          <p>© 2026 fichaloop.</p>
          <a href="https://ensodev.eu" target="_blank" rel="noopener noreferrer" className="hover:text-black">
            Desarrollado con <span aria-hidden="true">❤️</span> por ENSODev
          </a>
        </div>
      </div>
    </footer>
  );
}
