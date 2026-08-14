import { useEffect, useState } from "react";
import { resetDB } from "@/lib/db";
import { fijarTenant, tenantActual } from "@/lib/branding";
import { useAuth } from "@/context/AuthContext";
import { tenantApi } from "@/services";
import { Modal, Spinner } from "@/components/ui";
import type { DatosFiscales } from "@/lib/types";
import { IconSettings, IconTrash, IconBox, IconCheck, IconMegaphone, IconReceipt } from "@/components/icons";

/** Datos fiscales/legales de la empresa (aparecen en presupuestos y facturas). */
function DatosFacturacion() {
  const [f, setF] = useState<DatosFiscales | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    tenantApi.getTenant().then((t) =>
      setF({
        razonSocial: t.fiscal?.razonSocial ?? t.nombre,
        nif: t.fiscal?.nif ?? "",
        direccion: t.fiscal?.direccion ?? "",
        cp: t.fiscal?.cp ?? "",
        ciudad: t.fiscal?.ciudad ?? "",
        provincia: t.fiscal?.provincia ?? "",
        iban: t.fiscal?.iban ?? "",
        formaPago: t.fiscal?.formaPago ?? "",
        ivaDefecto: t.fiscal?.ivaDefecto ?? 21,
        textoLegal: t.fiscal?.textoLegal ?? "",
      })
    );
  }, []);

  if (!f) return null;
  const set = (patch: Partial<DatosFiscales>) => {
    setF({ ...f, ...patch });
    setGuardado(false);
  };

  async function guardar() {
    if (!f) return;
    setGuardando(true);
    try {
      const t = await tenantApi.getTenant();
      const guardado = await tenantApi.guardarTenant({ ...t, fiscal: f });
      fijarTenant(guardado);
      setGuardado(true);
    } finally {
      setGuardando(false);
    }
  }

  const campo = "field mt-1.5";
  return (
    <section className="card p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-forge-orange/10 text-forge-orange">
          <IconReceipt className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-bold text-forge-dark">Datos de facturación</h2>
          <p className="text-sm text-slate-400">
            Aparecen en la cabecera y el pie de tus presupuestos y facturas.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Razón social</label>
          <input className={campo} value={f.razonSocial} onChange={(e) => set({ razonSocial: e.target.value })} placeholder="FORGEVIA, S.L." />
        </div>
        <div>
          <label className="label">NIF / CIF</label>
          <input className={campo} value={f.nif} onChange={(e) => set({ nif: e.target.value })} placeholder="B12345678" />
        </div>
        <div>
          <label className="label">IBAN</label>
          <input className={campo} value={f.iban} onChange={(e) => set({ iban: e.target.value })} placeholder="ES00 0000 0000 0000 0000 0000" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Domicilio fiscal</label>
          <input className={campo} value={f.direccion} onChange={(e) => set({ direccion: e.target.value })} placeholder="Calle, número, planta…" />
        </div>
        <div>
          <label className="label">Código postal</label>
          <input className={campo} value={f.cp} onChange={(e) => set({ cp: e.target.value })} placeholder="28010" />
        </div>
        <div>
          <label className="label">Ciudad</label>
          <input className={campo} value={f.ciudad} onChange={(e) => set({ ciudad: e.target.value })} placeholder="Madrid" />
        </div>
        <div>
          <label className="label">Provincia</label>
          <input className={campo} value={f.provincia} onChange={(e) => set({ provincia: e.target.value })} placeholder="Madrid" />
        </div>
        <div>
          <label className="label">IVA por defecto (%)</label>
          <input type="number" className={campo} value={f.ivaDefecto ?? 21} onChange={(e) => set({ ivaDefecto: Number(e.target.value) || 0 })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Forma de pago</label>
          <input className={campo} value={f.formaPago} onChange={(e) => set({ formaPago: e.target.value })} placeholder="Inmediata (Transferencia)" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Texto legal al pie (RGPD)</label>
          <textarea className={campo} rows={3} value={f.textoLegal} onChange={(e) => set({ textoLegal: e.target.value })} placeholder="Cláusula de protección de datos…" />
        </div>
      </div>
      <button onClick={guardar} disabled={guardando} className="btn-primary mt-4 px-5 py-2.5">
        {guardando ? <Spinner className="h-5 w-5" /> : guardado ? (<><IconCheck className="h-5 w-5" /> Guardado</>) : "Guardar datos"}
      </button>
    </section>
  );
}

