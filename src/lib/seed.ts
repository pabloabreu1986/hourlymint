// ─────────────────────────────────────────────────────────────
// Datos semilla (MOCK) calcados del mockup del cliente.
// Se generan relativos a "hoy" para que los fichajes y partes
// del día tengan sentido cada vez que se abre la app.
// ─────────────────────────────────────────────────────────────
import type { DBSchema } from "./types";
import { FORGEVIA_TENANT } from "./tenant-default";
import { FUNCIONES_DISPONIBLES } from "./funciones";

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

/** YYYY-MM-DD a `n` días de hoy (negativo = pasado). */
function diasDesdeHoy(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function seedDB(): DBSchema {
  const hoy = hoyISO();

  // ── Tenants (clientes white-label) ──
  // FORGEVIA arranca con todas las funciones activas.
  const forgevia = {
    ...FORGEVIA_TENANT,
    funciones: FUNCIONES_DISPONIBLES.map((f) => f.clave),
  };
  const tenants = [forgevia];

  // ── Usuarios ──
  // Super-admin de la plataforma (solo Pablo). No pertenece a ningún
  // cliente; gestiona los tenants desde su panel.
  const superadmin = {
    id: "u_super",
    nombre: "pablo",
    password: "890p",
    rol: "superadmin" as const,
    puesto: "Operador de plataforma",
    telefono: "",
    activo: true,
    color: PAL[0],
  };

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

  const usuarios = [superadmin, admin, ...trabajadores];

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

  // ── Módulos RRHH ──
  const ausencias = [
    {
      id: "au_1",
      trabajadorId: "u_juan",
      tipo: "vacaciones" as const,
      fechaInicio: diasDesdeHoy(14),
      fechaFin: diasDesdeHoy(18),
      motivo: "Vacaciones de verano",
      estado: "pendiente" as const,
      respuesta: null,
      creadaEn: hoyA("08:30"),
    },
    {
      id: "au_2",
      trabajadorId: "u_pedro",
      tipo: "permiso" as const,
      fechaInicio: diasDesdeHoy(3),
      fechaFin: diasDesdeHoy(3),
      motivo: "Cita médica",
      estado: "aprobada" as const,
      respuesta: "Aprobado, avisa al encargado.",
      creadaEn: hoyA("07:50"),
    },
    {
      id: "au_3",
      trabajadorId: "u_david",
      tipo: "baja_medica" as const,
      fechaInicio: diasDesdeHoy(-2),
      fechaFin: diasDesdeHoy(5),
      motivo: "Lumbalgia — parte médico entregado",
      estado: "aprobada" as const,
      respuesta: "Recupérate. Adjunta el alta cuando la tengas.",
      creadaEn: diasDesdeHoy(-2) + "T08:00:00.000Z",
    },
  ];

  // Turnos de esta semana para el equipo de Vallecas y Parla.
  const turnos = [
    ...["u_juan", "u_carlos", "u_antonio", "u_javier"].flatMap((t, i) =>
      [0, 1, 2].map((d) => ({
        id: `t_${t}_${d}`,
        trabajadorId: t,
        fecha: diasDesdeHoy(d),
        obraId: "o_vallecas",
        horaInicio: "09:00",
        horaFin: "18:00",
        nota: i === 0 && d === 2 ? "Recoger material en almacén antes de subir" : "",
      }))
    ),
    ...["u_luis", "u_david"].flatMap((t) =>
      [0, 1].map((d) => ({
        id: `t_${t}_${d}`,
        trabajadorId: t,
        fecha: diasDesdeHoy(d),
        obraId: "o_parla",
        horaInicio: "08:00",
        horaFin: "17:00",
        nota: "",
      }))
    ),
  ];

  const gastos = [
    {
      id: "g_1",
      trabajadorId: "u_luis",
      obraId: "o_parla",
      concepto: "Comida equipo (2 personas)",
      categoria: "dietas" as const,
      importe: 24.6,
      fecha: diasDesdeHoy(-1),
      justificante: null,
      estado: "pendiente" as const,
      creadoEn: hoyA("09:40"),
    },
    {
      id: "g_2",
      trabajadorId: "u_pedro",
      obraId: "o_climatizacion",
      concepto: "Parking centro",
      categoria: "transporte" as const,
      importe: 8.5,
      fecha: diasDesdeHoy(-3),
      justificante: null,
      estado: "aprobado" as const,
      creadoEn: diasDesdeHoy(-3) + "T14:10:00.000Z",
    },
    {
      id: "g_3",
      trabajadorId: "u_antonio",
      obraId: "o_vallecas",
      concepto: "Brocas SDS y discos de corte",
      categoria: "material" as const,
      importe: 37.9,
      fecha: diasDesdeHoy(-6),
      justificante: null,
      estado: "pagado" as const,
      creadoEn: diasDesdeHoy(-6) + "T11:00:00.000Z",
    },
  ];

  const documentos = [
    {
      id: "d_1",
      usuarioId: null,
      nombre: "Plan de prevención de riesgos 2026",
      categoria: "otro" as const,
      path:
        "data:text/plain;base64," +
        btoa("Documento de ejemplo: plan de prevencion de riesgos laborales."),
      mime: "text/plain",
      subidoPor: "u_admin",
      createdAt: diasDesdeHoy(-20) + "T09:00:00.000Z",
    },
    {
      id: "d_2",
      usuarioId: "u_juan",
      nombre: "Nómina junio 2026",
      categoria: "nomina" as const,
      path: "data:text/plain;base64," + btoa("Nomina de ejemplo (mock)."),
      mime: "text/plain",
      subidoPor: "u_admin",
      createdAt: diasDesdeHoy(-15) + "T09:00:00.000Z",
    },
  ];

  const evaluaciones = [
    {
      id: "e_1",
      trabajadorId: "u_juan",
      evaluadorId: "u_admin",
      periodo: "2º trimestre 2026",
      puntuaciones: { puntualidad: 5, calidad: 4, seguridad: 4, equipo: 5 },
      comentario: "Muy buen trimestre. Referente del equipo en Vallecas.",
      createdAt: diasDesdeHoy(-10) + "T10:00:00.000Z",
    },
    {
      id: "e_2",
      trabajadorId: "u_carlos",
      evaluadorId: "u_admin",
      periodo: "2º trimestre 2026",
      puntuaciones: { puntualidad: 3, calidad: 3, seguridad: 4, equipo: 4 },
      comentario: "Progresa bien; reforzar puntualidad en la entrada.",
      createdAt: diasDesdeHoy(-10) + "T10:30:00.000Z",
    },
  ];

  const metas = [
    {
      id: "me_1",
      trabajadorId: null,
      titulo: "Cerrar Reforma Local Vallecas en plazo",
      descripcion: "Entrega prevista a fin de mes con repaso de calidades incluido.",
      progreso: 70,
      fechaObjetivo: diasDesdeHoy(30),
      createdAt: diasDesdeHoy(-30) + "T09:00:00.000Z",
    },
    {
      id: "me_2",
      trabajadorId: "u_pedro",
      titulo: "Certificación de instalador de aerotermia",
      descripcion: "Completar el curso y el examen antes de que acabe el trimestre.",
      progreso: 40,
      fechaObjetivo: diasDesdeHoy(60),
      createdAt: diasDesdeHoy(-20) + "T09:00:00.000Z",
    },
  ];

  const onboardings = [
    {
      id: "ob_1",
      usuarioId: "u_javier",
      tipo: "alta" as const,
      tareas: [
        { id: "ot_1", texto: "Contrato firmado", hecha: true },
        { id: "ot_2", texto: "Alta en Seguridad Social", hecha: true },
        { id: "ot_3", texto: "EPIs entregados (casco, botas, guantes)", hecha: true },
        { id: "ot_4", texto: "Formación PRL básica (20h)", hecha: false },
        { id: "ot_5", texto: "Acceso a la app y primer fichaje", hecha: true },
      ],
      createdAt: diasDesdeHoy(-12) + "T09:00:00.000Z",
    },
  ];

  const comunicados = [
    {
      id: "c_1",
      titulo: "Calendario de agosto",
      cuerpo:
        "La semana del 15 de agosto la empresa permanecerá cerrada por vacaciones. Las obras con entrega comprometida mantendrán retén — se avisará a los afectados.",
      autorId: "u_admin",
      fecha: hoyA("08:00"),
      fijado: true,
    },
    {
      id: "c_2",
      titulo: "Nueva política de gastos",
      cuerpo:
        "A partir de este mes, todos los gastos se presentan desde la app con foto del ticket. Los aprobados se abonan con la nómina siguiente.",
      autorId: "u_admin",
      fecha: diasDesdeHoy(-4) + "T12:00:00.000Z",
      fijado: false,
    },
  ];

  const denuncias = [
    {
      id: "dn_1",
      categoria: "seguridad" as const,
      descripcion:
        "En la obra de Parla se está trabajando en el andamio sin línea de vida. Lo he comentado y no se ha corregido.",
      anonima: true,
      trabajadorId: null,
      estado: "en_revision" as const,
      fecha: diasDesdeHoy(-2) + "T16:20:00.000Z",
    },
  ];

  // Datos mock de un único cliente (FORGEVIA). Estampamos su tenant para
  // que respeten el aislamiento igual que en producción; el super-admin va
  // a `_platform` (no pertenece a ningún cliente).
  const T = "forgevia";
  return {
    tenants,
    usuarios: usuarios.map((u) => ({
      ...u,
      tenantId: u.rol === "superadmin" ? "_platform" : T,
    })),
    obras: obras.map((o) => ({ ...o, tenantId: T })),
    fichajes: fichajes.map((f) => ({ ...f, tenantId: T })),
    partes: partes.map((p) => ({ ...p, tenantId: T })),
    fotos: [],
    adjuntos: [],
    incidencias: incidencias.map((i) => ({ ...i, tenantId: T })),
    notificaciones: notificaciones.map((n) => ({ ...n, tenantId: T })),
    vehiculos: vehiculos.map((v) => ({ ...v, tenantId: T })),
    herramientas: herramientas.map((h) => ({ ...h, tenantId: T })),
    almacen: almacen.map((a) => ({ ...a, tenantId: T })),
    ausencias: ausencias.map((a) => ({ ...a, tenantId: T })),
    turnos: turnos.map((t) => ({ ...t, tenantId: T })),
    gastos: gastos.map((g) => ({ ...g, tenantId: T })),
    documentos: documentos.map((d) => ({ ...d, tenantId: T })),
    evaluaciones: evaluaciones.map((e) => ({ ...e, tenantId: T })),
    metas: metas.map((m) => ({ ...m, tenantId: T })),
    onboardings: onboardings.map((o) => ({ ...o, tenantId: T })),
    comunicados: comunicados.map((c) => ({ ...c, tenantId: T })),
    denuncias: denuncias.map((d) => ({ ...d, tenantId: T })),
  };
}
