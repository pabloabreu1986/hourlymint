import { Modal } from "@/components/ui";

/**
 * Guía laboral orientativa del sector de la construcción: vacaciones,
 * permisos retribuidos, bajas/IT y jornada. Pensada como chuleta "a mano"
 * para el admin. NO es asesoramiento legal: las cuantías y días dependen del
 * convenio provincial vigente y de cambios normativos.
 */

interface Bloque {
  titulo: string;
  items: { t: string; d: string }[];
}

const BLOQUES: Bloque[] = [
  {
    titulo: "Vacaciones",
    items: [
      { t: "Mínimo legal", d: "30 días naturales al año (Estatuto de los Trabajadores, art. 38). El convenio de la construcción concreta los días; revisa el convenio provincial aplicable." },
      { t: "No canjeables por dinero", d: "Salvo a la finalización del contrato. Se disfrutan en el periodo pactado con la empresa." },
      { t: "Coincidencia con baja/parto", d: "Si las vacaciones coinciden con una IT o con el permiso por nacimiento, se pueden disfrutar en otro momento." },
    ],
  },
  {
    titulo: "Permisos retribuidos (días propios)",
    items: [
      { t: "Matrimonio / pareja de hecho", d: "15 días naturales." },
      { t: "Fallecimiento de cónyuge/pareja o familiar hasta 2º grado", d: "2 días (4 si requiere desplazamiento)." },
      { t: "Accidente/enfermedad grave, hospitalización o intervención con reposo domiciliario (cónyuge/pareja, familiar hasta 2º grado o conviviente)", d: "5 días (reforma RDL 5/2023)." },
      { t: "Fuerza mayor familiar (motivos urgentes)", d: "Hasta 4 días al año." },
      { t: "Traslado de domicilio habitual", d: "1 día." },
      { t: "Deber público/personal inexcusable", d: "El tiempo indispensable (voto, citación judicial, DNI…)." },
      { t: "Exámenes prenatales y preparación al parto", d: "El tiempo necesario, dentro de la jornada." },
      { t: "Lactancia", d: "1 hora/día (o reducción de jornada / acumulación) hasta los 9 meses del bebé." },
    ],
  },
  {
    titulo: "Nacimiento y cuidado de menor",
    items: [
      { t: "Permiso por nacimiento", d: "16 semanas por cada progenitor, intransferibles (las 6 primeras obligatorias e ininterrumpidas tras el parto)." },
      { t: "Permiso parental", d: "Hasta 8 semanas (no retribuido) para el cuidado de hijo/a hasta los 8 años (RDL 5/2023)." },
    ],
  },
  {
    titulo: "Baja médica (Incapacidad Temporal)",
    items: [
      { t: "Enfermedad común / accidente no laboral", d: "Días 1-3: sin prestación (salvo mejora por convenio). Días 4-20: 60% de la base reguladora. Desde el día 21: 75%." },
      { t: "Accidente de trabajo / enfermedad profesional", d: "75% de la base reguladora desde el día siguiente a la baja." },
      { t: "Complemento del convenio", d: "El convenio de la construcción suele complementar la prestación (p. ej. hasta el 100% en accidente laboral). Revisa el convenio provincial." },
      { t: "Duración", d: "Máximo 365 días, prorrogables 180 más. El parte de baja lo emite el médico del SNS/mutua." },
    ],
  },
  {
    titulo: "Jornada y obligaciones",
    items: [
      { t: "Jornada anual", d: "La pactada en convenio (orientativo ~1.736 h/año en construcción). Revisa el convenio vigente." },
      { t: "Registro horario", d: "Obligatorio registrar la jornada diaria de cada trabajador (RD-ley 8/2019). El módulo de Horas te sirve de registro." },
      { t: "Prevención y formación (TPC)", d: "Formación obligatoria en PRL del sector y Tarjeta Profesional de la Construcción; reconocimientos médicos periódicos." },
    ],
  },
];

const ENLACES: { t: string; url: string }[] = [
  { t: "Convenio General del Sector de la Construcción (BOE)", url: "https://www.boe.es/buscar/doc.php?id=BOE-A-2023-19722" },
  { t: "Estatuto de los Trabajadores (BOE)", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430" },
  { t: "Prestación de Incapacidad Temporal (Seguridad Social)", url: "https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/10938/11566/28468" },
  { t: "Fundación Laboral de la Construcción (TPC/formación)", url: "https://www.fundacionlaboral.org/" },
];

export default function GuiaLaboral({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Guía laboral · construcción" maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <b>Orientativo, no es asesoramiento legal.</b> Las cuantías y los días pueden variar según
          el <b>convenio provincial vigente</b> y cambios normativos. Ante cualquier caso concreto,
          consulta el convenio aplicable y a un asesor laboral.
        </div>

        {BLOQUES.map((b) => (
          <div key={b.titulo}>
            <h3 className="mb-2 font-bold text-forge-dark">{b.titulo}</h3>
            <ul className="space-y-2">
              {b.items.map((it, i) => (
                <li key={i} className="rounded-lg bg-slate-50 p-2.5 text-sm">
                  <span className="font-semibold text-forge-dark">{it.t}.</span>{" "}
                  <span className="text-slate-600">{it.d}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-2 font-bold text-forge-dark">Fuentes oficiales</h3>
          <ul className="space-y-1 text-sm">
            {ENLACES.map((e) => (
              <li key={e.url}>
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-forge-orange hover:underline"
                >
                  {e.t} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
