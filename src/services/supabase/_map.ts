// Mapeadores fila (snake_case en Postgres) ↔ dominio (camelCase en TS).
// Centralizados para que todos los servicios Supabase mapeen igual.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Usuario,
  Cliente,
  Factura,
  Proveedor,
  Articulo,
  Partida,
  FacturaProveedor,
  Presupuesto,
  PlantillaDisclaimer,
  Obra,
  Fichaje,
  ParteDiario,
  Incidencia,
  Notificacion,
  Vehiculo,
  Herramienta,
  AlmacenItem,
  Foto,
  Adjunto,
  Tenant,
  Ausencia,
  Turno,
  Gasto,
  Documento,
  Evaluacion,
  Meta,
  ProcesoOnboarding,
  Comunicado,
  Denuncia,
} from "@/lib/types";

// ── Tenant (cliente white-label) ──
export const toTenant = (r: any): Tenant => ({
  id: r.id,
  slug: r.slug,
  nombre: r.nombre,
  nombreCorto: r.nombre_corto,
  eslogan: r.eslogan ?? "",
  logotipo: r.logotipo ?? undefined,
  logoUrl: r.logo_url ?? null,
  colores: r.colores,
  funciones: r.funciones ?? [],
  web: r.web ?? [],
  dosier: r.dosier ?? undefined,
});
export const fromTenant = (t: Partial<Tenant>): any => ({
  ...(t.id !== undefined && { id: t.id }),
  ...(t.slug !== undefined && { slug: t.slug }),
  ...(t.nombre !== undefined && { nombre: t.nombre }),
  ...(t.nombreCorto !== undefined && { nombre_corto: t.nombreCorto }),
  ...(t.eslogan !== undefined && { eslogan: t.eslogan }),
  ...(t.logotipo !== undefined && { logotipo: t.logotipo ?? null }),
  ...(t.logoUrl !== undefined && { logo_url: t.logoUrl }),
  ...(t.colores !== undefined && { colores: t.colores }),
  ...(t.funciones !== undefined && { funciones: t.funciones }),
  ...(t.web !== undefined && { web: t.web }),
  ...(t.dosier !== undefined && { dosier: t.dosier ?? null }),
});

// ── Usuario ──
export const toUsuario = (r: any): Usuario => ({
  id: r.id,
  tenantId: r.tenant_id,
  nombre: r.nombre,
  password: r.password,
  rol: r.rol,
  telefono: r.telefono ?? undefined,
  puesto: r.puesto ?? undefined,
  activo: r.activo,
  color: r.color,
  diasVacaciones: r.dias_vacaciones ?? undefined,
  costeHora: r.coste_hora != null ? Number(r.coste_hora) : undefined,
  modulos: r.modulos ?? undefined,
});
export const fromUsuario = (u: Partial<Usuario>): any => ({
  ...(u.id !== undefined && { id: u.id }),
  ...(u.tenantId !== undefined && { tenant_id: u.tenantId }),
  ...(u.nombre !== undefined && { nombre: u.nombre }),
  ...(u.password !== undefined && { password: u.password }),
  ...(u.rol !== undefined && { rol: u.rol }),
  ...(u.telefono !== undefined && { telefono: u.telefono ?? null }),
  ...(u.puesto !== undefined && { puesto: u.puesto ?? null }),
  ...(u.activo !== undefined && { activo: u.activo }),
  ...(u.color !== undefined && { color: u.color }),
  ...(u.diasVacaciones !== undefined && { dias_vacaciones: u.diasVacaciones ?? null }),
  ...(u.costeHora !== undefined && { coste_hora: u.costeHora ?? null }),
  ...(u.modulos !== undefined && { modulos: u.modulos ?? null }),
});

