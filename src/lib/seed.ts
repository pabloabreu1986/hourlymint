// ─────────────────────────────────────────────────────────────
// Datos semilla (MOCK) calcados del mockup del cliente.
// Se generan relativos a "hoy" para que los fichajes y partes
// del día tengan sentido cada vez que se abre la app.
// ─────────────────────────────────────────────────────────────
import type { DBSchema } from "./types";

const PAL = [
  "#BE6B39",
  "#2E6F8E",
  "#5B7A4B",
  "#8E4B6F",
  "#3B4756",
  "#B08423",
  "#4B5F8E",
  "#8E5B3B",
  "#2E8E7A",
];

/** Fecha de hoy en formato YYYY-MM-DD (hora local). */
export function hoyISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** ISO timestamp de hoy a una hora HH:MM local. */
function hoyA(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function seedDB(): DBSchema {
  const hoy = hoyISO();

  // ── Usuarios ──
  const admin = {
    id: "u_admin",
    nombre: "Antonio Manzanares",
    password: "admin1234",
    rol: "admin" as const,
    puesto: "Administrador",
    telefono: "600 000 000",
    activo: true,
    color: PAL[4],
  };

  const trabajadores = [
    { id: "u_juan", nombre: "Juan Pérez", puesto: "Oficial 1ª" },
    { id: "u_pedro", nombre: "Pedro García", puesto: "Instalador" },
    { id: "u_luis", nombre: "Luis Martínez", puesto: "Oficial 1ª" },
    { id: "u_carlos", nombre: "Carlos López", puesto: "Peón" },
    { id: "u_manuel", nombre: "Manuel Ruiz", puesto: "Oficial 2ª" },
    { id: "u_antonio", nombre: "Antonio Sánchez", puesto: "Encargado" },
    { id: "u_david", nombre: "David Fernández", puesto: "Peón" },
    { id: "u_javier", nombre: "Javier Morales", puesto: "Instalador" },
  ].map((t, i) => ({
    ...t,
    password: "1234",
    rol: "trabajador" as const,
    telefono: `6${(11111111 + i * 1010101).toString().slice(0, 8)}`,
    activo: true,
    color: PAL[i % PAL.length],
  }));

  const usuarios = [admin, ...trabajadores];

  // ── Obras ──
  const obras = [
    {
      id: "o_vallecas",
      nombre: "Reforma Local Vallecas",
      direccion: "C/ Sierra de Guadarrama, 20",
      estado: "en_curso" as const,
      avance: 70,
      encargadoId: "u_antonio",
      trabajadorIds: ["u_juan", "u_antonio", "u_carlos", "u_javier"],
      color: PAL[0],
      createdAt: hoy,
      diasLaborables: [1, 2, 3, 4, 5],
      horaEntrada: "09:00",
      horaSalida: "18:00",
      margenSalidaAutomaticaMin: 5,
    },
    {
      id: "o_parla",
      nombre: "Reforma Vivienda Parla",
      direccion: "C/ Real, 45",
      estado: "en_curso" as const,
      avance: 45,
      encargadoId: "u_luis",
      trabajadorIds: ["u_luis", "u_david"],
      color: PAL[1],
      createdAt: hoy,
      diasLaborables: [1, 2, 3, 4, 5],
      horaEntrada: "09:00",
      horaSalida: "18:00",
      margenSalidaAutomaticaMin: 5,
    },
    {
      id: "o_climatizacion",
      nombre: "Instalación Climatización",
      direccion: "C/ Orense, 12 · Madrid",
      estado: "pendiente" as const,
      avance: 30,
      encargadoId: "u_pedro",
      trabajadorIds: ["u_pedro", "u_javier"],
      color: PAL[2],
      createdAt: hoy,
      diasLaborables: [1, 2, 3, 4, 5],
      horaEntrada: "09:00",
      horaSalida: "18:00",
      margenSalidaAutomaticaMin: 5,
    },
    {
      id: "o_oficina",
      nombre: "Reforma Oficina Orense",
      direccion: "C/ Orense, 34 · Madrid",
      estado: "pendiente" as const,
      avance: 0,
      encargadoId: "u_manuel",
      trabajadorIds: ["u_manuel"],
      color: PAL[3],
      createdAt: hoy,
      diasLaborables: [1, 2, 3, 4, 5],
      horaEntrada: "09:00",
      horaSalida: "18:00",
      margenSalidaAutomaticaMin: 5,
    },
  ];

  // ── Fichajes de hoy (6 fichados, 2 sin fichar) ──
  const madridCentro = { lat: 40.4168, lng: -3.7038 };
  const jitter = (base: number) => base + (Math.random() - 0.5) * 0.06;
  const gps = () => ({ lat: jitter(madridCentro.lat), lng: jitter(madridCentro.lng) });

  const entradas: Array<[string, string, string]> = [
    ["u_juan", "08:03", "o_vallecas"],
    ["u_pedro", "08:07", "o_climatizacion"],
    ["u_luis", "08:02", "o_parla"],
    ["u_carlos", "08:05", "o_vallecas"],
    ["u_antonio", "08:04", "o_vallecas"],
    ["u_javier", "08:06", "o_vallecas"],
  ];

  const fichajes = entradas.map(([trabajadorId, hora, obraId], i) => ({
    id: `f_${trabajadorId}_e`,
    trabajadorId,
    obraId,
    tipo: "entrada" as const,
    timestamp: hoyA(hora),
    gps: gps(),
    estado: (i === 1 ? "tarde" : "correcto") as "correcto" | "tarde",
    creadoEn: hoyA(hora),
    corrigeA: null,
  }));

  // ── Incidencias ──
  const incidencias = [
    {
      id: "i_1",
      obraId: "o_vallecas",
      titulo: "Falta material",
      descripcion: "Faltan sacos de yeso para terminar el trasdosado del pasillo.",
      fecha: hoyA("09:15"),
      estado: "nueva" as const,
      trabajadorId: "u_antonio",
    },
    {
      id: "i_2",
      obraId: "o_parla",
      titulo: "Retraso en entrega",
      descripcion: "El proveedor retrasa la entrega de la carpintería hasta el jueves.",
      fecha: hoyA("10:20"),
      estado: "nueva" as const,
      trabajadorId: "u_luis",
    },
  ];

  // ── Parte diario de Vallecas (borrador del día) ──
  const partes = [
    {
      id: "p_vallecas_hoy",
      obraId: "o_vallecas",
      fecha: hoy,
      encargadoId: "u_antonio",
      trabajoRealizado:
        "Se ha terminado todo el techo de pladur del comedor y se ha empezado el trasdosado de la cocina. Instaladas cajas eléctricas del pasillo.",
      materialesPendientes: [
        { id: "m_1", nombre: "Placas de Pladur 13mm", cantidad: 24, unidad: "uds" },
        { id: "m_2", nombre: "Tornillos Pladur", cantidad: 25, unidad: "uds" },
        { id: "m_3", nombre: "Sacos de yeso", cantidad: 3, unidad: "uds" },
      ],
      observaciones: "Pendiente confirmación de cliente sobre cambio de color del suelo.",
      incidencias: "Ninguna",
      avance: 70,
      firma: null,
      estado: "borrador" as const,
      createdAt: hoyA("13:00"),
      closedAt: null,
    },
  ];

  // ── Notificaciones ──
  const notificaciones = [
    {
      id: "n_1",
      trabajadorId: "u_manuel",
      tipo: "fichaje" as const,
      titulo: "No has fichado la entrada",
      mensaje: "Recuerda fichar tu entrada en Reforma Oficina Orense.",
      fecha: hoyA("09:30"),
      leida: false,
    },
    {
      id: "n_2",
      trabajadorId: "u_david",
      tipo: "fichaje" as const,
      titulo: "No has fichado la entrada",
      mensaje: "Recuerda fichar tu entrada en Reforma Vivienda Parla.",
      fecha: hoyA("09:30"),
      leida: false,
    },
    {
      id: "n_3",
      trabajadorId: null,
      tipo: "aviso" as const,
      titulo: "Reunión de coordinación",
      mensaje: "Mañana a las 07:45 en el almacén antes de salir a obra.",
      fecha: hoyA("14:00"),
      leida: false,
    },
  ];

  // ── Entidades de apoyo ──
  const vehiculos = [
    { id: "v_1", matricula: "1234 KBM", modelo: "Renault Kangoo", asignadoA: "u_luis", estado: "en_uso" as const },
    { id: "v_2", matricula: "5678 LHN", modelo: "Ford Transit", asignadoA: "u_pedro", estado: "en_uso" as const },
    { id: "v_3", matricula: "9012 MJP", modelo: "Citroën Jumpy", asignadoA: null, estado: "disponible" as const },
    { id: "v_4", matricula: "3456 NKR", modelo: "Iveco Daily", asignadoA: null, estado: "taller" as const },
  ];

  const herramientas = [
    { id: "h_1", nombre: "Radial Bosch GWS", cantidad: 3, ubicacion: "o_vallecas" },
    { id: "h_2", nombre: "Taladro percutor Makita", cantidad: 5, ubicacion: "almacen" },
    { id: "h_3", nombre: "Andamio modular", cantidad: 2, ubicacion: "o_parla" },
    { id: "h_4", nombre: "Nivel láser", cantidad: 4, ubicacion: "almacen" },
  ];

  const almacen = [
    { id: "a_1", nombre: "Placas de Pladur 13mm", stock: 40, unidad: "uds", minimo: 30 },
    { id: "a_2", nombre: "Tornillos Pladur", stock: 12, unidad: "cajas", minimo: 20 },
    { id: "a_3", nombre: "Sacos de yeso", stock: 8, unidad: "uds", minimo: 15 },
    { id: "a_4", nombre: "Perfilería 48mm", stock: 120, unidad: "ml", minimo: 60 },
  ];

  return {
    usuarios,
    obras,
    fichajes,
    partes,
    fotos: [],
    adjuntos: [],
    incidencias,
    notificaciones,
    vehiculos,
    herramientas,
    almacen,
  };
}
