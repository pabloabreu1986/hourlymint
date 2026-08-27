-- ─────────────────────────────────────────────────────────────
-- fichaloop · Leads de captación de la plataforma (fichaloop.com/contact)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- El formulario público de captación (tráfico de anuncios de redes
-- sociales) inserta aquí con la clave anónima. A diferencia de
-- `web_leads` / `demo_solicitudes` (solo INSERT, se leían desde el panel
-- de Supabase), estos leads SÍ se consultan dentro de la app, en la
-- consola del super-admin. El acceso lo controla la propia sesión de la
-- app (ruta /super, rol superadmin), igual que el resto de tablas: toda
-- la app usa la clave anónima y se apoya en su sesión propia. Por eso la
-- política es `for all`, coherente con `tenants`, `clientes`, etc.
-- ─────────────────────────────────────────────────────────────

create table if not exists contact_leads (
  id               text primary key,
  nombre           text not null,
  telefono         text not null,
  consentimiento   boolean not null default false,
  consentimiento_at timestamptz,
  origen           text,
  atendido         boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists idx_contact_leads_created on contact_leads(created_at desc);

alter table contact_leads enable row level security;
drop policy if exists fichaloop_contact_leads_all on contact_leads;
create policy fichaloop_contact_leads_all on contact_leads
  for all to anon, authenticated using (true) with check (true);