// ── Obra ──
export const toObra = (r: any): Obra => ({
  id: r.id,
  tenantId: r.tenant_id,
  nombre: r.nombre,
  direccion: r.direccion,
  estado: r.estado,
  clienteId: r.cliente_id ?? null,
  presupuesto: r.presupuesto != null ? Number(r.presupuesto) : undefined,
  avance: r.avance,
  encargadoId: r.encargado_id,
  trabajadorIds: r.trabajador_ids ?? [],
  color: r.color,
  createdAt: r.created_at,
  diasLaborables: r.dias_laborables ?? [1, 2, 3, 4, 5],
  horaEntrada: (r.hora_entrada ?? "09:00").slice(0, 5),
  horaSalida: (r.hora_salida ?? "18:00").slice(0, 5),
  margenSalidaAutomaticaMin: r.margen_salida_automatica_min ?? 5,
});
export const fromObra = (o: Partial<Obra>): any => ({
  ...(o.id !== undefined && { id: o.id }),
  ...(o.tenantId !== undefined && { tenant_id: o.tenantId }),
  ...(o.nombre !== undefined && { nombre: o.nombre }),
  ...(o.direccion !== undefined && { direccion: o.direccion }),
  ...(o.estado !== undefined && { estado: o.estado }),
  ...(o.clienteId !== undefined && { cliente_id: o.clienteId ?? null }),
  ...(o.presupuesto !== undefined && { presupuesto: o.presupuesto ?? null }),
  ...(o.avance !== undefined && { avance: o.avance }),
  ...(o.encargadoId !== undefined && { encargado_id: o.encargadoId }),
  ...(o.trabajadorIds !== undefined && { trabajador_ids: o.trabajadorIds }),
  ...(o.color !== undefined && { color: o.color }),
  ...(o.createdAt !== undefined && { created_at: o.createdAt }),
  ...(o.diasLaborables !== undefined && { dias_laborables: o.diasLaborables }),
  ...(o.horaEntrada !== undefined && { hora_entrada: o.horaEntrada }),
  ...(o.horaSalida !== undefined && { hora_salida: o.horaSalida }),
  ...(o.margenSalidaAutomaticaMin !== undefined && {
    margen_salida_automatica_min: o.margenSalidaAutomaticaMin,
  }),
});

// ── Fichaje ──
export const toFichaje = (r: any): Fichaje => ({
  id: r.id,
  tenantId: r.tenant_id,
  trabajadorId: r.trabajador_id,
  obraId: r.obra_id,
  tipo: r.tipo,
  timestamp: r.timestamp,
  gps: r.gps ?? null,
  estado: r.estado,
  creadoEn: r.creado_en ?? r.timestamp,
  corrigeA: r.corrige_a ?? null,
});
export const fromFichaje = (f: Partial<Fichaje>): any => ({
  ...(f.id !== undefined && { id: f.id }),
  ...(f.tenantId !== undefined && { tenant_id: f.tenantId }),
  ...(f.trabajadorId !== undefined && { trabajador_id: f.trabajadorId }),
  ...(f.obraId !== undefined && { obra_id: f.obraId }),
  ...(f.tipo !== undefined && { tipo: f.tipo }),
  ...(f.timestamp !== undefined && { timestamp: f.timestamp }),
  ...(f.gps !== undefined && { gps: f.gps }),
  ...(f.estado !== undefined && { estado: f.estado }),
  ...(f.creadoEn !== undefined && { creado_en: f.creadoEn }),
  ...(f.corrigeA !== undefined && { corrige_a: f.corrigeA }),
});

