import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { documentosApi, usuariosApi } from "@/services";
import type { CategoriaDocumento, Documento, Usuario } from "@/lib/types";
import { Badge, Cargando, EmptyState, Modal, Spinner } from "@/components/ui";
import { confirmar } from "@/components/confirm";
import { fechaCompleta } from "@/lib/format";
import { errorDeTamano } from "@/lib/files";
import { IconDownload, IconFolder, IconPlus, IconTrash } from "@/components/icons";

export const ETIQUETA_CATEGORIA_DOC: Record<CategoriaDocumento, string> = {
  nomina: "Nómina",
  contrato: "Contrato",
  certificado: "Certificado",
  otro: "Otro",
};

const COLOR_CATEGORIA: Record<CategoriaDocumento, "blue" | "violet" | "green" | "slate"> = {
  nomina: "blue",
  contrato: "violet",
  certificado: "green",
  otro: "slate",
};

function leerComoDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

/** Descarga un data URL como archivo. */
export function descargarDataURL(dataUrl: string, nombre: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = nombre;
  a.click();
}

export default function AdminDocumentos() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Documento[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState<string>("todos");
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");
  // Formulario de subida
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDocumento>("otro");
  const [destinatario, setDestinatario] = useState<string>(""); // "" = empresa
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    setItems(await documentosApi.listDocumentos());
  }
  useEffect(() => {
    cargar();
    usuariosApi.listUsuarios().then(setUsuarios);
  }, []);

  if (!items) return <Cargando />;

  const trabajadores = usuarios.filter((u) => u.rol === "trabajador");
  const usuarioDe = (id: string | null) =>
    id === null ? "Toda la empresa" : usuarios.find((u) => u.id === id)?.nombre ?? "—";

  const visibles =
    filtroUsuario === "todos"
      ? items
      : items.filter((d) => (filtroUsuario === "empresa" ? d.usuarioId === null : d.usuarioId === filtroUsuario));

  async function subir() {
    if (!archivo || !nombre.trim()) {
      setError("Pon un nombre y elige un archivo.");
      return;
    }
    const errTamano = errorDeTamano(archivo);
    if (errTamano) {
      setError(errTamano);
      return;
    }
    setSubiendo(true);
    setError("");
    try {
      const path = await leerComoDataURL(archivo);
      await documentosApi.subirDocumento({
        usuarioId: destinatario || null,
        nombre: nombre.trim(),
        categoria,
        path,
        mime: archivo.type || "application/octet-stream",
        subidoPor: usuario?.id ?? null,
      });
      setAbierto(false);
      setNombre("");
      setArchivo(null);
      setDestinatario("");
      setCategoria("otro");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el documento");
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminar(d: Documento) {
    if (!(await confirmar({ titulo: "Eliminar documento", mensaje: `Se eliminará "${d.nombre}". Esta acción no se puede deshacer.` }))) return;
    await documentosApi.eliminarDocumento(d.id);
    cargar();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <select
          className="field w-full sm:w-64"
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
        >
          <option value="todos">Todos los documentos</option>
          <option value="empresa">De empresa</option>
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <button onClick={() => setAbierto(true)} className="btn-primary px-4 py-2.5">
          <IconPlus className="h-5 w-5" /> Subir documento
        </button>
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon={<IconFolder className="h-12 w-12" />}
          titulo="Sin documentos"
          texto="Sube nóminas, contratos o documentación de empresa para tu equipo."
        />
      ) : (
        <div className="space-y-3">
          {visibles.map((d) => (
            <div key={d.id} className="card flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forge-orange/10 text-forge-orange">
                <IconFolder className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bold text-forge-dark">{d.nombre}</p>
                  <Badge color={COLOR_CATEGORIA[d.categoria]}>
                    {ETIQUETA_CATEGORIA_DOC[d.categoria].toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {usuarioDe(d.usuarioId)} · {fechaCompleta(d.createdAt)}
                </p>
              </div>
              <button
                onClick={() => descargarDataURL(d.path, d.nombre)}
                className="btn-ghost p-2.5"
                title="Descargar"
              >
                <IconDownload className="h-5 w-5" />
              </button>
              <button
                onClick={() => eliminar(d)}
                className="rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Eliminar"
              >
                <IconTrash className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={abierto} onClose={() => setAbierto(false)} title="Subir documento">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre del documento</label>
            <input
              className="field mt-1.5"
              placeholder="p.ej. Nómina julio 2026"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoría</label>
              <select
                className="field mt-1.5"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
              >
                {Object.entries(ETIQUETA_CATEGORIA_DOC).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Para</label>
              <select
                className="field mt-1.5"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
              >
                <option value="">Toda la empresa</option>
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Archivo</label>
            <input
              ref={inputRef}
              type="file"
              className="field mt-1.5"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button onClick={subir} disabled={subiendo} className="btn-primary w-full py-3">
            {subiendo ? <Spinner className="h-5 w-5" /> : "Subir"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
