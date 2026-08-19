import { useEffect, useState } from "react";
import { clientesApi } from "@/services";
import { CANALES } from "@/lib/finanzas";
import { TIPOS_CONTACTO, ESTADOS_COMERCIAL, esAdminFincas } from "@/lib/fincas";
import { Modal, Spinner } from "@/components/ui";
import type {
  CanalCaptacion,
  Cliente,
  EstadoComercial,
  TipoContacto,
} from "@/lib/types";

type Draft = {
  tipo: TipoContacto;
  nombre: string;
  apellidos: string;
  // Ficha administrador de fincas
  nombreAdministracion: string;
  personaContacto: string;
  cargo: string;
  zona: string;
  web: string;
  numComunidades: string;
  administradorId: string;
  cif: string;
  telefono: string;
  email: string;
  direccion: string;
  cp: string;
  ciudad: string;
  poblacion: string;
  canal: CanalCaptacion;
  canalDetalle: string;
  estadoComercial: EstadoComercial | "";
  // Seguimiento
  fechaPrimerContacto: string;
  fechaUltimoContacto: string;
  proximaAccion: string;
  fechaProximaAccion: string;
  dossierEnviado: boolean;
  notas: string;
  activo: boolean;
};

function draftDe(c: Cliente | null, tipoInicial: TipoContacto): Draft {
  return {
    tipo: c?.tipo ?? tipoInicial,
    nombre: c?.nombre ?? "",
    apellidos: c?.apellidos ?? "",
    nombreAdministracion: c?.nombreAdministracion ?? "",
    personaContacto: c?.personaContacto ?? "",
    cargo: c?.cargo ?? "",
    zona: c?.zona ?? "",
    web: c?.web ?? "",
    numComunidades: c?.numComunidades != null ? String(c.numComunidades) : "",
    administradorId: c?.administradorId ?? "",
    cif: c?.cif ?? "",
    telefono: c?.telefono ?? "",
    email: c?.email ?? "",
    direccion: c?.direccion ?? "",
    cp: c?.cp ?? "",
    ciudad: c?.ciudad ?? "",
    poblacion: c?.poblacion ?? "",
    canal: c?.canal ?? "referencia",
    canalDetalle: c?.canalDetalle ?? "",
    estadoComercial: c?.estadoComercial ?? "",
    fechaPrimerContacto: c?.fechaPrimerContacto ?? "",
    fechaUltimoContacto: c?.fechaUltimoContacto ?? "",
    proximaAccion: c?.proximaAccion ?? "",
    fechaProximaAccion: c?.fechaProximaAccion ?? "",
    dossierEnviado: c?.dossierEnviado ?? false,
    notas: c?.notas ?? "",
    activo: c?.activo ?? true,
  };
}

/** Alta/edición de cliente/contacto. `tipoInicial` prefija el tipo al crear
 * (p. ej. "comunidad" desde la ficha de una administración). `administradorFijo`
 * bloquea la administración padre de una comunidad. */