// ── Parte ──
export const toParte = (r: any): ParteDiario => ({
  id: r.id,
  tenantId: r.tenant_id,
  obraId: r.obra_id,
  fecha: r.fecha,
  encargadoId: r.encargado_id,
  trabajoRealizado: r.trabajo_realizado ?? "",
  materialesPendientes: r.materiales_pendientes ?? [],
  observaciones: r.observaciones ?? "",
  incidencias: r.incidencias ?? "",
  avance: r.avance ?? 0,
  firma: r.firma ?? null,
  estado: r.estado,
  createdAt: r.created_at,
  closedAt: r.closed_at ?? null,
});
export const fromParte = (p: Partial<ParteDiario>): any => ({
  ...(p.id !== undefined && { id: p.id }),
  ...(p.tenantId !== undefined && { tenant_id: p.tenantId }),
  ...(p.obraId !== undefined && { obra_id: p.obraId }),
  ...(p.fecha !== undefined && { fecha: p.fecha }),
  ...(p.encargadoId !== undefined && { encargado_id: p.encargadoId }),
  ...(p.trabajoRealizado !== undefined && { trabajo_realizado: p.trabajoRealizado }),
  ...(p.materialesPendientes !== undefined && { materiales_pendientes: p.materialesPendientes }),
  ...(p.observaciones !== undefined && { observaciones: p.observaciones }),
  ...(p.incidencias !== undefined && { incidencias: p.incidencias }),
  ...(p.avance !== undefined && { avance: p.avance }),
  ...(p.firma !== undefined && { firma: p.firma }),
  ...(p.estado !== undefined && { estado: p.estado }),
  ...(p.createdAt !== undefined && { created_at: p.createdAt }),
  ...(p.closedAt !== undefined && { closed_at: p.closedAt }),
});

// ── Foto ──
export const toFoto = (r: any): Foto => ({
  id: r.id,
  tenantId: r.tenant_id,
  obraId: r.obra_id,
  parteId: r.parte_id ?? null,
  subidaPor: r.subida_por ?? null,
  path: r.path,
  createdAt: r.created_at,
});

// ── Adjunto (material de referencia de obra) ──
export const toAdjunto = (r: any): Adjunto => ({
  id: r.id,
  tenantId: r.tenant_id,
  obraId: r.obra_id,
  tipo: r.tipo,
  path: r.path,
  subidoPor: r.subido_por ?? null,
  createdAt: r.created_at,
});

// ── Incidencia ──
export const toIncidencia = (r: any): Incidencia => ({
  id: r.id,
  tenantId: r.tenant_id,
  obraId: r.obra_id,
  titulo: r.titulo,
  descripcion: r.descripcion,
  fecha: r.fecha,
  estado: r.estado,
  trabajadorId: r.trabajador_id ?? null,
});
export const fromIncidencia = (i: Partial<Incidencia>): any => ({
  ...(i.id !== undefined && { id: i.id }),
  ...(i.tenantId !== undefined && { tenant_id: i.tenantId }),
  ...(i.obraId !== undefined && { obra_id: i.obraId }),
  ...(i.titulo !== undefined && { titulo: i.titulo }),
  ...(i.descripcion !== undefined && { descripcion: i.descripcion }),
  ...(i.fecha !== undefined && { fecha: i.fecha }),
  ...(i.estado !== undefined && { estado: i.estado }),
  ...(i.trabajadorId !== undefined && { trabajador_id: i.trabajadorId }),
});

// ── Notificación ──
export const toNotificacion = (r: any): Notificacion => ({
  id: r.id,
  tenantId: r.tenant_id,
  trabajadorId: r.trabajador_id ?? null,
  tipo: r.tipo,
  titulo: r.titulo,
  mensaje: r.mensaje,
  fecha: r.fecha,
  leida: r.leida,
});
export const fromNotificacion = (n: Partial<Notificacion>): any => ({
  ...(n.id !== undefined && { id: n.id }),
  ...(n.tenantId !== undefined && { tenant_id: n.tenantId }),
  ...(n.trabajadorId !== undefined && { trabajador_id: n.trabajadorId }),
  ...(n.tipo !== undefined && { tipo: n.tipo }),
  ...(n.titulo !== undefined && { titulo: n.titulo }),
  ...(n.mensaje !== undefined && { mensaje: n.mensaje }),
  ...(n.fecha !== undefined && { fecha: n.fecha }),
  ...(n.leida !== undefined && { leida: n.leida }),
});

// ── Recursos ──
export const toVehiculo = (r: any): Vehiculo => ({
  id: r.id,
  tenantId: r.tenant_id,
  matricula: r.matricula,
  modelo: r.modelo,
  asignadoA: r.asignado_a ?? null,
  estado: r.estado,
});
export const toHerramienta = (r: any): Herramienta => ({
  id: r.id,
  tenantId: r.tenant_id,
  nombre: r.nombre,
  cantidad: r.cantidad,
  ubicacion: r.ubicacion,
});
export const toAlmacen = (r: any): AlmacenItem => ({
  id: r.id,
  tenantId: r.tenant_id,
  nombre: r.nombre,
  stock: r.stock,
  unidad: r.unidad,
  minimo: r.minimo,
});

