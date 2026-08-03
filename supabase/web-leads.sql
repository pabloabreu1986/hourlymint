-- ─────────────────────────────────────────────────────────────
-- fichaloop · Leads "Cuéntanos tu proyecto" de las webs de cliente
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- La mini-web pública de cada cliente inserta aquí (clave anónima).
-- Solo política de INSERT: nadie puede LEER los leads con la clave
-- pública (datos de contacto protegidos). Se consultan desde
-- Supabase → Table Editor → web_leads, filtrando por tenant_id.
-- ─────────────────────────────────────────────────────────────

create table if not exists web_leads (
  id         text primary key,
  tenant_id  text not null default 'forgevia',
  nombre     text not null,
  telefono   text not null,
  email      text,
  mensaje    text,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_leads_tenant on web_leads(tenant_id);

alter table web_leads enable row level security;
drop policy if exists fichaloop_web_leads_insert on web_leads;
create policy fichaloop_web_leads_insert on web_leads
  for insert to anon, authenticated with check (true);
