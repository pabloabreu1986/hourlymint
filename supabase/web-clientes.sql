-- ─────────────────────────────────────────────────────────────
-- fichaloop · Mini-web pública por cliente
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- Añade la columna `web` (jsonb) a `tenants`: un array de secciones
-- (hero, texto, cards, lista, chips, faq, cta) que el super-admin
-- configura desde su panel. Si está vacío, la raíz del subdominio
-- sigue mostrando el login como siempre.
-- ─────────────────────────────────────────────────────────────

alter table tenants add column if not exists web jsonb not null default '[]';
