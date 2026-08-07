-- ─────────────────────────────────────────────────────────────
-- fichaloop · Módulo Comercial / CRM (clientes + facturas)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- Qué hace:
--   1. Crea las tablas `clientes` y `facturas` (con tenant_id + índices).
--   2. Añade obras.cliente_id + obras.presupuesto, gastos.cliente_id y
--      documentos.cliente_id.
--   3. RLS permisiva (mismo criterio que el resto del esquema).
--   4. Activa los módulos `clientes` y `facturas` en el tenant FORGEVIA.
--
-- Nota: "cliente" aquí es el cliente final (quien encarga las obras), no el
-- tenant. Se aísla por tenant_id como el resto de tablas.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Tablas ────────────────────────────────────────────────

create table if not exists clientes (
  id            text primary key,
  tenant_id     text not null default 'forgevia',
  nombre        text not null,
  apellidos     text default '',
  telefono      text default '',
  email         text default '',
  direccion     text default '',
  canal         text not null default 'otro',   -- redes | referencia | web | llamada | repeticion | otro
  canal_detalle text default '',
  notas         text default '',
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists facturas (
  id               text primary key,
  tenant_id        text not null default 'forgevia',
  cliente_id       text not null,
  obra_id          text,                          -- null = general del cliente
  numero           text not null default '',
  fecha            date not null,
  concepto         text default '',
  base             numeric(12,2) not null default 0,
  iva              numeric(5,2) not null default 21,
  total            numeric(12,2) not null default 0,
  estado           text not null default 'emitida', -- borrador | emitida | pagada | vencida
  fecha_vencimiento date,
  fecha_pago       date,
  archivo          text,                          -- PDF como data URL (opcional)
  created_at       timestamptz not null default now()
);

-- ── 2. Columnas nuevas en tablas existentes ──────────────────
alter table obras      add column if not exists cliente_id  text;
alter table obras      add column if not exists presupuesto numeric(12,2);
alter table gastos     add column if not exists cliente_id  text;
alter table documentos add column if not exists cliente_id  text;

-- ── Índices por tenant ──
create index if not exists idx_clientes_tenant  on clientes(tenant_id);
create index if not exists idx_facturas_tenant  on facturas(tenant_id);
create index if not exists idx_facturas_cliente on facturas(cliente_id);
create index if not exists idx_obras_cliente    on obras(cliente_id);
create index if not exists idx_gastos_cliente   on gastos(cliente_id);

-- ── RLS permisiva (mismo criterio que el resto del esquema) ──
do $$
declare t text;
begin
  foreach t in array array['clientes','facturas']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists fichaloop_%s_all on %I', t, t);
    execute format(
      'create policy fichaloop_%s_all on %I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- ── 3. Activar los módulos en FORGEVIA ───────────────────────
update tenants
set funciones = (
  select array(select distinct unnest(funciones || array['clientes','facturas']))
)
where id = 'forgevia';
