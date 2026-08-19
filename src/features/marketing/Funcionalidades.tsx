import { Link } from "react-router-dom";
import { useTitulo } from "@/lib/useTitulo";
import type { ReactNode } from "react";
import logoLight from "@/assets/fichaloop_black.png";
import {
  IconGrid,
  IconObras,
  IconUsers,
  IconClipboard,
  IconCamera,
  IconBox,
  IconAlert,
  IconTruck,
  IconWrench,
  IconWarehouse,
  IconChart,
  IconClock,
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
  IconBell,
  IconSettings,
  IconMapPin,
  IconEdit,
  IconUser,
  IconHome,
  IconBriefcase,
  IconBuilding,
  IconPhone,
} from "@/components/icons";

// Página "Funcionalidades": explica cada módulo de fichaloop, primero
// para el administrador y después para el trabajador. Misma estética
// editorial que la landing: fondo hueso, tipografía black, naranja de
// marca y listas con bordes finos. Limpia y minimalista.

const NARANJA = "#E8721C";

type Icono = (p: { className?: string }) => ReactNode;

interface Funcion {
  icon: Icono;
  titulo: string;
  texto: string;
}

interface Grupo {
  area: string;
  funciones: Funcion[];
}

const ADMIN: Grupo[] = [
  {
    area: "Panel de control",
    funciones: [
      {
        icon: IconGrid,
        titulo: "Dashboard",
        texto:
          "La foto del día en una pantalla: quién ha fichado y quién no, obras en curso, horas acumuladas y avisos importantes. Se actualiza en tiempo real.",
      },
      {
        icon: IconObras,
        titulo: "Obras",
        texto:
          "Alta y gestión de cada obra: dirección, estado, avance, equipo asignado y cuadrante (días laborables, horario y salida automática). Con fotos y planos de referencia para el equipo.",
      },
      {
        icon: IconUsers,
        titulo: "Trabajadores",
        texto:
          "La plantilla completa con sus datos, credenciales de acceso y estado. Cada trabajador entra a la app con su usuario y solo ve lo suyo.",
      },
    ],
  },
  {
    area: "Comercial y presupuestos",
    funciones: [
      {
        icon: IconBriefcase,
        titulo: "Clientes (CRM)",
        texto:
          "La ficha de cada cliente: contacto, sus obras, facturas, gastos y la rentabilidad (P&L) real por cliente y por obra. Con el origen de captación (redes, referencia, web…) para saber qué te funciona.",
      },
      {
        icon: IconClipboard,
        titulo: "Presupuestos rápidos",
        texto:
          "Monta un presupuesto en minutos: arrastra artículos y packs (baño, cocina, pladur, pintura…), aplica tu margen y expórtalo en PDF con tu marca y tus avisos. También reformas por m².",
      },
      {
        icon: IconBox,
        titulo: "Banco de precios",
        texto:
          "Tu catálogo de materiales y mano de obra con el coste por proveedor. Los packs por gremio agrupan lo típico de cada trabajo para presupuestar de un tirón.",
      },
      {
        icon: IconReceipt,
        titulo: "Facturas de proveedor (IA)",
        texto:
          "Sube la factura de Obramat, Leroy o quien sea y la IA extrae las líneas y precios. Al aprobarla, alimenta el banco de precios con su proveedor, automáticamente.",
      },
      {
        icon: IconEuro,
        titulo: "Facturas a cliente",
        texto:
          "Emite facturas por cliente y obra, con su estado de cobro (emitida, pagada, vencida) reflejado en la rentabilidad. Un presupuesto aceptado se convierte en factura en un clic.",
      },
    ],
  },
  {
    area: "Administración de fincas (CRM)",
    funciones: [
      {
        icon: IconBriefcase,
        titulo: "Administradores de fincas",
        texto:
          "Una categoría propia de contacto para administraciones de fincas, con su ficha completa: persona de contacto, cargo, zona de trabajo, web, nº de comunidades y estado comercial (de prospecto a cliente recurrente).",
      },
      {
        icon: IconBuilding,
        titulo: "Comunidades",
        texto:
          "Cada administración agrupa sus comunidades de propietarios. Cada comunidad tiene ficha propia con sus obras, presupuestos, facturas e incidencias, vinculada a quien la gestiona.",
      },
      {
        icon: IconTarget,
        titulo: "Oportunidades",
        texto:
          "El embudo comercial completo: de oportunidad recibida a visita, presupuesto enviado y obra adjudicada. Sabes en todo momento qué administrador origina cada trabajo.",
      },
      {
        icon: IconPhone,
        titulo: "Seguimiento comercial",
        texto:
          "Historial cronológico de llamadas, emails, WhatsApp, visitas y dossiers, con próxima acción y fecha. Aviso automático cuando un seguimiento se queda vencido.",
      },
      {
        icon: IconGrid,
        titulo: "Panel y ranking",
        texto:
          "Un panel dedicado con administradores activos, oportunidades, obras adjudicadas, facturación generada y tasa de conversión. Con el ranking TOP de administradores por el negocio que aportan.",
      },
    ],
  },
  {
    area: "Seguimiento de obra",
    funciones: [
      {
        icon: IconClipboard,
        titulo: "Partes diarios",
        texto:
          "El trabajo de cada día por escrito: qué se hizo, materiales pendientes, observaciones e incidencias. El encargado lo cierra con su firma desde el móvil.",
      },
      {
        icon: IconCamera,
        titulo: "Fotografías",
        texto:
          "Todas las fotos de avance, ordenadas automáticamente por obra y fecha. Nada se pierde en chats.",
      },
      {
        icon: IconBox,
        titulo: "Materiales",
        texto:
          "Lo que falta en cada obra, reportado desde el parte diario y visible al momento para comprar sin llamadas.",
      },
      {
        icon: IconAlert,
        titulo: "Incidencias",
        texto:
          "Problemas registrados en el momento, con estado (nueva, en proceso, resuelta) para que nada se quede sin respuesta.",
      },
      {
        icon: IconTruck,
        titulo: "Vehículos",
        texto: "La flota: matrícula, modelo, a quién está asignado cada vehículo y su estado.",
      },
      {
        icon: IconWrench,
        titulo: "Herramientas",
        texto: "Qué herramienta está en qué obra o en el almacén, y cuántas unidades hay.",
      },
      {
        icon: IconWarehouse,
        titulo: "Almacén",
        texto:
          "Stock con mínimos: cuando un material baja del umbral, se ve de un vistazo qué reponer.",
      },
    ],
  },
  {
    area: "Tiempo",
    funciones: [
      {
        icon: IconClock,
        titulo: "Horas",
        texto:
          "Las horas reales de cada trabajador, día a día: ordinarias, pausas y extra, calculadas a partir de sus fichajes con GPS.",
      },
      {
        icon: IconCalendar,
        titulo: "Ausencias y vacaciones",
        texto:
          "Las solicitudes del equipo llegan a tu panel: apruebas o rechazas con un comentario y el trabajador recibe el aviso. Saldo de días por persona siempre visible.",
      },
      {
        icon: IconTurnos,
        titulo: "Turnos",
        texto:
          "Planificador semanal: asigna a cada persona su obra y horario por día. Cada trabajador ve su semana en el móvil.",
      },
    ],
  },
  {
    area: "Finanzas",
    funciones: [
      {
        icon: IconEuro,
        titulo: "Gastos",
        texto:
          "Dietas, transporte, material… presentados desde el móvil con la foto del ticket. Los apruebas, rechazas o marcas como pagados, con totales del mes.",
      },
      {
        icon: IconReceipt,
        titulo: "Nómina",
        texto:
          "El resumen mensual por trabajador — días trabajados, horas ordinarias y extra, ausencias y gastos aprobados — exportable a CSV para tu gestoría en un clic.",
      },
    ],
  },
  {
    area: "Talento",
    funciones: [
      {
        icon: IconStar,
        titulo: "Evaluaciones",
        texto:
          "Evalúa el desempeño por periodos con criterios claros: puntualidad, calidad, seguridad y trabajo en equipo. Cada trabajador ve su valoración.",
      },
      {
        icon: IconTarget,
        titulo: "Metas y objetivos",
        texto:
          "Objetivos de empresa o individuales con su porcentaje de avance. Lo que importa, medido y a la vista.",
      },
      {
        icon: IconCheckSquare,
        titulo: "Onboarding",
        texto:
          "Checklist de alta (contrato, Seguridad Social, EPIs, formación PRL…) y de salida para cada empleado. Nada se queda sin hacer.",
      },
      {
        icon: IconSitemap,
        titulo: "Organigrama",
        texto:
          "Quién es quién y en qué obra está cada equipo, generado automáticamente a partir de tus datos. Sin mantenimiento manual.",
      },
    ],
  },
  {
    area: "Comunicación",
    funciones: [
      {
        icon: IconMegaphone,
        titulo: "Comunicados",
        texto:
          "El tablón de tu empresa: calendario, políticas, eventos. Al publicar, toda la plantilla recibe el aviso en su móvil.",
      },
      {
        icon: IconShield,
        titulo: "Canal de denuncias",
        texto:
          "Canal ético confidencial. Las comunicaciones anónimas no guardan ningún dato de quién las envía, y gestionas cada caso por estados.",
      },
      {
        icon: IconFolder,
        titulo: "Documentos",
        texto:
          "Entrega nóminas, contratos y certificados a cada empleado, o publica documentación de empresa para todos. Cada uno descarga lo suyo desde el móvil.",
      },
      {
        icon: IconBell,
        titulo: "Notificaciones",
        texto:
          "Avisos automáticos (fichajes olvidados, salidas automáticas) y manuales, a una persona o a toda la plantilla.",
      },
      {
        icon: IconChart,
        titulo: "Informes",
        texto:
          "Indicadores agregados de horas, obras y equipo para decidir con datos, no con sensaciones.",
      },
      {
        icon: IconSettings,
        titulo: "Configuración",
        texto: "Ajustes del espacio de trabajo de tu empresa, siempre a mano.",
      },
    ],
  },
];