// ── Módulos RRHH ──
export const toAusencia = (r: any): Ausencia => ({
  id: r.id,
  tenantId: r.tenant_id,
  trabajadorId: r.trabajador_id,
  tipo: r.tipo,
  fechaInicio: r.fecha_inicio,
  fechaFin: r.fecha_fin,
  motivo: r.motivo ?? "",
  estado: r.estado,
  respuesta: r.respuesta ?? null,
  creadaEn: r.creada_en,
});
export const fromAusencia = (a: Partial<Ausencia>): any => ({
  ...(a.id !== undefined && { id: a.id }),
  ...(a.tenantId !== undefined && { tenant_id: a.tenantId }),
  ...(a.trabajadorId !== undefined && { trabajador_id: a.trabajadorId }),
  ...(a.tipo !== undefined && { tipo: a.tipo }),
  ...(a.fechaInicio !== undefined && { fecha_inicio: a.fechaInicio }),
  ...(a.fechaFin !== undefined && { fecha_fin: a.fechaFin }),
  ...(a.motivo !== undefined && { motivo: a.motivo }),
  ...(a.estado !== undefined && { estado: a.estado }),
  ...(a.respuesta !== undefined && { respuesta: a.respuesta }),
  ...(a.creadaEn !== undefined && { creada_en: a.creadaEn }),
});

export const toTurno = (r: any): Turno => ({
  id: r.id,
  tenantId: r.tenant_id,
  trabajadorId: r.trabajador_id,
  fecha: r.fecha,
  obraId: r.obra_id ?? null,
  horaInicio: (r.hora_inicio ?? "09:00").slice(0, 5),
  horaFin: (r.hora_fin ?? "18:00").slice(0, 5),
  nota: r.nota ?? "",
});
export const fromTurno = (t: Partial<Turno>): any => ({
  ...(t.id !== undefined && { id: t.id }),
  ...(t.tenantId !== undefined && { tenant_id: t.tenantId }),
  ...(t.trabajadorId !== undefined && { trabajador_id: t.trabajadorId }),
  ...(t.fecha !== undefined && { fecha: t.fecha }),
  ...(t.obraId !== undefined && { obra_id: t.obraId }),
  ...(t.horaInicio !== undefined && { hora_inicio: t.horaInicio }),
  ...(t.horaFin !== undefined && { hora_fin: t.horaFin }),
  ...(t.nota !== undefined && { nota: t.nota }),
});

export const toGasto = (r: any): Gasto => ({
  id: r.id,
  tenantId: r.tenant_id,
  trabajadorId: r.trabajador_id,
  obraId: r.obra_id ?? null,
  clienteId: r.cliente_id ?? null,
  concepto: r.concepto,
  categoria: r.categoria,
  importe: Number(r.importe),
  fecha: r.fecha,
  justificante: r.justificante ?? null,
  estado: r.estado,
  creadoEn: r.creado_en,
});
export const fromGasto = (g: Partial<Gasto>): any => ({
  ...(g.id !== undefined && { id: g.id }),
  ...(g.tenantId !== undefined && { tenant_id: g.tenantId }),
  ...(g.trabajadorId !== undefined && { trabajador_id: g.trabajadorId }),
  ...(g.obraId !== undefined && { obra_id: g.obraId }),
  ...(g.clienteId !== undefined && { cliente_id: g.clienteId ?? null }),
  ...(g.concepto !== undefined && { concepto: g.concepto }),
  ...(g.categoria !== undefined && { categoria: g.categoria }),
  ...(g.importe !== undefined && { importe: g.importe }),
  ...(g.fecha !== undefined && { fecha: g.fecha }),
  ...(g.justificante !== undefined && { justificante: g.justificante }),
  ...(g.estado !== undefined && { estado: g.estado }),
  ...(g.creadoEn !== undefined && { creado_en: g.creadoEn }),
});

