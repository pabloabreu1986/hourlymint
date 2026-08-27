-- ─────────────────────────────────────────────────────────────
-- fichaloop · Campañas: campos extra + campaña "General"
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- Añade a `campanas` los campos fecha de fin, objetivo de leads y nota
-- interna. Crea la campaña "General" (id fijo 'general'), a la que se
-- atribuyen los leads que llegan a /contact sin ?c= (tráfico directo).
-- ─────────────────────────────────────────────────────────────

alter table campanas add column if not exists fecha_fin      date;
alter table campanas add column if not exists objetivo_leads integer;
alter table campanas add column if not exists nota_interna   text;

-- Campaña por defecto para el tráfico directo. Si ya existe, no se toca.
insert into campanas (id, nombre, plataforma, presupuesto_dia, activa, created_at)
values ('general', 'General (tráfico directo)', 'otra', 0, true, '2000-01-01T00:00:00Z')
on conflict (id) do nothing;
