import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tenantApi } from "@/services";
import { fijarTenant } from "@/lib/branding";
import type { ItemWeb, SeccionWeb, Tenant } from "@/lib/types";
import Login from "@/features/auth/Login";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { KineticGridBackground } from "@/components/KineticGridBackground";
import { Cargando } from "@/components/ui";
import { IconCheck, IconChevronDown } from "@/components/icons";

/**
 * Mini-web pública del cliente (empresa.fichaloop.com). Renderiza las
 * secciones configuradas por el super-admin, pintadas con la marca del
 * tenant (variables --brand-* ya inyectadas por branding.ts). Si el
 * cliente no tiene web configurada, muestra el login de siempre.
 */
export default function WebCliente() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    tenantApi
      .getTenant()
      .then((t) => {
        // Refresca marca/tema por si la caché local estaba desfasada.
        fijarTenant(t);
        setTenant(t);
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando />;
  const secciones = tenant?.web ?? [];
  if (!tenant || secciones.length === 0) return <Login />;
  // Si hay portada, el login vive en ella; si no, se va a /login.
  const tieneHero = secciones.some((s) => s.tipo === "hero");
  const clsAcceso =
    "rounded-xl bg-forge-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-forge-orange-600";

  return (
    <div className="min-h-full bg-forge-canvas text-forge-dark">
      {/* Cabecera con la marca del cliente */}
      <header className="sticky top-0 z-40 bg-forge-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo variant="light" />
          {tieneHero ? (
            <a href="#acceso" className={clsAcceso}>
              Acceso
            </a>
          ) : (
            <Link to="/login" className={clsAcceso}>
              Acceso
            </Link>
          )}
        </div>
      </header>

      <main>
        {secciones.map((s) => (
          <SeccionRender key={s.id} s={s} />
        ))}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-5 py-8 text-center text-xs text-slate-400 sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} {tenant.nombreCorto}
            {tenant.eslogan ? ` · ${tenant.eslogan}` : ""}
          </p>
          <a
            href="https://fichaloop.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-forge-dark"
          >
            Hecho con fichaloop
          </a>
        </div>
      </footer>
    </div>
  );
}

function SeccionRender({ s }: { s: SeccionWeb }) {
  switch (s.tipo) {
    case "hero":
      // Portada con el mismo efecto que el login del cliente (rejilla
      // cinética + velo oscuro) y el acceso integrado a la derecha.
      return (
        <section id="acceso" className="relative scroll-mt-20 overflow-hidden bg-forge-dark text-white">
          <KineticGridBackground className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-forge-dark/70" />
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-12 md:py-24">
            <div className="md:col-span-7">
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                {s.titulo}
              </h1>
              {s.subtitulo && (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">{s.subtitulo}</p>
              )}
              <a
                href="#contacto"
                className="mt-10 inline-block rounded-xl bg-forge-orange px-7 py-3.5 font-bold text-white transition hover:bg-forge-orange-600"
              >
                Cuéntanos tu proyecto
              </a>
            </div>
            <div className="md:col-span-5">
              <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-forge-dark/50 p-6 backdrop-blur-sm sm:p-7">
                <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                  Área de clientes
                </p>
                <LoginForm />
              </div>
            </div>
          </div>
        </section>
      );

    case "texto":
      return (
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight">{s.titulo}</h2>
          {s.subtitulo && (
            <p className="mt-4 max-w-3xl whitespace-pre-line leading-relaxed text-slate-500">
              {s.subtitulo}
            </p>
          )}
        </section>
      );

    case "cards":
      return (
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
          <Cabecera s={s} />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {s.items.map((c) => (
              <Card key={c.id} c={c} />
            ))}
          </div>
        </section>
      );

    case "lista":
      return (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
            <Cabecera s={s} />
            <ol className="mt-8 max-w-3xl">
              {s.items.map((i, n) => (
                <li key={i.id} className="flex items-baseline gap-4 border-b border-slate-100 py-4">
                  <span className="text-sm font-bold text-forge-orange">
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg font-medium">{i.texto}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );

    case "chips":
      return (
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
          <Cabecera s={s} />
          <div className="mt-8 flex flex-wrap gap-3">
            {s.items.map((i) => (
              <span
                key={i.id}
                className="rounded-full bg-forge-orange/10 px-5 py-2.5 font-semibold text-forge-orange-600"
              >
                {i.texto}
              </span>
            ))}
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
            <Cabecera s={s} />
            <div className="mt-8 max-w-3xl">
              {s.items.map((i) => (
                <details key={i.id} className="group border-b border-slate-100 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {i.titulo}
                    <IconChevronDown className="h-5 w-5 shrink-0 text-forge-orange transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-slate-500">{i.texto}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <section id="contacto" className="scroll-mt-20 bg-forge-dark text-white">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{s.titulo}</h2>
            {s.subtitulo && <p className="mt-4 max-w-2xl text-white/60">{s.subtitulo}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {s.telefono && (
                <a href={`tel:${s.telefono.replace(/\s/g, "")}`} className={btnCta}>
                  Llamar · {s.telefono}
                </a>
              )}
              {s.whatsapp && (
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnCta}
                >
                  WhatsApp
                </a>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className={btnCta}>
                  {s.email}
                </a>
              )}
              {!s.telefono && !s.email && !s.whatsapp && (
                <Link to="/login" className={btnCta}>
                  Acceso clientes
                </Link>
              )}
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
}

const btnCta =
  "rounded-xl bg-forge-orange px-6 py-3 font-bold text-white transition hover:bg-forge-orange-600";

function Cabecera({ s }: { s: SeccionWeb }) {
  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight">{s.titulo}</h2>
      {s.subtitulo && <p className="mt-3 max-w-2xl text-slate-500">{s.subtitulo}</p>}
    </div>
  );
}

function Card({ c }: { c: ItemWeb }) {
  return (
    <article
      className={`card flex flex-col p-6 ${
        c.destacada ? "border-2 border-forge-orange shadow-card-lg" : ""
      }`}
    >
      {c.etiqueta && (
        <p
          className={`mb-4 w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
            c.destacada ? "bg-forge-orange text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          {c.etiqueta}
        </p>
      )}
      <h3 className="text-2xl font-extrabold">{c.titulo}</h3>
      {c.texto && <p className="mt-2 text-sm text-slate-500">{c.texto}</p>}
      {c.puntos && c.puntos.length > 0 && (
        <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
          {c.puntos.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-forge-orange" />
              {p}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