export const toDocumento = (r: any): Documento => ({
  id: r.id,
  tenantId: r.tenant_id,
  usuarioId: r.usuario_id ?? null,
  clienteId: r.cliente_id ?? null,
  nombre: r.nombre,
  categoria: r.categoria,
  path: r.path,
  mime: r.mime ?? "application/octet-stream",
  subidoPor: r.subido_por ?? null,
  createdAt: r.created_at,
});
export const fromDocumento = (d: Partial<Documento>): any => ({
  ...(d.id !== undefined && { id: d.id }),
  ...(d.tenantId !== undefined && { tenant_id: d.tenantId }),
  ...(d.usuarioId !== undefined && { usuario_id: d.usuarioId }),
  ...(d.clienteId !== undefined && { cliente_id: d.clienteId ?? null }),
  ...(d.nombre !== undefined && { nombre: d.nombre }),
  ...(d.categoria !== undefined && { categoria: d.categoria }),
  ...(d.path !== undefined && { path: d.path }),
  ...(d.mime !== undefined && { mime: d.mime }),
  ...(d.subidoPor !== undefined && { subido_por: d.subidoPor }),
  ...(d.createdAt !== undefined && { created_at: d.createdAt }),
});

export const toEvaluacion = (r: any): Evaluacion => ({
  id: r.id,
  tenantId: r.tenant_id,
  trabajadorId: r.trabajador_id,
  evaluadorId: r.evaluador_id ?? null,
  periodo: r.periodo,
  puntuaciones: r.puntuaciones,
  comentario: r.comentario ?? "",
  createdAt: r.created_at,
});
export const fromEvaluacion = (e: Partial<Evaluacion>): any => ({
  ...(e.id !== undefined && { id: e.id }),
  ...(e.tenantId !== undefined && { tenant_id: e.tenantId }),
  ...(e.trabajadorId !== undefined && { trabajador_id: e.trabajadorId }),
  ...(e.evaluadorId !== undefined && { evaluador_id: e.evaluadorId }),
  ...(e.periodo !== undefined && { periodo: e.periodo }),
  ...(e.puntuaciones !== undefined && { puntuaciones: e.puntuaciones }),
  ...(e.comentario !== undefined && { comentario: e.comentario }),
  ...(e.createdAt !== undefined && { created_at: e.createdAt }),
});

export const toMeta = (r: any): Meta => ({
  id: r.id,
  tenantId: r.tenant_id,
  trabajadorId: r.trabajador_id ?? null,
  titulo: r.titulo,
  descripcion: r.descripcion ?? "",
  progreso: r.progreso ?? 0,
  fechaObjetivo: r.fecha_objetivo,
  createdAt: r.created_at,
});
export const fromMeta = (m: Partial<Meta>): any => ({
  ...(m.id !== undefined && { id: m.id }),
  ...(m.tenantId !== undefined && { tenant_id: m.tenantId }),
  ...(m.trabajadorId !== undefined && { trabajador_id: m.trabajadorId }),
  ...(m.titulo !== undefined && { titulo: m.titulo }),
  ...(m.descripcion !== undefined && { descripcion: m.descripcion }),
  ...(m.progreso !== undefined && { progreso: m.progreso }),
  ...(m.fechaObjetivo !== undefined && { fecha_objetivo: m.fechaObjetivo }),
  ...(m.createdAt !== undefined && { created_at: m.createdAt }),
});

export const toOnboarding = (r: any): ProcesoOnboarding => ({
  id: r.id,
  tenantId: r.tenant_id,
  usuarioId: r.usuario_id,
  tipo: r.tipo,
  tareas: r.tareas ?? [],
  createdAt: r.created_at,
});
export const fromOnboarding = (o: Partial<ProcesoOnboarding>): any => ({
  ...(o.id !== undefined && { id: o.id }),
  ...(o.tenantId !== undefined && { tenant_id: o.tenantId }),
  ...(o.usuarioId !== undefined && { usuario_id: o.usuarioId }),
  ...(o.tipo !== undefined && { tipo: o.tipo }),
  ...(o.tareas !== undefined && { tareas: o.tareas }),
  ...(o.createdAt !== undefined && { created_at: o.createdAt }),
});

