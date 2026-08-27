-- ─────────────────────────────────────────────────────────────
-- fichaloop · Campañas de captación de la plataforma (super-admin)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- El super-admin crea campañas desde su consola (nombre, plataforma,
-- presupuesto/día, activa). Cada campaña tiene un enlace propio
-- (fichaloop.com/contact?c=<id>) que se usa como destino del anuncio; el
-- lead que llega por ese enlace guarda su campaign_id y queda atribuido.
--
-- Acceso: como el resto de la app (clave anónima + sesión propia en la
-- ruta /super), política `for all`, coherente con `contact_leads` etc.
-- ─────────────────────────────────────────────────────────────

create table if not exists campanas (
  id              text primary key,
  nombre          text not null,
  plataforma      text not null default 'otra',
  presupuesto_dia numeric not null default 0,
  activa          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_campanas_created on campanas(created_at desc);

alter table campanas enable row level security;
drop policy if exists fichaloop_campanas_all on campanas;
create policy fichaloop_campanas_all on campanas
  for all to anon, authenticated using (true) with check (true);

-- Atribución del lead a su campaña (enlace ?c=<id>). Se añade sin romper
-- los leads ya guardados.
alter table contact_leads add column if not exists campaign_id text;
create index if not exists idx_contact_leads_campaign on contact_leads(campaign_id);