/** Contacto de la web pública del cliente (lo edita su propio admin). */
function ContactoWeb() {
  const [tieneWeb, setTieneWeb] = useState<boolean | null>(null);
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    tenantApi.getTenant().then((t) => {
      const cta = t.web?.find((s) => s.tipo === "cta");
      setTieneWeb(!!t.web && t.web.length > 0);
      setTelefono(cta?.telefono ?? "");
      setWhatsapp(cta?.whatsapp ?? "");
      setEmail(cta?.email ?? "");
    });
  }, []);

  // Sin web pública configurada no hay nada que editar aquí.
  if (tieneWeb === null || !tieneWeb) return null;

  async function guardar() {
    setGuardando(true);
    try {
      const t = await tenantApi.actualizarContactoWeb({
        telefono: telefono.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
      });
      if (t) fijarTenant(t); // refresca la caché local de la marca/web
      setGuardado(true);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-forge-orange/10 text-forge-orange">
          <IconMegaphone className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-bold text-forge-dark">Contacto de tu web pública</h2>
          <p className="text-sm text-slate-400">
            Adónde llegan los clientes del formulario «Cuéntanos tu proyecto».
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Teléfono</label>
          <input
            className="field mt-1.5"
            inputMode="tel"
            placeholder="600 000 000"
            value={telefono}
            onChange={(e) => { setTelefono(e.target.value); setGuardado(false); }}
          />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input
            className="field mt-1.5"
            inputMode="tel"
            placeholder="+34 600 000 000"
            value={whatsapp}
            onChange={(e) => { setWhatsapp(e.target.value); setGuardado(false); }}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="field mt-1.5"
            type="email"
            placeholder="hola@tuempresa.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setGuardado(false); }}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        El email recibe los datos del formulario; el WhatsApp es el del botón «Continuar por
        WhatsApp». Deja vacío lo que no quieras mostrar.
      </p>
      <button onClick={guardar} disabled={guardando} className="btn-primary mt-4 px-5 py-2.5">
        {guardando ? (
          <Spinner className="h-5 w-5" />
        ) : guardado ? (
          <>
            <IconCheck className="h-5 w-5" /> Guardado
          </>
        ) : (
          "Guardar contacto"
        )}
      </button>
    </section>
  );
}

export default function AdminConfiguracion() {
  const { logout } = useAuth();
  const [confirmar, setConfirmar] = useState(false);
  const tenant = tenantActual();

  return (
    <div className="max-w-2xl space-y-6">
      <section className="card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-forge-dark/5 text-forge-dark">
            <IconSettings className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-bold text-forge-dark">{tenant.nombre}</h2>
            <p className="text-sm text-slate-400">Versión 0.1.0 — Demo con datos mock (localStorage)</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-slate-500">
          <li className="flex items-center gap-2">
            <IconBox className="h-4 w-4 text-forge-orange" /> Los datos se guardan en el navegador
            (localStorage) y persisten entre sesiones.
          </li>
          <li className="flex items-center gap-2">
            <IconBox className="h-4 w-4 text-forge-orange" /> Al conectar la base de datos real solo
            cambia la capa <code className="rounded bg-slate-100 px-1">services/</code>.
          </li>
        </ul>
      </section>

      <DatosFacturacion />

      <ContactoWeb />

      <section className="card p-6">
        <h2 className="font-bold text-forge-dark">Datos de demostración</h2>
        <p className="mt-1 text-sm text-slate-500">
          Restablece todos los datos (usuarios, obras, fichajes, partes…) a los valores de ejemplo.
          Útil para volver a un estado limpio durante las pruebas.
        </p>
        <button
          onClick={() => setConfirmar(true)}
          className="btn mt-4 border border-red-200 bg-white px-5 py-3 text-red-600 hover:bg-red-50"
        >
          <IconTrash className="h-5 w-5" /> Restablecer datos
        </button>
      </section>

      <Modal open={confirmar} onClose={() => setConfirmar(false)} title="Restablecer datos">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Se borrarán todos los cambios y se volverá a los datos de ejemplo. Se cerrará la sesión.
            ¿Continuar?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmar(false)} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button
              onClick={() => {
                resetDB();
                logout();
              }}
              className="btn flex-1 bg-red-500 px-5 py-3 text-white hover:bg-red-600"
            >
              Restablecer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
