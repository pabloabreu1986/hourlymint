import { Link } from "react-router-dom";
import logoLight from "@/assets/fichaloop_black.png";

// Términos y Condiciones de fichaloop. Documento MODELO orientado a una
// plataforma SaaS que trata datos de control horario, geolocalización y
// nóminas por cuenta de empresas cliente (UE / España). Debe ser revisado
// por un profesional jurídico y completado con los datos de la sociedad
// antes de su uso en producción (campos entre corchetes).

const ACTUALIZADO = "28 de julio de 2026";
const NARANJA = "#E8721C";

function H({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="mt-10 scroll-mt-24 text-xl font-extrabold tracking-[-0.02em] text-[#101418]">
      <span style={{ color: NARANJA }}>{n}.</span> {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 leading-relaxed text-black/70">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="leading-relaxed text-black/70">{children}</li>;
}

export default function Terminos() {
  return (
    <div className="min-h-full bg-[#F5F3EE] text-[#101418]">
      <header className="border-b border-black/10 bg-[#F5F3EE]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
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

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-[clamp(2.4rem,6vw,3.5rem)] font-black leading-[0.9] tracking-[-0.05em]">
          Términos y Condiciones
        </h1>
        <p className="mt-4 text-black/50">Última actualización: {ACTUALIZADO}</p>

        <H n="1">Identificación del prestador</H>
        <P>
          El presente sitio web y la aplicación «fichaloop» (en adelante, la «Plataforma») son
          titularidad de <strong>[Razón social]</strong>, con CIF <strong>[CIF]</strong> y
          domicilio en <strong>[Domicilio completo]</strong>, inscrita en el Registro Mercantil
          de <strong>[Provincia]</strong> (en adelante, «fichaloop», «nosotros» o el «Prestador»).
          Correo de contacto: <strong>[email de contacto]</strong>. La Plataforma ha sido
          desarrollada por{" "}
          <a
            href="https://ensodev.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            ensodev.eu
          </a>
          .
        </P>

        <H n="2">Objeto y aceptación</H>
        <P>
          Estas Condiciones Generales regulan el acceso y uso de la Plataforma por parte de las
          empresas cliente (en adelante, el «Cliente») y de las personas usuarias autorizadas por
          este (administradores, encargados y personas trabajadoras).
        </P>
        <P>
          <strong>
            Al iniciar sesión, registrarse o utilizar la Plataforma como Cliente o usuario
            autorizado, usted declara haber leído, entendido y aceptado íntegramente estos
            Términos y Condiciones y la Política de Privacidad.
          </strong>{" "}
          Si no está de acuerdo con ellos, debe abstenerse de acceder y utilizar la Plataforma.
          Quien acepta en nombre de una empresa declara tener capacidad y poder de representación
          suficientes para obligar a dicha empresa.
        </P>

        <H n="3">Descripción del servicio</H>
        <P>
          fichaloop es una herramienta de software como servicio (SaaS) que permite a las empresas
          gestionar el registro de jornada y fichajes, partes de trabajo, documentación
          fotográfica de obra, control de materiales, recursos e incidencias, así como el cómputo
          de horas para su tratamiento en nómina. La Plataforma se ofrece como <em>medio o
          instrumento</em> para que el Cliente cumpla sus obligaciones legales; fichaloop no presta
          servicios de asesoría laboral, fiscal ni jurídica.
        </P>

        <H n="4">Cuentas, credenciales y acceso</H>
        <P>
          El Cliente es responsable de la creación, gestión y baja de las cuentas de sus usuarios,
          de la asignación de perfiles (administrador, encargado, trabajador) y de la custodia y
          confidencialidad de las credenciales. El Cliente responde de toda actividad realizada a
          través de sus cuentas y se compromete a notificar sin demora cualquier uso no autorizado
          o brecha de seguridad de la que tenga conocimiento.
        </P>

        <H n="5">Protección de datos personales</H>
        <P>
          El tratamiento de datos personales se rige por el Reglamento (UE) 2016/679 (RGPD), la Ley
          Orgánica 3/2018 (LOPDGDD) y demás normativa aplicable.
        </P>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <Li>
            <strong>Roles.</strong> El Cliente actúa como <strong>Responsable del tratamiento</strong>{" "}
            de los datos de sus personas trabajadoras. fichaloop actúa como{" "}
            <strong>Encargado del tratamiento</strong> y trata dichos datos únicamente siguiendo las
            instrucciones del Cliente y para prestar el servicio, conforme al artículo 28 del RGPD.
          </Li>
          <Li>
            <strong>Contrato de encargo.</strong> La relación entre las partes en materia de
            protección de datos se completa con el correspondiente Acuerdo de Encargo del
            Tratamiento (DPA), que forma parte integrante de estas Condiciones.
          </Li>
          <Li>
            <strong>Base jurídica e información.</strong> Corresponde al Cliente, como Responsable,
            determinar la base jurídica del tratamiento, informar a las personas trabajadoras del
            tratamiento de sus datos (incluidos el registro horario y la geolocalización) y, cuando
            proceda, recabar el consentimiento u otra base habilitante, así como consultar a la
            representación legal de los trabajadores en los términos legalmente exigibles.
          </Li>
          <Li>
            <strong>Categorías de datos.</strong> La Plataforma trata datos identificativos, de
            contacto, de jornada y fichajes, ubicación/geolocalización asociada a los fichajes,
            imágenes de obra y datos necesarios para el cómputo de horas.
          </Li>
          <Li>
            <strong>Seguridad y brechas.</strong> fichaloop aplica medidas técnicas y organizativas
            apropiadas (artículo 32 del RGPD) y notificará al Cliente sin dilación indebida las
            violaciones de seguridad de las que tenga conocimiento (artículos 33 y 34 del RGPD).
          </Li>
          <Li>
            <strong>Subencargados.</strong> El Cliente autoriza a fichaloop a recurrir a proveedores
            de infraestructura (alojamiento, base de datos y almacenamiento) que actúan como
            subencargados, sujetos a obligaciones equivalentes de protección de datos.
          </Li>
          <Li>
            <strong>Transferencias internacionales.</strong> Cuando existan, se ampararán en
            mecanismos válidos conforme al Capítulo V del RGPD (decisiones de adecuación o cláusulas
            contractuales tipo).
          </Li>
          <Li>
            <strong>Derechos.</strong> fichaloop asistirá razonablemente al Cliente en la atención de
            los derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición
            de los interesados.
          </Li>
        </ul>

        <H n="6">Registro de jornada y control horario</H>
        <P>
          La funcionalidad de fichaje pretende facilitar el cumplimiento del registro diario de
          jornada exigido por la Directiva 2003/88/CE relativa a la ordenación del tiempo de
          trabajo y por la jurisprudencia del Tribunal de Justicia de la Unión Europea (asunto
          C-55/18, CCOO), así como, en España, por el artículo 34.9 del Estatuto de los Trabajadores
          y el Real Decreto-ley 8/2019.
        </P>
        <P>
          El Cliente es el único responsable de la implantación, veracidad, conservación y uso de
          los registros de jornada conforme a la legislación aplicable, de su puesta a disposición
          de la representación de los trabajadores e Inspección de Trabajo, y de cualquier decisión
          laboral o retributiva adoptada a partir de dichos registros. Las reglas de cálculo por
          defecto de la Plataforma (por ejemplo, cierre de jornada ordinaria, descansos u horas
          extraordinarias) son parametrizables y meramente instrumentales, y no sustituyen la
          verificación y validación por el Cliente.
        </P>

        <H n="7">Geolocalización</H>
        <P>
          La Plataforma puede registrar la ubicación del dispositivo en el momento del fichaje. El
          Cliente se obliga a utilizar esta función de forma proporcional y limitada a la finalidad
          de verificar el fichaje, a informar previamente a las personas trabajadoras y a disponer
          de base jurídica adecuada, de acuerdo con las directrices de las autoridades de control.
          fichaloop no realiza seguimiento continuo de localización ni tratamientos distintos de los
          instruidos por el Cliente.
        </P>

        <H n="8">Nóminas y cálculo de horas</H>
        <P>
          El cómputo de horas ordinarias, descansos y horas extraordinarias que ofrece la Plataforma
          es una ayuda de cálculo. fichaloop no garantiza que dicho cómputo se ajuste a todos los
          convenios colectivos, pactos individuales o normas aplicables a cada Cliente, ni asume
          responsabilidad alguna por errores en nóminas, cotizaciones o pagos derivados del uso de
          los datos. Corresponde al Cliente revisar y validar los cálculos antes de su uso.
        </P>

        <H n="9">Obligaciones del Cliente y uso aceptable</H>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <Li>Utilizar la Plataforma conforme a la ley, la buena fe y estas Condiciones.</Li>
          <Li>
            Garantizar la licitud del tratamiento de los datos que introduce y contar con las bases
            jurídicas e informaciones exigibles frente a sus trabajadores.
          </Li>
          <Li>
            No introducir datos ni contenidos ilícitos, ni categorías especiales de datos no
            necesarias para el servicio.
          </Li>
          <Li>
            No realizar ingeniería inversa, no vulnerar la seguridad, ni utilizar la Plataforma para
            fines distintos de los previstos.
          </Li>
          <Li>Mantener actualizados y veraces los datos de su cuenta.</Li>
        </ul>

        <H n="10">Propiedad intelectual e industrial</H>
        <P>
          La Plataforma, su software, código, diseño, marcas y demás elementos son titularidad de
          fichaloop o de sus licenciantes y quedan protegidos por la normativa de propiedad
          intelectual e industrial. La aceptación de estas Condiciones otorga al Cliente un derecho
          de uso limitado, no exclusivo, intransferible y revocable durante la vigencia del servicio.
          Los datos y contenidos introducidos por el Cliente siguen siendo de su titularidad.
        </P>

        <H n="11">Disponibilidad del servicio</H>
        <P>
          fichaloop realizará esfuerzos razonables para mantener la Plataforma disponible, pero el
          servicio se presta «tal cual» y «según disponibilidad», sin garantía de funcionamiento
          ininterrumpido o libre de errores. Podrán realizarse tareas de mantenimiento,
          actualización o suspensión temporal por causas técnicas o de seguridad.
        </P>

        <H n="12">Limitación de responsabilidad</H>
        <P>
          En la máxima medida permitida por la ley, fichaloop no será responsable de daños
          indirectos, lucro cesante, pérdida de datos, sanciones administrativas, reclamaciones
          laborales o de terceros, ni de perjuicios derivados de decisiones adoptadas por el Cliente
          a partir de la información de la Plataforma. La responsabilidad total y acumulada de
          fichaloop, por cualquier concepto, quedará limitada a los importes efectivamente abonados
          por el Cliente por el servicio en los <strong>[doce (12)]</strong> meses anteriores al
          hecho que origine la reclamación.
        </P>
        <P>
          Ninguna disposición de estas Condiciones excluye o limita la responsabilidad que no pueda
          excluirse o limitarse legalmente (por ejemplo, dolo, culpa grave, daños a la vida o
          integridad de las personas, o derechos imperativos que asistan al Cliente).
        </P>

        <H n="13">Indemnización</H>
        <P>
          El Cliente mantendrá indemne a fichaloop y a ensodev.eu frente a cualquier reclamación,
          sanción, daño o gasto (incluidos honorarios razonables de defensa jurídica) derivados del
          incumplimiento por el Cliente de estas Condiciones, de la normativa de protección de datos
          o laboral, o del uso ilícito o indebido de la Plataforma.
        </P>

        <H n="14">Precio, duración y terminación</H>
        <P>
          Las condiciones económicas, en su caso, se pactarán por separado. Cualquiera de las partes
          podrá resolver la relación conforme a lo acordado. A la finalización, el Cliente podrá
          solicitar la exportación de sus datos durante un plazo razonable, tras el cual fichaloop
          procederá a su supresión o devolución conforme a las instrucciones del Cliente y a la
          normativa aplicable.
        </P>

        <H n="15">Modificaciones</H>
        <P>
          fichaloop podrá modificar estas Condiciones para adaptarlas a cambios legales, técnicos o
          del servicio. Las modificaciones se publicarán en esta página con su fecha de
          actualización; el uso continuado de la Plataforma tras su publicación implica su
          aceptación.
        </P>

        <H n="16">Fuerza mayor</H>
        <P>
          Ninguna de las partes será responsable por incumplimientos derivados de causas de fuerza
          mayor o ajenas a su control razonable (fallos de suministro, telecomunicaciones,
          proveedores de infraestructura, ciberataques, etc.).
        </P>

        <H n="17">Ley aplicable y jurisdicción</H>
        <P>
          Estas Condiciones se rigen por la legislación española y de la Unión Europea. Para la
          resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales de{" "}
          <strong>[localidad]</strong>, salvo que la normativa imperativa disponga otro fuero.
        </P>

        <H n="18">Nulidad parcial, cesión y comunicaciones</H>
        <P>
          Si alguna cláusula fuese declarada nula, el resto continuará siendo válido. El Cliente no
          podrá ceder su posición sin consentimiento de fichaloop. Las comunicaciones se realizarán
          a través de los datos de contacto facilitados por cada parte.
        </P>

        <H n="19">Contacto</H>
        <P>
          Para cualquier cuestión relativa a estas Condiciones o a la protección de datos, puede
          dirigirse a <strong>[email de contacto]</strong> o, en su caso, al Delegado de Protección
          de Datos en <strong>[email DPD]</strong>.
        </P>

        <div className="mt-12 border-t border-black/10 pt-6 text-sm text-black/45">
          <p>
            Al utilizar fichaloop usted reconoce haber leído y aceptado estos Términos y Condiciones.
          </p>
          <p className="mt-2">
            © 2026 fichaloop · Desarrollado por{" "}
            <a
              href="https://ensodev.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              ensodev.eu
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