export const toComunicado = (r: any): Comunicado => ({
  id: r.id,
  tenantId: r.tenant_id,
  titulo: r.titulo,
  cuerpo: r.cuerpo ?? "",
  autorId: r.autor_id ?? null,
  fecha: r.fecha,
  fijado: r.fijado ?? false,
});
export const fromComunicado = (c: Partial<Comunicado>): any => ({
  ...(c.id !== undefined && { id: c.id }),
  ...(c.tenantId !== undefined && { tenant_id: c.tenantId }),
  ...(c.titulo !== undefined && { titulo: c.titulo }),
  ...(c.cuerpo !== undefined && { cuerpo: c.cuerpo }),
  ...(c.autorId !== undefined && { autor_id: c.autorId }),
  ...(c.fecha !== undefined && { fecha: c.fecha }),
  ...(c.fijado !== undefined && { fijado: c.fijado }),
});

export const toDenuncia = (r: any): Denuncia => ({
  id: r.id,
  tenantId: r.tenant_id,
  categoria: r.categoria,
  descripcion: r.descripcion,
  anonima: r.anonima ?? false,
  trabajadorId: r.trabajador_id ?? null,
  estado: r.estado,
  fecha: r.fecha,
});
export const fromDenuncia = (d: Partial<Denuncia>): any => ({
  ...(d.id !== undefined && { id: d.id }),
  ...(d.tenantId !== undefined && { tenant_id: d.tenantId }),
  ...(d.categoria !== undefined && { categoria: d.categoria }),
  ...(d.descripcion !== undefined && { descripcion: d.descripcion }),
  ...(d.anonima !== undefined && { anonima: d.anonima }),
  ...(d.trabajadorId !== undefined && { trabajador_id: d.trabajadorId }),
  ...(d.estado !== undefined && { estado: d.estado }),
  ...(d.fecha !== undefined && { fecha: d.fecha }),
});

// ── Cliente (CRM) ──
export const toCliente = (r: any): Cliente => ({
  id: r.id,
  tenantId: r.tenant_id,
  nombre: r.nombre,
  apellidos: r.apellidos ?? "",
  telefono: r.telefono ?? "",
  email: r.email ?? "",
  direccion: r.direccion ?? "",
  canal: r.canal ?? "otro",
  canalDetalle: r.canal_detalle ?? "",
  notas: r.notas ?? "",
  activo: r.activo ?? true,
  createdAt: r.created_at,
});
export const fromCliente = (c: Partial<Cliente>): any => ({
  ...(c.id !== undefined && { id: c.id }),
  ...(c.tenantId !== undefined && { tenant_id: c.tenantId }),
  ...(c.nombre !== undefined && { nombre: c.nombre }),
  ...(c.apellidos !== undefined && { apellidos: c.apellidos }),
  ...(c.telefono !== undefined && { telefono: c.telefono }),
  ...(c.email !== undefined && { email: c.email }),
  ...(c.direccion !== undefined && { direccion: c.direccion }),
  ...(c.canal !== undefined && { canal: c.canal }),
  ...(c.canalDetalle !== undefined && { canal_detalle: c.canalDetalle }),
  ...(c.notas !== undefined && { notas: c.notas }),
  ...(c.activo !== undefined && { activo: c.activo }),
  ...(c.createdAt !== undefined && { created_at: c.createdAt }),
});