export default function ClienteForm({
  cliente,
  tipoInicial = "particular",
  administradorFijo = null,
  onClose,
  onSaved,
}: {
  cliente: Cliente | null;
  tipoInicial?: TipoContacto;
  administradorFijo?: string | null;
  onClose: () => void;
  onSaved: (c: Cliente) => void;
}) {
  const [d, setD] = useState<Draft>(() => {
    const base = draftDe(cliente, tipoInicial);
    if (administradorFijo && !cliente) return { ...base, administradorId: administradorFijo };
    return base;
  });
  const [administradores, setAdministradores] = useState<Cliente[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga las administraciones de fincas para el selector de comunidad.
  useEffect(() => {
    clientesApi.listClientes().then((cs) => setAdministradores(cs.filter(esAdminFincas)));
  }, []);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const esAdmin = d.tipo === "admin_fincas";
  const esComunidad = d.tipo === "comunidad";
  const esComercial = d.tipo !== "particular";

  async function guardar() {
    if (esAdmin) {
      if (!d.nombreAdministracion.trim() && !d.nombre.trim())
        return setError("Indica el nombre de la administración.");
    } else if (!d.nombre.trim()) {
      return setError("El nombre es obligatorio.");
    }
    if (esComunidad && !d.administradorId && !administradorFijo)
      return setError("Selecciona la administración que gestiona la comunidad.");

    setGuardando(true);
    setError(null);
    try {
      const payload: Partial<Cliente> = {
        tipo: d.tipo,
        nombre: (esAdmin && !d.nombre.trim() ? d.nombreAdministracion : d.nombre).trim(),
        apellidos: d.apellidos.trim(),
        nombreAdministracion: d.nombreAdministracion.trim(),
        personaContacto: d.personaContacto.trim(),
        cargo: d.cargo.trim(),
        zona: d.zona.trim(),
        web: d.web.trim(),
        numComunidades: d.numComunidades ? Number(d.numComunidades) : undefined,
        administradorId: esComunidad ? administradorFijo ?? d.administradorId : null,
        cif: d.cif.trim(),
        telefono: d.telefono.trim(),
        email: d.email.trim(),
        direccion: d.direccion.trim(),
        cp: d.cp.trim(),
        ciudad: d.ciudad.trim(),
        poblacion: d.poblacion.trim(),
        canal: d.canal,
        canalDetalle: d.canalDetalle.trim(),
        estadoComercial: d.estadoComercial || undefined,
        fechaPrimerContacto: d.fechaPrimerContacto || null,
        fechaUltimoContacto: d.fechaUltimoContacto || null,
        proximaAccion: d.proximaAccion.trim(),
        fechaProximaAccion: d.fechaProximaAccion || null,
        dossierEnviado: d.dossierEnviado,
        notas: d.notas.trim(),
      };
      const saved = cliente
        ? await clientesApi.actualizarCliente(cliente.id, payload)
        : await clientesApi.crearCliente(payload as Parameters<typeof clientesApi.crearCliente>[0]);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  const titulo = cliente
    ? "Editar contacto"
    : esAdmin
      ? "Nuevo administrador de fincas"
      : esComunidad
        ? "Nueva comunidad"
        : "Nuevo contacto";

  return (
    <Modal open onClose={onClose} title={titulo} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Tipo de contacto (obligatorio) */}
        <div>
          <label className="label">Tipo de cliente/contacto *</label>
          <select
            className="field mt-1.5"
            value={d.tipo}
            onChange={(e) => set("tipo", e.target.value as TipoContacto)}
          >
            {TIPOS_CONTACTO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Comunidad → administración que la gestiona */}
        {esComunidad && (
          <div>
            <label className="label">Administración que la gestiona *</label>
            {administradorFijo ? (
              <p className="field mt-1.5 bg-slate-50 text-slate-500">
                {administradores.find((a) => a.id === administradorFijo)?.nombre ??
                  "Administración seleccionada"}
              </p>
            ) : (
              <select
                className="field mt-1.5"
                value={d.administradorId}
                onChange={(e) => set("administradorId", e.target.value)}
              >
                <option value="">— Selecciona administración —</option>
                {administradores.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombreAdministracion || a.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Ficha administrador de fincas */}
        {esAdmin && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
            <div className="col-span-2">
              <label className="label">Nombre de la administración</label>
              <input
                className="field mt-1.5"
                value={d.nombreAdministracion}
                onChange={(e) => set("nombreAdministracion", e.target.value)}
                placeholder="Administración ABC"
              />
            </div>
            <div>
              <label className="label">Persona de contacto</label>
              <input
                className="field mt-1.5"
                value={d.personaContacto}
                onChange={(e) => set("personaContacto", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Cargo</label>
              <input
                className="field mt-1.5"
                value={d.cargo}
                onChange={(e) => set("cargo", e.target.value)}
                placeholder="Administrador, gerente…"
              />
            </div>
            <div>
              <label className="label">Zona de trabajo</label>
              <input
                className="field mt-1.5"
                value={d.zona}
                onChange={(e) => set("zona", e.target.value)}
                placeholder="Chamberí, Centro…"
              />
            </div>
            <div>
              <label className="label">Nº aprox. de comunidades</label>
              <input
                className="field mt-1.5"
                inputMode="numeric"
                value={d.numComunidades}
                onChange={(e) => set("numComunidades", e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Web</label>
              <input
                className="field mt-1.5"
                value={d.web}
                onChange={(e) => set("web", e.target.value)}
                placeholder="www.administracionabc.es"
              />
            </div>
          </div>
        )}

        {/* Nombre / apellidos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{esAdmin ? "Nombre (o contacto)" : "Nombre"}</label>
            <input
              className="field mt-1.5"
              value={d.nombre}
              onChange={(e) => set("nombre", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Apellidos</label>
            <input
              className="field mt-1.5"
              value={d.apellidos}
              onChange={(e) => set("apellidos", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">CIF / NIF</label>
          <input
            className="field mt-1.5 uppercase"
            placeholder="B12345678 / 12345678Z"
            value={d.cif}
            onChange={(e) => set("cif", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Teléfono</label>
            <input
              className="field mt-1.5"
              value={d.telefono}
              onChange={(e) => set("telefono", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="field mt-1.5"
              value={d.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Dirección (calle y número)</label>
          <input
            className="field mt-1.5"
            value={d.direccion}
            onChange={(e) => set("direccion", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Código postal</label>
            <input
              className="field mt-1.5"
              inputMode="numeric"
              placeholder="28001"
              value={d.cp}
              onChange={(e) => set("cp", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input
              className="field mt-1.5"
              value={d.ciudad}
              onChange={(e) => set("ciudad", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Población</label>
            <input
              className="field mt-1.5"
              value={d.poblacion}
              onChange={(e) => set("poblacion", e.target.value)}
            />
          </div>
        </div>

        {/* Estado comercial + seguimiento (contactos comerciales) */}
        {esComercial && (
          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Estado y seguimiento comercial
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Estado comercial</label>
                <select
                  className="field mt-1.5"
                  value={d.estadoComercial}
                  onChange={(e) => set("estadoComercial", e.target.value as EstadoComercial | "")}
                >
                  <option value="">— Sin estado —</option>
                  {ESTADOS_COMERCIAL.map((e) => (
                    <option key={e.valor} value={e.valor}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-end gap-2 pb-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={d.dossierEnviado}
                  onChange={(e) => set("dossierEnviado", e.target.checked)}
                />
                Dossier Forgevia enviado
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fecha primer contacto</label>
                <input
                  type="date"
                  className="field mt-1.5"
                  value={d.fechaPrimerContacto}
                  onChange={(e) => set("fechaPrimerContacto", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Fecha último contacto</label>
                <input
                  type="date"
                  className="field mt-1.5"
                  value={d.fechaUltimoContacto}
                  onChange={(e) => set("fechaUltimoContacto", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="label">Próxima acción</label>
                <input
                  className="field mt-1.5"
                  value={d.proximaAccion}
                  onChange={(e) => set("proximaAccion", e.target.value)}
                  placeholder="Llamar para concertar visita…"
                />
              </div>
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  className="field mt-1.5"
                  value={d.fechaProximaAccion}
                  onChange={(e) => set("fechaProximaAccion", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Captación */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">¿Cómo llegó?</label>
            <select
              className="field mt-1.5"
              value={d.canal}
              onChange={(e) => set("canal", e.target.value as CanalCaptacion)}
            >
              {CANALES.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Detalle de captación</label>
            <input
              className="field mt-1.5"
              placeholder="Qué red, quién lo refirió…"
              value={d.canalDetalle}
              onChange={(e) => set("canalDetalle", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Observaciones</label>
          <textarea
            className="field mt-1.5"
            rows={2}
            value={d.notas}
            onChange={(e) => set("notas", e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex-1">
            {guardando ? <Spinner className="h-5 w-5" /> : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
