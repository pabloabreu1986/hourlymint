// Render del dosier corporativo (A4 apaisado). Mismo componente para la
// vista previa, el editor en vivo y el PDF (imprimiendo con @page).
//
// Todo es configurable desde el editor: posición de la imagen por página
// (fondo/izquierda/derecha/diagonal/ninguna) + offset del corte diagonal;
// iconos (lucide) con color/tamaño por ítem o global; color/tamaño/fuente
// del número+título de página; alineación de portada/contraportada.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type {
  BloqueDosier,
  Dosier,
  EstiloDosier,
  ItemDosier,
  PosicionImagen,
  Tenant,
  TipoBloqueDosier,
  Alineacion,
} from "@/lib/types";
import { LogoMark } from "@/components/Logo";
import { iconoDefectoPorIndice, resolverIcono } from "./dosier-iconos";

const dosNum = (n: number) => String(n).padStart(2, "0");
const TXT = "text-[30px] font-light leading-tight tracking-tight text-forge-dark";

// Posición de imagen por defecto según el tipo (para dosiers ya creados).
const POS_DEFECTO: Record<TipoBloqueDosier, PosicionImagen> = {
  "texto-imagen": "derecha",
  "lista-imagen": "diagonal",
  pasos: "derecha",
  iconos: "ninguna",
  servicios: "diagonal",
  logos: "ninguna",
  "lista-detalle": "ninguna",
  "antes-despues": "ninguna",
  garantias: "izquierda",
  testimonios: "ninguna",
  pagos: "ninguna",
  faq: "ninguna",
};

export function posDe(b: BloqueDosier): PosicionImagen {
  return b.imagenPos ?? POS_DEFECTO[b.tipo] ?? "ninguna";
}

// ─── Piezas compartidas ──────────────────────────────────────

export function CreditoFichaloop({ claro = false }: { claro?: boolean }) {
  const link = claro
    ? "font-bold text-white/70 hover:text-white"
    : "font-bold text-forge-dark hover:text-forge-orange";
  return (
    <span className={`text-[9px] font-medium ${claro ? "text-white/40" : "text-black/35"}`}>
      Powered by{" "}
      <a href="https://fichaloop.com" target="_blank" rel="noopener noreferrer" className={link}>
        fichaloop
      </a>{" "}
      · un sistema de{" "}
      <a href="https://ensodev.eu" target="_blank" rel="noopener noreferrer" className={link}>
        ENSODev
      </a>
    </span>
  );
}

function fuenteClase(f?: string): string {
  return f === "serif" ? "font-serif" : f === "mono" ? "font-mono" : "";
}