// ── Factura ──
export const toFactura = (r: any): Factura => ({
  id: r.id,
  tenantId: r.tenant_id,
  clienteId: r.cliente_id,
  obraId: r.obra_id ?? null,
  numero: r.numero ?? "",
  fecha: r.fecha,
  concepto: r.concepto ?? "",
  base: Number(r.base),
  iva: Number(r.iva),
  total: Number(r.total),
  estado: r.estado,
  fechaVencimiento: r.fecha_vencimiento ?? null,
  fechaPago: r.fecha_pago ?? null,
  archivo: r.archivo ?? null,
  createdAt: r.created_at,
});
export const fromFactura = (f: Partial<Factura>): any => ({
  ...(f.id !== undefined && { id: f.id }),
  ...(f.tenantId !== undefined && { tenant_id: f.tenantId }),
  ...(f.clienteId !== undefined && { cliente_id: f.clienteId }),
  ...(f.obraId !== undefined && { obra_id: f.obraId ?? null }),
  ...(f.numero !== undefined && { numero: f.numero }),
  ...(f.fecha !== undefined && { fecha: f.fecha }),
  ...(f.concepto !== undefined && { concepto: f.concepto }),
  ...(f.base !== undefined && { base: f.base }),
  ...(f.iva !== undefined && { iva: f.iva }),
  ...(f.total !== undefined && { total: f.total }),
  ...(f.estado !== undefined && { estado: f.estado }),
  ...(f.fechaVencimiento !== undefined && { fecha_vencimiento: f.fechaVencimiento ?? null }),
  ...(f.fechaPago !== undefined && { fecha_pago: f.fechaPago ?? null }),
  ...(f.archivo !== undefined && { archivo: f.archivo ?? null }),
  ...(f.createdAt !== undefined && { created_at: f.createdAt }),
});

// ── Presupuestos: proveedor / artículo / partida / presupuesto / disclaimer ──
export const toProveedor = (r: any): Proveedor => ({
  id: r.id,
  tenantId: r.tenant_id,
  nombre: r.nombre,
  cif: r.cif ?? "",
  telefono: r.telefono ?? "",
  email: r.email ?? "",
  notas: r.notas ?? "",
  createdAt: r.created_at,
});
export const fromProveedor = (p: Partial<Proveedor>): any => ({
  ...(p.id !== undefined && { id: p.id }),
  ...(p.tenantId !== undefined && { tenant_id: p.tenantId }),
  ...(p.nombre !== undefined && { nombre: p.nombre }),
  ...(p.cif !== undefined && { cif: p.cif }),
  ...(p.telefono !== undefined && { telefono: p.telefono }),
  ...(p.email !== undefined && { email: p.email }),
  ...(p.notas !== undefined && { notas: p.notas }),
  ...(p.createdAt !== undefined && { created_at: p.createdAt }),
});

export const toArticulo = (r: any): Articulo => ({
  id: r.id,
  tenantId: r.tenant_id,
  referencia: r.referencia ?? "",
  nombre: r.nombre,
  proveedorId: r.proveedor_id ?? null,
  categoria: r.categoria ?? "material",
  unidad: r.unidad ?? "ud",
  coste: Number(r.coste),
  especificaciones: r.especificaciones ?? undefined,
  createdAt: r.created_at,
});
export const fromArticulo = (a: Partial<Articulo>): any => ({
  ...(a.id !== undefined && { id: a.id }),
  ...(a.tenantId !== undefined && { tenant_id: a.tenantId }),
  ...(a.referencia !== undefined && { referencia: a.referencia }),
  ...(a.nombre !== undefined && { nombre: a.nombre }),
  ...(a.proveedorId !== undefined && { proveedor_id: a.proveedorId ?? null }),
  ...(a.categoria !== undefined && { categoria: a.categoria }),
  ...(a.unidad !== undefined && { unidad: a.unidad }),
  ...(a.coste !== undefined && { coste: a.coste }),
  ...(a.especificaciones !== undefined && { especificaciones: a.especificaciones ?? null }),
  ...(a.createdAt !== undefined && { created_at: a.createdAt }),
});

