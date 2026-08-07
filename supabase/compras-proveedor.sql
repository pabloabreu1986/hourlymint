-- ─────────────────────────────────────────────────────────────
-- fichaloop · Presupuestos Etapa 2 — Facturas de proveedor (compras)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
-- (El módulo `compras` ya se activó en supabase/presupuestos.sql.)
-- ─────────────────────────────────────────────────────────────

create table if not exists compras_proveedor (
  id           text primary key,
  tenant_id    text not null default 'forgevia',
  proveedor_id text,
  obra_id      text,                                -- coste real de esa obra
  numero       text default '',
  fecha        date not null,
  archivo      text,                                -- escaneo (data URL)
  lineas       jsonb not null default '[]',         -- [{ id, descripcion, cantidad, unidad, precioUnitario, total, articuloId }]
  estado       text not null default 'borrador',    -- borrador | revisada | aprobada
  total        numeric(12,2) not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_compras_tenant on compras_proveedor(tenant_id);
create index if not exists idx_compras_obra   on compras_proveedor(obra_id);

do $$
begin
  execute 'alter table compras_proveedor enable row level security';
  execute 'drop policy if exists fichaloop_compras_proveedor_all on compras_proveedor';
  execute 'create policy fichaloop_compras_proveedor_all on compras_proveedor for all to anon, authenticated using (true) with check (true)';
end $$;
