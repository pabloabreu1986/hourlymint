-- ─────────────────────────────────────────────────────────────
-- fichaloop · Migración white-label (multi-tenant + super-admin)
-- Ejecuta en: Supabase → SQL Editor → New query → Run.
-- Es idempotente: puedes volver a ejecutarlo sin miedo.
--
-- Qué hace:
--   1. Crea la tabla `tenants` (marca de cada cliente) + RLS permisiva.
--   2. Da de alta el cliente FORGEVIA (todas las funciones activas).
--   3. Da de alta al super-admin de la plataforma: usuario `pablo` / `890p`.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Tabla de tenants (clientes) ──────────────────────────
create table if not exists tenants (
  id           text primary key,
  slug         text not null unique,          -- subdominio: <slug>.fichaloop.com
  nombre       text not null,                 -- título completo / pestaña
  nombre_corto text not null,                 -- marca corta (logo)
  eslogan      text default '',
  logotipo     jsonb,                          -- { base, acento } o null
  logo_url     text,                           -- imagen de logo (o null → SVG)
  colores      jsonb not null,                 -- paleta de marca (hex)
  funciones    text[] not null default '{}'    -- módulos activos (feature flags)
);

-- RLS permisiva (mismo criterio que el resto del esquema: sin Supabase Auth).
alter table tenants enable row level security;
drop policy if exists fichaloop_tenants_all on tenants;
create policy fichaloop_tenants_all on tenants
  for all to anon, authenticated using (true) with check (true);

-- ── 2. Cliente FORGEVIA ─────────────────────────────────────
insert into tenants (id, slug, nombre, nombre_corto, eslogan, logotipo, logo_url, colores, funciones)
values (
  'forgevia',
  'forgevia',
  'FORGEVIA · Control de Obra',
  'FORGEVIA',
  'PROYECTOS INTEGRALES',
  '{"base":"FORGE","acento":"VIA"}'::jsonb,
  null,
  '{
     "dark":"#232B36","slate":"#2E3846","steel":"#3B4756",
     "orange":"#BE6B39","orange600":"#A85B2E","orange400":"#D08853",
     "canvas":"#F4F5F7"
   }'::jsonb,
  array['dashboard','obras','trabajadores','partes','fotografias','materiales',
        'incidencias','vehiculos','herramientas','almacen','informes','horas']
)
on conflict (id) do update set
  slug         = excluded.slug,
  nombre       = excluded.nombre,
  nombre_corto = excluded.nombre_corto,
  eslogan      = excluded.eslogan,
  logotipo     = excluded.logotipo,
  colores      = excluded.colores,
  funciones    = excluded.funciones;

-- ── 3. Super-admin de la plataforma (solo Pablo) ────────────
-- La columna usuarios.rol no tiene constraint → admite 'superadmin'.
insert into usuarios (id, nombre, password, rol, telefono, puesto, activo, color)
values ('u_super', 'pablo', '890p', 'superadmin', '', 'Operador de plataforma', true, '#BE6B39')
on conflict (id) do update set
  nombre   = excluded.nombre,
  password = excluded.password,
  rol      = excluded.rol,
  activo   = excluded.activo;
