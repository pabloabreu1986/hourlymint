// Mapeadores fila (snake_case en Postgres) ↔ dominio (camelCase en TS).
// Centralizados para que todos los servicios Supabase mapeen igual.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Usuario,
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
} from "@/lib/types";

// ── Usuario ──
export const toUsuario = (r: any): Usuario => ({
  id: r.id,
  nombre: r.nombre,
  password: r.password,
  rol: r.rol,
  telefono: r.telefono ?? undefined,
  puesto: r.puesto ?? undefined,
  activo: r.activo,
  color: r.color,
});
export const fromUsuario = (u: Partial<Usuario>): any => ({
  ...(u.id !== undefined && { id: u.id }),
  ...(u.nombre !== undefined && { nombre: u.nombre }),
  ...(u.password !== undefined && { password: u.password }),
  ...(u.rol !== undefined && { rol: u.rol }),
  ...(u.telefono !== undefined && { telefono: u.telefono ?? null }),
  ...(u.puesto !== undefined && { puesto: u.puesto ?? null }),
  ...(u.activo !== undefined && { activo: u.activo }),
  ...(u.color !== undefined && { color: u.color }),
});

// ── Obra ──
export const toObra = (r: any): Obra => ({
  id: r.id,
  nombre: r.nombre,
  direccion: r.direccion,
  estado: r.estado,
  avance: r.avance,
  encargadoId: r.encargado_id,
  trabajadorIds: r.trabajador_ids ?? [],
  color: r.color,
  createdAt: r.created_at,
});
export const fromObra = (o: Partial<Obra>): any => ({
  ...(o.id !== undefined && { id: o.id }),
  ...(o.nombre !== undefined && { nombre: o.nombre }),
  ...(o.direccion !== undefined && { direccion: o.direccion }),
  ...(o.estado !== undefined && { estado: o.estado }),
  ...(o.avance !== undefined && { avance: o.avance }),
  ...(o.encargadoId !== undefined && { encargado_id: o.encargadoId }),
  ...(o.trabajadorIds !== undefined && { trabajador_ids: o.trabajadorIds }),
  ...(o.color !== undefined && { color: o.color }),
  ...(o.createdAt !== undefined && { created_at: o.createdAt }),
});

// ── Fichaje ──
export const toFichaje = (r: any): Fichaje => ({
  id: r.id,
  trabajadorId: r.trabajador_id,
  obraId: r.obra_id,
  tipo: r.tipo,
  timestamp: r.timestamp,
  gps: r.gps ?? null,
  estado: r.estado,
});
export const fromFichaje = (f: Partial<Fichaje>): any => ({
  ...(f.id !== undefined && { id: f.id }),
  ...(f.trabajadorId !== undefined && { trabajador_id: f.trabajadorId }),
  ...(f.obraId !== undefined && { obra_id: f.obraId }),
  ...(f.tipo !== undefined && { tipo: f.tipo }),
  ...(f.timestamp !== undefined && { timestamp: f.timestamp }),
  ...(f.gps !== undefined && { gps: f.gps }),
  ...(f.estado !== undefined && { estado: f.estado }),
});

// ── Parte ──
export const toParte = (r: any): ParteDiario => ({
  id: r.id,
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
  obraId: r.obra_id,
  parteId: r.parte_id ?? null,
  subidaPor: r.subida_por ?? null,
  path: r.path,
  createdAt: r.created_at,
});

// ── Adjunto (material de referencia de obra) ──
export const toAdjunto = (r: any): Adjunto => ({
  id: r.id,
  obraId: r.obra_id,
  tipo: r.tipo,
  path: r.path,
  subidoPor: r.subido_por ?? null,
  createdAt: r.created_at,
});

// ── Incidencia ──
export const toIncidencia = (r: any): Incidencia => ({
  id: r.id,
  obraId: r.obra_id,
  titulo: r.titulo,
  descripcion: r.descripcion,
  fecha: r.fecha,
  estado: r.estado,
  trabajadorId: r.trabajador_id ?? null,
});
export const fromIncidencia = (i: Partial<Incidencia>): any => ({
  ...(i.id !== undefined && { id: i.id }),
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
  trabajadorId: r.trabajador_id ?? null,
  tipo: r.tipo,
  titulo: r.titulo,
  mensaje: r.mensaje,
  fecha: r.fecha,
  leida: r.leida,
});
export const fromNotificacion = (n: Partial<Notificacion>): any => ({
  ...(n.id !== undefined && { id: n.id }),
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
  matricula: r.matricula,
  modelo: r.modelo,
  asignadoA: r.asignado_a ?? null,
  estado: r.estado,
});
export const toHerramienta = (r: any): Herramienta => ({
  id: r.id,
  nombre: r.nombre,
  cantidad: r.cantidad,
  ubicacion: r.ubicacion,
});
export const toAlmacen = (r: any): AlmacenItem => ({
  id: r.id,
  nombre: r.nombre,
  stock: r.stock,
  unidad: r.unidad,
  minimo: r.minimo,
});

/** Lanza un Error legible a partir del error de Supabase. */
export function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message ?? "Error de Supabase");
  return res.data;
}