const TRABAJADOR: Grupo[] = [
  {
    area: "Su día a día",
    funciones: [
      {
        icon: IconMapPin,
        titulo: "Fichaje con GPS",
        texto:
          "Entrada, salida, pausas y horas extra con un botón. Queda la hora exacta y la ubicación, con cronómetro en vivo de la jornada.",
      },
      {
        icon: IconHome,
        titulo: "Sus obras",
        texto:
          "Las obras que tiene asignadas, con dirección, horario, equipo y el material de referencia (fotos, planos) que hayas subido.",
      },
      {
        icon: IconClipboard,
        titulo: "Parte diario",
        texto:
          "El encargado rellena el parte desde el móvil — trabajo realizado, materiales, incidencias — y lo cierra firmando en pantalla.",
      },
      {
        icon: IconCamera,
        titulo: "Fotos de avance",
        texto: "Sube fotos desde la obra; quedan ordenadas por obra y fecha automáticamente.",
      },
      {
        icon: IconBell,
        titulo: "Avisos",
        texto:
          "Recordatorios de fichaje, respuestas a sus solicitudes y comunicados de empresa, todo en un mismo sitio.",
      },
    ],
  },
  {
    area: "Su gestión personal",
    funciones: [
      {
        icon: IconCalendar,
        titulo: "Ausencias y vacaciones",
        texto:
          "Solicita vacaciones, permisos o comunica una baja desde el móvil, con su saldo de días a la vista. Recibe la respuesta como aviso.",
      },
      {
        icon: IconEuro,
        titulo: "Gastos",
        texto:
          "Presenta un gasto en segundos: concepto, importe y foto del ticket. Y ve en qué estado está cada uno (pendiente, aprobado, pagado).",
      },
      {
        icon: IconFolder,
        titulo: "Documentos",
        texto:
          "Sus nóminas, contrato y los documentos de empresa, disponibles para descargar cuando los necesite.",
      },
      {
        icon: IconTurnos,
        titulo: "Su semana",
        texto: "Los turnos de los próximos 7 días: en qué obra trabaja y en qué horario.",
      },
      {
        icon: IconTarget,
        titulo: "Sus objetivos",
        texto:
          "Las metas que le asignes y sus evaluaciones de desempeño, con transparencia total.",
      },
      {
        icon: IconShield,
        titulo: "Canal ético",
        texto:
          "Puede comunicar una situación delicada de forma confidencial y, si lo prefiere, totalmente anónima.",
      },
      {
        icon: IconUser,
        titulo: "Su perfil",
        texto: "Sus datos, sus fichajes de hoy y el acceso a todo lo anterior.",
      },
      {
        icon: IconEdit,
        titulo: "Sin formación previa",
        texto:
          "La app del trabajador está pensada para el móvil y para usarse con guantes: botones grandes, pasos cortos, cero menús raros.",
      },
    ],
  },
];