export const toPartida = (r: any): Partida => ({
  id: r.id,
  tenantId: r.tenant_id,
  nombre: r.nombre,
  unidad: r.unidad ?? "ud",
  descripcion: r.descripcion ?? "",
  componentes: r.componentes ?? [],
  createdAt: r.created_at,
});
export const fromPartida = (p: Partial<Partida>): any => ({
  ...(p.id !== undefined && { id: p.id }),
  ...(p.tenantId !== undefined && { tenant_id: p.tenantId }),
  ...(p.nombre !== undefined && { nombre: p.nombre }),
  ...(p.unidad !== undefined && { unidad: p.unidad }),
  ...(p.descripcion !== undefined && { descripcion: p.descripcion }),
  ...(p.componentes !== undefined && { componentes: p.componentes }),
  ...(p.createdAt !== undefined && { created_at: p.createdAt }),
});

export const toPresupuesto = (r: any): Presupuesto => ({
  id: r.id,
  tenantId: r.tenant_id,
  clienteId: r.cliente_id ?? null,
  obraId: r.obra_id ?? null,
  numero: r.numero ?? "",
  fecha: r.fecha,
  estado: r.estado ?? "borrador",
  margenPct: Number(r.margen_pct ?? 0),
  lineas: r.lineas ?? [],
  disclaimers: r.disclaimers ?? [],
  notas: r.notas ?? "",
  createdAt: r.created_at,
});
export const fromPresupuesto = (p: Partial<Presupuesto>): any => ({
  ...(p.id !== undefined && { id: p.id }),
  ...(p.tenantId !== undefined && { tenant_id: p.tenantId }),
  ...(p.clienteId !== undefined && { cliente_id: p.clienteId ?? null }),
  ...(p.obraId !== undefined && { obra_id: p.obraId ?? null }),
  ...(p.numero !== undefined && { numero: p.numero }),
  ...(p.fecha !== undefined && { fecha: p.fecha }),
  ...(p.estado !== undefined && { estado: p.estado }),
  ...(p.margenPct !== undefined && { margen_pct: p.margenPct }),
  ...(p.lineas !== undefined && { lineas: p.lineas }),
  ...(p.disclaimers !== undefined && { disclaimers: p.disclaimers }),
  ...(p.notas !== undefined && { notas: p.notas }),
  ...(p.createdAt !== undefined && { created_at: p.createdAt }),
});

export const toCompra = (r: any): FacturaProveedor => ({
  id: r.id,
  tenantId: r.tenant_id,
  proveedorId: r.proveedor_id ?? null,
  obraId: r.obra_id ?? null,
  numero: r.numero ?? "",
  fecha: r.fecha,
  archivo: r.archivo ?? null,
  lineas: r.lineas ?? [],
  estado: r.estado ?? "borrador",
  total: Number(r.total ?? 0),
  createdAt: r.created_at,
});
export const fromCompra = (c: Partial<FacturaProveedor>): any => ({
  ...(c.id !== undefined && { id: c.id }),
  ...(c.tenantId !== undefined && { tenant_id: c.tenantId }),
  ...(c.proveedorId !== undefined && { proveedor_id: c.proveedorId ?? null }),
  ...(c.obraId !== undefined && { obra_id: c.obraId ?? null }),
  ...(c.numero !== undefined && { numero: c.numero }),
  ...(c.fecha !== undefined && { fecha: c.fecha }),
  ...(c.archivo !== undefined && { archivo: c.archivo ?? null }),
  ...(c.lineas !== undefined && { lineas: c.lineas }),
  ...(c.estado !== undefined && { estado: c.estado }),
  ...(c.total !== undefined && { total: c.total }),
  ...(c.createdAt !== undefined && { created_at: c.createdAt }),
});

export const toDisclaimer = (r: any): PlantillaDisclaimer => ({
  id: r.id,
  tenantId: r.tenant_id,
  titulo: r.titulo ?? "",
  texto: r.texto ?? "",
});
export const fromDisclaimer = (d: Partial<PlantillaDisclaimer>): any => ({
  ...(d.id !== undefined && { id: d.id }),
  ...(d.tenantId !== undefined && { tenant_id: d.tenantId }),
  ...(d.titulo !== undefined && { titulo: d.titulo }),
  ...(d.texto !== undefined && { texto: d.texto }),
});

/** Lanza un Error legible a partir del error de Supabase. */
export function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message ?? "Error de Supabase");
  return res.data;
}