/** Número + título de página, con estilo configurable. */
function Encabezado({
  n,
  titulo,
  estilo,
  claro,
  nowrap,
}: {
  n: number;
  titulo: string;
  estilo?: EstiloDosier;
  claro?: boolean;
  nowrap?: boolean;
}) {
  const size = estilo?.numeroSize ?? 50;
  const numColor = estilo?.numeroColor;
  const titColor = estilo?.tituloColor;
  return (
    <h2
      className={`font-light leading-[1.02] tracking-tight ${fuenteClase(estilo?.numeroFuente)} ${
        nowrap ? "whitespace-nowrap" : ""
      } ${claro ? "text-white" : "text-forge-dark"}`}
      style={{ fontSize: size, textShadow: claro ? "0 1px 10px rgb(0 0 0 / 45%)" : undefined }}
    >
      <span className={numColor ? "" : "text-forge-orange"} style={numColor ? { color: numColor } : undefined}>
        {dosNum(n)}
      </span>
      <span
        className={titColor ? "" : claro ? "text-white/85" : "text-black/70"}
        style={titColor ? { color: titColor } : undefined}
      >
        {" "}
        — {titulo}
      </span>
    </h2>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 text-[14px] font-light text-black/45">{children}</p>;
}

function Desc({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-[13px] font-light leading-snug text-black/50">{children}</p>;
}

/** Icono de un ítem (lucide), con color/tamaño por ítem o global. */
function IconoItem({
  item,
  idx,
  estilo,
  className = "",
}: {
  item: ItemDosier;
  idx: number;
  estilo?: EstiloDosier;
  className?: string;
}) {
  const Icono = resolverIcono(item.icono || iconoDefectoPorIndice(idx));
  const size = item.iconoSize ?? estilo?.iconoSize ?? 30;
  const color = item.iconoColor || estilo?.iconoColor;
  return (
    <Icono
      size={size}
      strokeWidth={1.5}
      className={`${className} ${color ? "" : "text-forge-orange"}`}
      style={color ? { color } : undefined}
    />
  );
}

function Foto({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  if (src) return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />;
  return (
    <div className={`grid h-full w-full place-items-center bg-forge-canvas text-black/20 ${className}`} aria-hidden>
      <span className="text-[11px] font-light uppercase tracking-[0.18em]">{alt}</span>
    </div>
  );
}

/** Capa de imagen a sangre según la posición. */
function CapaImagen({ src, pos, offset = 30 }: { src?: string | null; pos: PosicionImagen; offset?: number }) {
  if (pos === "ninguna") return null;
  if (pos === "fondo")
    return (
      <>
        <div className="absolute inset-0 z-0">
          <Foto src={src} alt="Fondo" />
        </div>
        <div className="absolute inset-0 z-0 bg-white/75" />
      </>
    );
  if (pos === "izquierda")
    return (
      <div className="absolute inset-y-0 left-0 z-0 w-1/2">
        <Foto src={src} alt="Imagen" />
      </div>
    );
  if (pos === "derecha")
    return (
      <div className="absolute inset-y-0 right-0 z-0 w-1/2">
        <Foto src={src} alt="Imagen" />
      </div>
    );
  // diagonal: mitad derecha con borde diagonal; offset sube/baja el corte.
  const top = Math.max(0, Math.min(100, offset));
  const bot = Math.max(0, top - 26);
  return (
    <div
      className="absolute inset-y-0 right-0 z-0 w-1/2"
      style={{ clipPath: `polygon(${top}% 0, 100% 0, 100% 100%, ${bot}% 100%)` }}
    >
      <Foto src={src} alt="Imagen" />
    </div>
  );
}

// Presets de sombra del texto (para cuando va sobre la imagen).
const SOMBRAS: Record<string, string | undefined> = {
  ninguna: undefined,
  suave: "0 1px 3px rgba(0,0,0,0.35)",
  fuerte: "0 2px 10px rgba(0,0,0,0.65)",
  halo: "0 0 8px rgba(255,255,255,0.95), 0 0 3px rgba(255,255,255,0.95)",
  contorno: "0 0 2px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.7)",
};

function textAlignClase(a?: Alineacion): string {
  return a === "centro" ? "text-center" : a === "derecha" ? "text-right" : "";
}

/** Ancho (%) del contenido en diagonal, siguiendo el corte (offset). */
function anchoDiagonal(offset = 30): number {
  return Math.max(46, 50 + Math.max(0, offset - 26) / 2 - 3);
}

/** Marco de una página: imagen + cabecera + contenido + crédito. */
function Pagina({
  n,
  titulo,
  estilo,
  src,
  pos,
  offset = 30,
  bg,
  align,
  sobreImagen,
  sombra,
  nowrapTitulo,
  children,
}: {
  n: number;
  titulo: string;
  estilo?: EstiloDosier;
  src?: string | null;
  pos: PosicionImagen;
  offset?: number;
  bg?: string;
  align?: Alineacion;
  sobreImagen?: boolean;
  sombra?: string;
  nowrapTitulo?: boolean;
  children: React.ReactNode;
}) {
  // La cabecera clara (sobre imagen a la izquierda) solo aplica si el texto
  // NO va sobre la imagen (si va sobre imagen, el contenido lleva su sombra).
  const claro = pos === "izquierda" && !sobreImagen;
  const alineado = textAlignClase(align);
  const sombraCss = sombra ? SOMBRAS[sombra] : undefined;

  // Ancho del contenido: a un lado de la imagen, siguiendo el corte, o
  // a todo el ancho (sobre la imagen).
  let wrapCls = "w-full";
  const wrapStyle: React.CSSProperties = {};
  if (sobreImagen) {
    wrapCls = "w-full";
  } else if (pos === "izquierda") {
    wrapCls = "ml-auto w-1/2 pl-10";
  } else if (pos === "derecha") {
    wrapCls = "w-1/2 pr-10";
  } else if (pos === "diagonal") {
    wrapCls = "pr-8";
    wrapStyle.width = `${anchoDiagonal(offset)}%`;
  }
  if (sombraCss) wrapStyle.textShadow = sombraCss;

  return (
    <section className="dosier-pagina relative flex flex-col text-forge-dark" style={{ backgroundColor: bg || "#ffffff" }}>
      <CapaImagen src={src} pos={pos} offset={offset} />
      <div className={`relative flex flex-1 flex-col ${sobreImagen ? "z-20" : "z-10"}`}>
        {claro && (
          <div className="pointer-events-none absolute left-0 top-0 z-20">
            <Encabezado n={n} titulo={titulo} estilo={estilo} claro nowrap={nowrapTitulo} />
          </div>
        )}
        <div className={`flex flex-1 flex-col ${wrapCls} ${alineado}`} style={wrapStyle}>
          {!claro && <Encabezado n={n} titulo={titulo} estilo={estilo} nowrap={nowrapTitulo} />}
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
        <div className="mt-4 pt-2">
          <CreditoFichaloop claro={claro} />
        </div>
      </div>
    </section>
  );
}

// ─── Renderizadores por tipo de bloque ───────────────────────

interface RProps {
  b: BloqueDosier;
  n: number;
  estilo?: EstiloDosier;
}

function pagProps(b: BloqueDosier, n: number, estilo?: EstiloDosier) {
  // El acento de la página (si existe) manda sobre el número y los iconos.
  const est: EstiloDosier | undefined = b.acento
    ? { ...estilo, numeroColor: b.acento, iconoColor: b.acento }
    : estilo;
  return {
    n,
    titulo: b.titulo,
    estilo: est,
    src: b.imagen,
    pos: posDe(b),
    offset: b.diagonalOffset ?? 30,
    bg: b.bg,
    align: b.align,
    sobreImagen: b.textoSobreImagen,
    sombra: b.textoSombra,
  };
}

function TextoImagen({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <div className="flex flex-1 flex-col justify-center">
        <div className="whitespace-pre-line text-[18px] font-light leading-relaxed text-black/70">
          {b.subtitulo}
        </div>
      </div>
    </Pagina>
  );
}

function ListaImagen({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)} nowrapTitulo>
      <div className="mt-8 flex flex-1 flex-col justify-around">
        {b.items.map((i) => (
          <div key={i.id} data-item-id={i.id} className="border-t border-black/10 pt-4 first:border-0 first:pt-0">
            <p className={TXT}>{i.titulo}</p>
            <Desc>{i.texto}</Desc>
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function Pasos({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <div className="mt-8 flex flex-1 flex-col justify-around">
        {b.items.map((i, idx) => (
          <div
            key={i.id} data-item-id={i.id}
            className="flex items-baseline gap-5 border-t border-black/10 pt-4 first:border-0 first:pt-0"
          >
            <span className="w-8 shrink-0 text-[30px] font-light leading-none text-forge-orange">{idx + 1}</span>
            <p className={TXT}>{i.titulo}</p>
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function Iconos({ b, n, estilo }: RProps) {
  const c = b.items.length;
  const cols = c <= 6 ? 3 : c <= 12 ? 4 : 5;
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <Lead>{b.subtitulo}</Lead>
      <div
        className="mt-6 grid flex-1 content-around gap-x-6 gap-y-8"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {b.items.slice(0, 20).map((i, idx) => (
          <div key={i.id} data-item-id={i.id} className="flex flex-col items-center gap-3 text-center">
            <IconoItem item={i} idx={idx} estilo={estilo} className="shrink-0" />
            <p className="text-[30px] font-light leading-tight tracking-tight text-forge-dark">{i.titulo}</p>
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function Servicios({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <Lead>{b.subtitulo}</Lead>
      <div className="mt-4 flex flex-1 flex-col justify-around">
        {b.items.map((i, idx) => (
          <div key={i.id} data-item-id={i.id} className="flex items-start gap-4 border-t border-black/10 pt-4 first:border-0 first:pt-0">
            <IconoItem item={i} idx={idx} estilo={estilo} className="mt-0.5 shrink-0" />
            <div>
              <p className={TXT}>{i.titulo}</p>
              <Desc>{i.texto}</Desc>
            </div>
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function Logos({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <p className="mt-2 max-w-2xl text-[14px] font-light leading-relaxed text-black/55">{b.subtitulo}</p>
      <div className="mt-6 grid flex-1 grid-cols-5 content-around gap-4">
        {b.items.map((i) => (
          <div key={i.id} data-item-id={i.id} className="flex h-16 items-center justify-center rounded-xl border border-black/10 px-3">
            {i.imagen ? (
              <img src={i.imagen} alt={i.titulo} className="max-h-9 max-w-full object-contain" />
            ) : (
              <span className="text-center text-[16px] font-light tracking-tight text-forge-dark">{i.titulo}</span>
            )}
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function ListaDetalle({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <Lead>{b.subtitulo}</Lead>
      <div className="mt-5 grid flex-1 grid-cols-2 content-around gap-x-12 gap-y-8">
        {b.items.map((i, idx) => (
          <div key={i.id} data-item-id={i.id} className="flex gap-4 border-t border-black/10 pt-4">
            <IconoItem item={i} idx={idx} estilo={estilo} className="mt-0.5 shrink-0" />
            <div>
              <p className={TXT}>{i.titulo}</p>
              <Desc>{i.texto}</Desc>
            </div>
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function AntesDespues({ b, n, estilo }: RProps) {
  const antes = b.items[0];
  const despues = b.items[1];
  return (
    <Pagina n={n} titulo={b.titulo} estilo={estilo} pos="ninguna" bg={b.bg} align={b.align}>
      <div className="mt-8 flex flex-1 items-center">
        <div className="grid w-full grid-cols-2 gap-6">
          {[antes, despues].map((i, idx) => (
            <div key={i?.id ?? idx} data-item-id={i?.id} className="relative h-[128mm] overflow-hidden rounded-2xl">
              <Foto src={i?.imagen} alt={i?.titulo || (idx === 0 ? "Antes" : "Después")} />
              <span className="absolute left-4 top-4 bg-forge-dark/85 px-3 py-1 text-[11px] font-light uppercase tracking-[0.18em] text-white">
                {i?.titulo || (idx === 0 ? "Antes" : "Después")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Pagina>
  );
}

function Garantias({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <div className="flex flex-1 flex-col justify-around">
        {b.items.map((i, idx) => (
          <div key={i.id} data-item-id={i.id} className="flex gap-4 border-t border-black/10 pt-4 first:border-0 first:pt-0">
            <IconoItem item={i} idx={idx} estilo={estilo} className="mt-0.5 shrink-0" />
            <div>
              <p className={TXT}>{i.titulo}</p>
              <Desc>{i.texto}</Desc>
            </div>
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function Estrellas({ nEstrellas, estilo }: { nEstrellas: number; estilo?: EstiloDosier }) {
  const Star = resolverIcono("Star");
  const color = estilo?.iconoColor;
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={26}
          strokeWidth={1.5}
          fill={i < nEstrellas ? "currentColor" : "none"}
          className={`${i < nEstrellas ? "" : "opacity-25"} ${color ? "" : "text-forge-orange"}`}
          style={color ? { color } : undefined}
        />
      ))}
    </div>
  );
}

function Testimonios({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <Lead>{b.subtitulo}</Lead>
      <div className="mt-5 grid flex-1 grid-cols-2 content-around gap-6">
        {b.items.map((i) => (
          <div key={i.id} data-item-id={i.id} className="rounded-2xl border border-black/10 p-6">
            <Estrellas nEstrellas={Number(i.valor) || 5} estilo={estilo} />
            <p className="mt-3 text-[16px] font-light leading-relaxed text-black/70">“{i.texto}”</p>
            {i.titulo && <p className="mt-2 text-[13px] font-light text-black/45">{i.titulo}</p>}
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function Pagos({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <Lead>{b.subtitulo}</Lead>
      <div className="mt-4 flex flex-1 flex-col justify-around">
        {b.items.map((i) => (
          <div key={i.id} data-item-id={i.id} className="flex items-center gap-8 border-t border-black/10 pt-4 first:border-0 first:pt-0">
            <span className="w-36 shrink-0 text-5xl font-light tracking-tight text-forge-orange">{i.valor}</span>
            <div>
              <p className={TXT}>{i.titulo}</p>
              {i.texto && <p className="mt-1 text-[14px] font-light text-black/50">{i.texto}</p>}
            </div>
          </div>
        ))}
      </div>
    </Pagina>
  );
}

function Faq({ b, n, estilo }: RProps) {
  return (
    <Pagina {...pagProps(b, n, estilo)}>
      <Lead>{b.subtitulo}</Lead>
      <div className="mt-5 grid flex-1 grid-cols-2 content-around gap-x-12 gap-y-8">
        {b.items.map((i) => (
          <div key={i.id} data-item-id={i.id} className="border-t border-black/10 pt-4">
            <p className={TXT}>{i.titulo}</p>
            {i.texto && <p className="mt-1.5 text-[13px] font-light leading-relaxed text-black/50">{i.texto}</p>}
          </div>
        ))}
      </div>
    </Pagina>
  );
}

/** Cuerpo de un bloque según su tipo. */
function Bloque({ b, n, estilo }: RProps) {
  switch (b.tipo) {
    case "texto-imagen":
      return <TextoImagen b={b} n={n} estilo={estilo} />;
    case "lista-imagen":
      return <ListaImagen b={b} n={n} estilo={estilo} />;
    case "pasos":
      return <Pasos b={b} n={n} estilo={estilo} />;
    case "iconos":
      return <Iconos b={b} n={n} estilo={estilo} />;
    case "servicios":
      return <Servicios b={b} n={n} estilo={estilo} />;
    case "logos":
      return <Logos b={b} n={n} estilo={estilo} />;
    case "lista-detalle":
      return <ListaDetalle b={b} n={n} estilo={estilo} />;
    case "antes-despues":
      return <AntesDespues b={b} n={n} estilo={estilo} />;
    case "garantias":
      return <Garantias b={b} n={n} estilo={estilo} />;
    case "testimonios":
      return <Testimonios b={b} n={n} estilo={estilo} />;
    case "pagos":
      return <Pagos b={b} n={n} estilo={estilo} />;
    case "faq":
      return <Faq b={b} n={n} estilo={estilo} />;
    default:
      return null;
  }
}

// ─── Portada, contraportada y QR ─────────────────────────────

function alineacion(a?: Alineacion): { items: string; text: string } {
  switch (a) {
    case "centro":
      return { items: "items-center", text: "text-center" };
    case "derecha":
      return { items: "items-end", text: "text-right" };
    default:
      return { items: "items-start", text: "text-left" };
  }
}

function Marca({ tenant, tamano }: { tenant: Tenant; tamano: string }) {
  return (
    <h1 className={`font-black leading-[0.95] tracking-[-0.04em] ${tamano}`}>
      {tenant.logotipo ? (
        <>
          {tenant.logotipo.base}
          <span className="text-forge-orange">{tenant.logotipo.acento}</span>
        </>
      ) : (
        tenant.nombreCorto
      )}
    </h1>
  );
}

function QR({ value, size = 112 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let vivo = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M" })
      .then((url) => vivo && setSrc(url))
      .catch(() => vivo && setSrc(""));
    return () => {
      vivo = false;
    };
  }, [value, size]);
  return (
    <div className="rounded-xl bg-white p-2" style={{ width: size, height: size }}>
      {src && <img src={src} alt="Código QR" className="h-full w-full" />}
    </div>
  );
}

function Portada({ tenant, dosier }: { tenant: Tenant; dosier: Dosier }) {
  const al = alineacion(dosier.portadaAlign);
  return (
    <section className="dosier-pagina dosier-portada relative flex flex-col justify-between overflow-hidden bg-forge-dark text-white">
      {dosier.portada && (
        <>
          <img src={dosier.portada} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-forge-dark/70" />
        </>
      )}
      <div className={`relative z-10 flex ${dosier.portadaAlign === "izquierda" ? "justify-start" : "justify-end"}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/50">{dosier.titulo}</p>
      </div>
      <div className={`relative z-10 flex flex-col ${al.items} ${al.text}`}>
        <span className="text-white">
          <LogoMark className="h-16 w-16" />
        </span>
        <div className="mt-6">
          <Marca tenant={tenant} tamano="text-[56px]" />
        </div>
        {dosier.eslogan && (
          <p className="mt-5 max-w-xl whitespace-pre-line text-xl font-light text-white/60">{dosier.eslogan}</p>
        )}
      </div>
      <div className="relative z-10 flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
        <span className="shrink-0">{tenant.eslogan}</span>
        <CreditoFichaloop claro />
      </div>
    </section>
  );
}

function Contraportada({ tenant, dosier }: { tenant: Tenant; dosier: Dosier }) {
  const c = dosier.contacto ?? {};
  const hayContacto = c.telefono || c.email || c.web || c.direccion;
  const urlQR = `https://${tenant.slug}.fichaloop.com`;
  const al = alineacion(dosier.contraAlign);
  return (
    <section className="dosier-pagina relative flex flex-col justify-between overflow-hidden bg-forge-dark text-white">
      <div
        className="absolute inset-y-0 right-0 z-0 w-[55%]"
        style={{ clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0% 100%)" }}
      >
        {dosier.contraportada && (
          <>
            <img src={dosier.contraportada} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-forge-dark/35" />
          </>
        )}
      </div>

      <div className={`relative z-10 flex flex-1 flex-col justify-center ${al.items} ${al.text}`} style={{ maxWidth: "45%" }}>
        <span className="text-white">
          <LogoMark className="h-14 w-14" />
        </span>
        <div className="mt-4">
          <Marca tenant={tenant} tamano="text-4xl" />
        </div>
        {hayContacto && (
          <div className="mt-6 space-y-1.5 text-[15px] font-light text-white/75">
            {c.telefono && <p>Tel. {c.telefono}</p>}
            {c.email && <p>{c.email}</p>}
            {c.web && <p>{c.web}</p>}
            {c.direccion && <p>{c.direccion}</p>}
          </div>
        )}
        <div className="mt-6">
          <QR value={urlQR} />
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Gracias por confiar en nosotros
        </p>
        <CreditoFichaloop claro />
      </div>
    </section>
  );
}

// ─── Documento completo ──────────────────────────────────────

export function bloquesActivos(dosier: Dosier): BloqueDosier[] {
  return dosier.bloques.filter((b) => b.activo);
}

/** Una página suelta (para el editor: portada, un bloque, o contraportada). */
export function PaginaDosier({
  tenant,
  dosier,
  which,
  n,
}: {
  tenant: Tenant;
  dosier: Dosier;
  which: "portada" | "contraportada" | BloqueDosier;
  n?: number;
}) {
  if (which === "portada") return <Portada tenant={tenant} dosier={dosier} />;
  if (which === "contraportada") return <Contraportada tenant={tenant} dosier={dosier} />;
  return <Bloque b={which} n={n ?? 1} estilo={dosier.estilo} />;
}

/**
 * Documento completo: portada + bloques activos + contraportada. La
 * numeración empieza en 01 en el primer bloque; portada/contra no se numeran.
 */
export function DosierDocumento({ tenant, dosier }: { tenant: Tenant; dosier: Dosier }) {
  const activos = bloquesActivos(dosier);
  return (
    <>
      <Portada tenant={tenant} dosier={dosier} />
      {activos.map((b, i) => (
        <Bloque key={b.id} b={b} n={i + 1} estilo={dosier.estilo} />
      ))}
      <Contraportada tenant={tenant} dosier={dosier} />
    </>
  );
}