function Seccion({ n, titulo, sub, grupos }: { n: string; titulo: ReactNode; sub: string; grupos: Grupo[] }) {
  return (
    <section className="border-t border-black/15">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 md:py-24">
        <p className="mb-10 text-xs font-bold uppercase tracking-[0.18em] text-black/45">{n}</p>
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <h2 className="text-[clamp(2.8rem,6vw,6rem)] font-black leading-[0.9] tracking-[-0.06em] md:col-span-8">
            {titulo}
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-black/55 md:col-span-4">{sub}</p>
        </div>

        {grupos.map((g) => (
          <div key={g.area} className="mt-16">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: NARANJA }}>
              {g.area}
            </p>
            <div className="border-t border-black/20">
              {g.funciones.map((f) => (
                <div
                  key={f.titulo}
                  className="grid gap-2 border-b border-black/10 py-6 md:grid-cols-12 md:items-baseline"
                >
                  <div className="flex items-center gap-3 md:col-span-4">
                    <f.icon className="h-5 w-5 shrink-0 text-[#E8721C]" />
                    <h3 className="text-xl font-bold tracking-[-0.03em]">{f.titulo}</h3>
                  </div>
                  <p className="leading-relaxed text-black/55 md:col-span-7 md:col-start-6">
                    {f.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Funcionalidades() {
  useTitulo("Funcionalidades · fichaloop — control de obra, presupuestos y RRHH");
  return (
    <div className="min-h-full bg-[#F5F3EE] text-[#101418] selection:bg-[#E8721C] selection:text-white">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#F5F3EE]/90 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoLight} alt="" className="h-8 w-auto" />
            <span className="text-xl font-extrabold tracking-[-0.04em]">
              ficha<span style={{ color: NARANJA }}>loop</span>
            </span>
          </Link>
          <Link to="/" className="text-sm font-semibold transition-opacity hover:opacity-50">
            ← Volver
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section>
          <div className="mx-auto max-w-[1400px] px-5 pb-14 pt-14 sm:px-8 md:pb-20 md:pt-20">
            <p className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-black/50">
              <span className="h-2 w-2 rounded-full" style={{ background: NARANJA }} />
              Funcionalidades
            </p>
            <h1 className="max-w-5xl text-[clamp(3.2rem,7.5vw,7.5rem)] font-black leading-[0.86] tracking-[-0.075em]">
              Todo lo que hace,
              <br />
              <span style={{ color: NARANJA }}>explicado.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-black/60">
              fichaloop tiene dos caras: el panel del administrador, en escritorio, y la app
              del trabajador, en el móvil. Cada módulo se activa o desactiva según lo que tu
              empresa necesite — tu panel solo muestra lo que usas.
            </p>
          </div>
        </section>

        <Seccion
          n="01 — El administrador"
          titulo={
            <>
              Tu oficina,
              <br />
              <span className="text-black/25">al mando.</span>
            </>
          }
          sub="Desde el panel de escritorio ves y gestionas todo lo que ocurre fuera: obras, personas, tiempo y dinero."
          grupos={ADMIN}
        />

        <Seccion
          n="02 — El trabajador"
          titulo={
            <>
              Su móvil,
              <br />
              <span style={{ color: NARANJA }}>sin fricción.</span>
            </>
          }
          sub="La app del equipo es deliberadamente simple: fichar, reportar y consultar lo suyo. Nada más, nada menos."
          grupos={TRABAJADOR}
        />

        {/* CTA */}
        <section className="border-t border-black/15">
          <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 md:py-24">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[clamp(2.2rem,4.5vw,4rem)] font-black leading-[0.9] tracking-[-0.05em]">
                  ¿Lo vemos con tus obras?
                </h2>
                <p className="mt-3 max-w-lg text-lg text-black/55">
                  Pide una demo y te lo enseñamos funcionando con un caso como el tuyo.
                </p>
              </div>
              <a
                href="/#contacto"
                className="inline-flex w-fit items-center gap-4 bg-[#101418] px-7 py-4 font-bold text-white transition-all hover:gap-6 hover:bg-[#E8721C]"
              >
                Solicitar una demo <span aria-hidden="true" className="text-lg leading-none">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/15">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-8 text-xs text-black/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 fichaloop.</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/" className="hover:text-black">Inicio</Link>
            <Link to="/terminos" className="hover:text-black">Términos y condiciones</Link>
            <a href="https://ensodev.eu" target="_blank" rel="noopener noreferrer" className="hover:text-black">
              Desarrollado con <span aria-hidden="true">❤️</span> por ENSODev
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
