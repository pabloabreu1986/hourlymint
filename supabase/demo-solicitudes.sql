-- ─────────────────────────────────────────────────────────────
-- fichaloop · Tabla de solicitudes de demo (formulario de la web)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- La web pública inserta aquí (clave anónima). NO se crea política de
-- SELECT: nadie puede LEER las solicitudes con la clave pública (los datos
-- de contacto quedan protegidos). Tú las consultas desde el propio panel de
-- Supabase → Table Editor → demo_solicitudes.
-- ─────────────────────────────────────────────────────────────

create table if not exists demo_solicitudes (
  id         text primary key,
  nombre     text not null,
  empresa    text,
  email      text not null,
  telefono   text,
  mensaje    text,
  created_at timestamptz not null default now()
);

alter table demo_solicitudes enable row level security;

-- Solo INSERT para el público; sin SELECT (no legible con la clave anónima).
drop policy if exists fichaloop_demo_insert on demo_solicitudes;
create policy fichaloop_demo_insert on demo_solicitudes
  for insert to anon, authenticated with check (true);
