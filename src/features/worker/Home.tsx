import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fichajesApi, obrasApi } from "@/services";
import type { Fichaje, Obra, TipoFichaje } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Modal, Spinner, Avatar } from "@/components/ui";
import { WorkerMap } from "@/components/WorkerMap";
import { fechaLarga, hora, saludo } from "@/lib/format";
import { hoyISO } from "@/lib/seed";
import { coordText } from "@/lib/geo";
import {
  IconEntrada,
  IconSalida,
  IconCamera,
  IconClipboard,
  IconCheck,
  IconMapPin,
} from "@/components/icons";

export default function Home() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<{ entrada: Fichaje | null; salida: Fichaje | null }>({
    entrada: null,
    salida: null,
  });
  const [obras, setObras] = useState<Obra[]>([]);
  const [fichando, setFichando] = useState<TipoFichaje | null>(null);
  const [confirmacion, setConfirmacion] = useState<Fichaje | null>(null);

  useEffect(() => {
    if (!usuario) return;
    fichajesApi.estadoFichaje(usuario.id).then(setEstado);
    obrasApi.listObrasDeTrabajador(usuario.id).then(setObras);
  }, [usuario]);

  if (!usuario) return null;

  async function fichar(tipo: TipoFichaje) {
    if (!usuario) return;
    setFichando(tipo);
    try {
      // Obra por defecto: la primera asignada hoy.
      const obraId = obras[0]?.id ?? null;
      const f = await fichajesApi.fichar(usuario.id, tipo, obraId);
      const nuevo = await fichajesApi.estadoFichaje(usuario.id);
      setEstado(nuevo);
      setConfirmacion(f);
    } finally {
      setFichando(null);
    }
  }

  const yaEntrada = !!estado.entrada;
  const yaSalida = !!estado.salida;

  const acciones = [
    {
      key: "entrada",
      label: "ENTRADA",
      sub: yaEntrada ? `Fichada · ${hora(estado.entrada!.timestamp)}` : "Fichar entrada",
      icon: IconEntrada,
      color: "#16A34A",
      bg: "bg-green-50",
      onClick: () => fichar("entrada"),
      disabled: yaEntrada,
    },
    {
      key: "salida",
      label: "SALIDA",
      sub: yaSalida
        ? `Fichada · ${hora(estado.salida!.timestamp)}`
        : yaEntrada
          ? "Fichar salida"
          : "Ficha primero la entrada",
      icon: IconSalida,
      color: "#DC2626",
      bg: "bg-red-50",
      onClick: () => fichar("salida"),
      disabled: !yaEntrada || yaSalida,
    },
    {
      key: "fotos",
      label: "FOTOGRAFÍAS",
      sub: "Ver y subir fotos",
      icon: IconCamera,
      color: "#2E6F8E",
      bg: "bg-sky-50",
      onClick: () => navigate("/fotos"),
      disabled: false,
    },
    {
      key: "obras",
      label: "MIS OBRAS",
      sub: `${obras.length} asignada${obras.length === 1 ? "" : "s"}`,
      icon: IconClipboard,
      color: "#BE6B39",
      bg: "bg-orange-50",
      onClick: () => navigate("/obras"),
      disabled: false,
    },
  ];

  return (
    <div>
      {/* Header */}
      <header className="rounded-b-3xl bg-white px-5 pb-6 pt-8 shadow-card">
        <div className="flex items-center justify-between">
          <Logo />
          <Avatar nombre={usuario.nombre} color={usuario.color} size={40} />
        </div>
        <div className="mt-6">
          <h1 className="text-2xl font-extrabold text-forge-dark">
            Hola, {usuario.nombre.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-400">
            {saludo()} · {fechaLarga(hoyISO())}
          </p>
        </div>
      </header>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-4 p-5">
        {acciones.map((a) => (
          <button
            key={a.key}
            onClick={a.onClick}
            disabled={a.disabled || fichando !== null}
            className="card flex flex-col items-center gap-2 p-5 text-center transition active:scale-[.98] disabled:opacity-60"
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-full ${a.bg}`}
              style={{ color: a.color }}
            >
              {fichando === a.key ? (
                <Spinner className="h-6 w-6" />
              ) : (
                <a.icon className="h-7 w-7" />
              )}
            </span>
            <span className="text-sm font-bold text-forge-dark">{a.label}</span>
            <span className="text-xs text-slate-400">{a.sub}</span>
          </button>
        ))}
      </div>

      {/* Resumen del día */}
      <div className="px-5">
        <div className="card flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-forge-dark/5 text-forge-dark">
            <IconMapPin className="h-5 w-5" />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-forge-dark">
              {yaEntrada ? "Jornada en curso" : "Aún no has fichado"}
            </p>
            <p className="text-slate-400">
              {yaEntrada
                ? `Entrada a las ${hora(estado.entrada!.timestamp)}${
                    yaSalida ? ` · Salida ${hora(estado.salida!.timestamp)}` : ""
                  }`
                : "Ficha tu entrada al llegar a la obra"}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmación de fichaje */}
      <Modal
        open={!!confirmacion}
        onClose={() => setConfirmacion(null)}
        title="Fichaje registrado"
      >
        {confirmacion && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-green-100 text-green-600">
                <IconCheck className="h-7 w-7" />
              </span>
              <div>
                <p className="text-lg font-bold text-forge-dark">
                  {confirmacion.tipo === "entrada" ? "Entrada" : "Salida"} ·{" "}
                  {hora(confirmacion.timestamp)}
                </p>
                <p className="text-sm text-slate-400">
                  Ubicación: {coordText(confirmacion.gps)}
                </p>
              </div>
            </div>
            {confirmacion.gps && (
              <WorkerMap
                height={170}
                pins={[
                  {
                    id: confirmacion.id,
                    coord: confirmacion.gps,
                    color: "#BE6B39",
                    label: "Tu ubicación",
                  },
                ]}
              />
            )}
            <button onClick={() => setConfirmacion(null)} className="btn-primary w-full">
              Hecho
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
