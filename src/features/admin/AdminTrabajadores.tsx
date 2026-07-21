import { useEffect, useState } from "react";
import { usuariosApi, dashboardApi } from "@/services";
import type { Rol, Usuario, Fichaje } from "@/lib/types";
import {
  calcularJornada,
  formatDuracion,
  segundosDeEstadoActual,
  ESTILO_ESTADO_JORNADA,
  type Jornada,
  type ColorBadgeEstado,
} from "@/lib/horas";
import { sb, isSupabaseEnabled } from "@/lib/supabase";
import { Avatar, Badge, Cargando, Modal, Spinner } from "@/components/ui";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
} from "@/components/icons";

type Draft = {
  nombre: string;
  password: string;
  puesto: string;
  telefono: string;
  rol: Rol;
  activo: boolean;
};

const vacio: Draft = {
  nombre: "",
  password: "1234",
  puesto: "",
  telefono: "",
  rol: "trabajador",
  activo: true,
};

export default function AdminTrabajadores() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [editar, setEditar] = useState<Usuario | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [borrar, setBorrar] = useState<Usuario | null>(null);
  const [verPass, setVerPass] = useState<Record<string, boolean>>({});
  const [fichajesPorTrabajador, setFichajesPorTrabajador] = useState<Record<string, Fichaje[]>>({});
  const [ahora, setAhora] = useState(() => new Date());

  async function cargar() {
    setUsuarios(await usuariosApi.listUsuarios());
  }
  async function cargarFichajes() {
    const data = await dashboardApi.getDashboard();
    const mapa: Record<string, Fichaje[]> = {};
    data.tiempoReal.forEach((t) => {
      mapa[t.trabajador.id] = t.fichajesHoy;
    });
    setFichajesPorTrabajador(mapa);
  }
  useEffect(() => {
    cargar();
    cargarFichajes();
  }, []);

  // Cronómetros en vivo: recalculan cada segundo.
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // El estado se propaga por Realtime, no por polling.
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    const canal = sb()
      .channel("trabajadores-fichajes")
      .on("postgres_changes", { event: "*", schema: "public", table: "fichajes" }, cargarFichajes)
      .subscribe();
    return () => {
      sb().removeChannel(canal);
    };
  }, []);

  if (!usuarios) return <Cargando />;

  const filas = usuarios.map((u) => {
    const jornada =
      u.rol === "trabajador" ? calcularJornada(fichajesPorTrabajador[u.id] ?? [], ahora) : null;
    const info = jornada ? ESTILO_ESTADO_JORNADA[jornada.estado] : null;
    const conCronometro =
      !!jornada && ["trabajando", "descansando", "en_extra"].includes(jornada.estado);
    return { u, jornada, info, conCronometro };
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {usuarios.filter((u) => u.rol === "trabajador").length} trabajadores · alta y baja manual
        </p>
        <button onClick={() => setNuevo(true)} className="btn-primary px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      {/* Móvil: tarjetas */}
      <div className="space-y-3 md:hidden">
        {filas.map(({ u, jornada, info, conCronometro }) => (
          <TrabajadorCard
            key={u.id}
            u={u}
            jornada={jornada}
            info={info}
            conCronometro={conCronometro}
            verPass={!!verPass[u.id]}
            onTogglePass={() => setVerPass((v) => ({ ...v, [u.id]: !v[u.id] }))}
            onEditar={() => setEditar(u)}
            onBorrar={() => setBorrar(u)}
          />
        ))}
      </div>

      {/* Escritorio: tabla */}
      <div className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Ahora mismo</th>
                <th className="px-4 py-3 font-semibold">Tiempo hoy</th>
                <th className="px-4 py-3 font-semibold">Puesto</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Contraseña</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map(({ u, jornada, info, conCronometro }) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={u.nombre} color={u.color} size={34} />
                      <span className="font-semibold text-forge-dark">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {info ? <Badge color={info.badge}>{info.label}</Badge> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {conCronometro && jornada ? (
                      <span className="font-mono font-semibold text-forge-dark">
                        {formatDuracion(segundosDeEstadoActual(jornada))}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.puesto ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{u.telefono ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {verPass[u.id] ? u.password : "••••••"}
                      </code>
                      <button
                        onClick={() => setVerPass((v) => ({ ...v, [u.id]: !v[u.id] }))}
                        className="text-slate-400 hover:text-forge-dark"
                      >
                        {verPass[u.id] ? (
                          <IconEyeOff className="h-4 w-4" />
                        ) : (
                          <IconEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={u.rol === "admin" ? "blue" : "slate"}>
                      {u.rol === "admin" ? "Admin" : "Trabajador"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={u.activo ? "green" : "red"}>
                      {u.activo ? "Activo" : "Baja"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditar(u)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setBorrar(u)}
                        disabled={u.rol === "admin"}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(nuevo || editar) && (
        <UsuarioForm
          usuario={editar}
          onClose={() => {
            setNuevo(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNuevo(false);
            setEditar(null);
            cargar();
          }}
        />
      )}

      <Modal open={!!borrar} onClose={() => setBorrar(null)} title="Dar de baja">
        {borrar && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ¿Seguro que quieres eliminar a <b>{borrar.nombre}</b>? Se desasignará de todas las
              obras. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBorrar(null)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await usuariosApi.eliminarUsuario(borrar.id);
                  setBorrar(null);
                  cargar();
                }}
                className="btn flex-1 bg-red-500 px-5 py-3 text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/** Tarjeta de un trabajador para pantallas pequeñas: mismo contenido que
 * la fila de la tabla de escritorio, en formato apilado. */
function TrabajadorCard({
  u,
  jornada,
  info,
  conCronometro,
  verPass,
  onTogglePass,
  onEditar,
  onBorrar,
}: {
  u: Usuario;
  jornada: Jornada | null;
  info: { label: string; badge: ColorBadgeEstado } | null;
  conCronometro: boolean;
  verPass: boolean;
  onTogglePass: () => void;
  onEditar: () => void;
  onBorrar: () => void;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <Avatar nombre={u.nombre} color={u.color} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-forge-dark">{u.nombre}</p>
          <p className="truncate text-xs text-slate-400">{u.puesto ?? "—"}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEditar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-forge-dark"
          >
            <IconEdit className="h-4 w-4" />
          </button>
          <button
            onClick={onBorrar}
            disabled={u.rol === "admin"}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
        {info ? <Badge color={info.badge}>{info.label}</Badge> : <span className="text-xs text-slate-400">—</span>}
        {conCronometro && jornada ? (
          <span className="font-mono text-sm font-semibold text-forge-dark">
            {formatDuracion(segundosDeEstadoActual(jornada))}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Sin fichar hoy</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
        <div>
          <p className="text-slate-400">Teléfono</p>
          <p className="font-medium text-forge-dark">{u.telefono ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-400">Rol</p>
          <Badge color={u.rol === "admin" ? "blue" : "slate"}>
            {u.rol === "admin" ? "Admin" : "Trabajador"}
          </Badge>
        </div>
        <div>
          <p className="text-slate-400">Contraseña</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <code className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
              {verPass ? u.password : "••••••"}
            </code>
            <button onClick={onTogglePass} className="text-slate-400 hover:text-forge-dark">
              {verPass ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div>
          <p className="text-slate-400">Estado</p>
          <Badge color={u.activo ? "green" : "red"}>{u.activo ? "Activo" : "Baja"}</Badge>
        </div>
      </div>
    </div>
  );
}

function UsuarioForm({
  usuario,
  onClose,
  onSaved,
}: {
  usuario: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(
    usuario
      ? {
          nombre: usuario.nombre,
          password: usuario.password,
          puesto: usuario.puesto ?? "",
          telefono: usuario.telefono ?? "",
          rol: usuario.rol,
          activo: usuario.activo,
        }
      : vacio
  );
  const [guardando, setGuardando] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!d.nombre.trim()) return setError("El nombre de usuario es obligatorio.");
    if (!d.password.trim()) return setError("La contraseña es obligatoria.");
    setGuardando(true);
    try {
      if (usuario) {
        await usuariosApi.actualizarUsuario(usuario.id, d);
      } else {
        await usuariosApi.crearUsuario(d);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={usuario ? "Editar usuario" : "Nuevo usuario"}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre de usuario</label>
          <input
            className="field mt-1.5"
            placeholder="p.ej. Juan Pérez"
            value={d.nombre}
            onChange={(e) => setD({ ...d, nombre: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-400">Es el nombre con el que inicia sesión.</p>
        </div>
        <div>
          <label className="label">Contraseña</label>
          <div className="relative mt-1.5">
            <input
              className="field pr-11"
              type={verPass ? "text" : "password"}
              value={d.password}
              onChange={(e) => setD({ ...d, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setVerPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {verPass ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Puesto</label>
            <input
              className="field mt-1.5"
              placeholder="Oficial 1ª"
              value={d.puesto}
              onChange={(e) => setD({ ...d, puesto: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="field mt-1.5"
              value={d.telefono}
              onChange={(e) => setD({ ...d, telefono: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Rol</label>
            <select
              className="field mt-1.5"
              value={d.rol}
              onChange={(e) => setD({ ...d, rol: e.target.value as Rol })}
            >
              <option value="trabajador">Trabajador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select
              className="field mt-1.5"
              value={d.activo ? "1" : "0"}
              onChange={(e) => setD({ ...d, activo: e.target.value === "1" })}
            >
              <option value="1">Activo</option>
              <option value="0">Baja</option>
            </select>
          </div>
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
