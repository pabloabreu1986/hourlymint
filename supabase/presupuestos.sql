-- ─────────────────────────────────────────────────────────────
-- fichaloop · Módulo Presupuestos — Etapa 1
-- Banco de precios (proveedores, artículos, partidas) + presupuestos +
-- plantillas de disclaimer, y coste/hora en usuarios.
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
-- ─────────────────────────────────────────────────────────────

create table if not exists proveedores (
  id         text primary key,
  tenant_id  text not null default 'forgevia',
  nombre     text not null,
  cif        text default '',
  telefono   text default '',
  email      text default '',
  notas      text default '',
  created_at timestamptz not null default now()
);

create table if not exists articulos (
  id           text primary key,
  tenant_id    text not null default 'forgevia',
  referencia   text default '',
  nombre       text not null,
  proveedor_id text,
  categoria    text not null default 'material',  -- material | mano_obra | maquinaria | subcontrata | otro
  unidad       text not null default 'ud',
  coste        numeric(12,2) not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists partidas (
  id          text primary key,
  tenant_id   text not null default 'forgevia',
  nombre      text not null,
  unidad      text not null default 'ud',
  descripcion text default '',
  componentes jsonb not null default '[]',          -- [{ id, articuloId, cantidad }]
  created_at  timestamptz not null default now()
);

create table if not exists presupuestos (
  id          text primary key,
  tenant_id   text not null default 'forgevia',
  cliente_id  text,
  obra_id     text,
  numero      text not null default '',
  fecha       date not null,
  estado      text not null default 'borrador',    -- borrador | enviado | aceptado | rechazado
  margen_pct  numeric(6,2) not null default 0,
  lineas      jsonb not null default '[]',
  disclaimers jsonb not null default '[]',
  notas       text default '',
  created_at  timestamptz not null default now()
);

create table if not exists disclaimers (
  id        text primary key,
  tenant_id text not null default 'forgevia',
  titulo    text default '',
  texto     text not null
);

-- Coste por hora del trabajador (mano de obra en presupuestos / coste real).
alter table usuarios add column if not exists coste_hora numeric(10,2);

-- Índices por tenant
create index if not exists idx_proveedores_tenant  on proveedores(tenant_id);
create index if not exists idx_articulos_tenant    on articulos(tenant_id);
create index if not exists idx_partidas_tenant     on partidas(tenant_id);
create index if not exists idx_presupuestos_tenant on presupuestos(tenant_id);
create index if not exists idx_disclaimers_tenant  on disclaimers(tenant_id);

-- RLS permisiva (mismo criterio que el resto del esquema)
do $$
declare t text;
begin
  foreach t in array array['proveedores','articulos','partidas','presupuestos','disclaimers']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists fichaloop_%s_all on %I', t, t);
    execute format(
      'create policy fichaloop_%s_all on %I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- Activar los módulos en FORGEVIA (compras llega en la Etapa 2 pero se activa ya)
update tenants
set funciones = (
  select array(select distinct unnest(funciones || array['presupuestos','catalogo','compras']))
)
where id = 'forgevia';
