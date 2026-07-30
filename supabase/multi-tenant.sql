-- ─────────────────────────────────────────────────────────────
-- fichaloop · Aislamiento multi-tenant (tenant_id en todas las tablas)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- ⚠️ NO DESTRUCTIVO: solo AÑADE una columna `tenant_id` a cada tabla, con
-- DEFAULT 'forgevia'. Eso RELLENA automáticamente todas las filas actuales
-- (los datos de FORGEVIA) con su tenant. No hay ningún DELETE/DROP/TRUNCATE.
--
-- Debe ejecutarse ANTES de desplegar el código que filtra por tenant_id.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Añadir tenant_id (rellena las filas existentes con 'forgevia') ──
alter table usuarios       add column if not exists tenant_id text not null default 'forgevia';
alter table obras          add column if not exists tenant_id text not null default 'forgevia';
alter table fichajes       add column if not exists tenant_id text not null default 'forgevia';
alter table partes         add column if not exists tenant_id text not null default 'forgevia';
alter table fotos          add column if not exists tenant_id text not null default 'forgevia';
alter table obra_adjuntos  add column if not exists tenant_id text not null default 'forgevia';
alter table incidencias    add column if not exists tenant_id text not null default 'forgevia';
alter table notificaciones add column if not exists tenant_id text not null default 'forgevia';
alter table vehiculos      add column if not exists tenant_id text not null default 'forgevia';
alter table herramientas   add column if not exists tenant_id text not null default 'forgevia';
alter table almacen        add column if not exists tenant_id text not null default 'forgevia';

-- ── 2. Índices para el filtrado por tenant ──
create index if not exists idx_usuarios_tenant       on usuarios(tenant_id);
create index if not exists idx_obras_tenant          on obras(tenant_id);
create index if not exists idx_fichajes_tenant       on fichajes(tenant_id);
create index if not exists idx_partes_tenant         on partes(tenant_id);
create index if not exists idx_fotos_tenant          on fotos(tenant_id);
create index if not exists idx_obra_adjuntos_tenant  on obra_adjuntos(tenant_id);
create index if not exists idx_incidencias_tenant    on incidencias(tenant_id);
create index if not exists idx_notificaciones_tenant on notificaciones(tenant_id);
create index if not exists idx_vehiculos_tenant      on vehiculos(tenant_id);
create index if not exists idx_herramientas_tenant   on herramientas(tenant_id);
create index if not exists idx_almacen_tenant        on almacen(tenant_id);

-- ── 3. El super-admin no pertenece a ningún cliente ──
-- Así no aparece en la lista de trabajadores de FORGEVIA.
update usuarios set tenant_id = '_platform' where rol = 'superadmin';
