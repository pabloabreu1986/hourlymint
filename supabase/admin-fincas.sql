-- ─────────────────────────────────────────────────────────────
-- fichaloop · Vertical «Administración de Fincas» (CRM)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- Qué hace (NO DESTRUCTIVO — solo AÑADE columnas y tablas):
--   1. tenants.sector: vertical del cliente (obra | fincas).
--   2. Amplía `clientes` con tipología, estado comercial, vínculo comunidad→
--      administración y campos de seguimiento comercial.
--   3. Crea `oportunidades` e `interacciones` (con tenant_id + índices).
--   4. RLS permisiva (mismo criterio que el resto del esquema).
--
-- Modelo: una Comunidad de Propietarios es un `clientes` con tipo='comunidad'
-- y administrador_id → el `clientes` con tipo='admin_fincas' que la gestiona.
-- Así hereda obras/presupuestos/facturas/documentos por cliente_id sin duplicar.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Sector / vertical del tenant ──────────────────────────
alter table public.tenants add column if not exists sector text not null default 'obra';
comment on column public.tenants.sector is 'Vertical del cliente: obra | fincas. Decide el panel de inicio y las funciones preactivadas.';

-- ── 2. Ampliación de `clientes` (CRM / tipología / seguimiento) ──
alter table public.clientes add column if not exists tipo                 text not null default 'particular';
-- tipo: particular | empresa | admin_fincas | comunidad | arquitecto | inmobiliaria | prescriptor
alter table public.clientes add column if not exists estado_comercial     text;
-- estado_comercial: prospecto | contactado | dossier_enviado | proveedor_aceptado |
--                   primera_oportunidad | cliente_activo | cliente_recurrente | descartado
alter table public.clientes add column if not exists administrador_id     text;   -- comunidad → su administración
alter table public.clientes add column if not exists responsable_id       text;   -- usuario comercial asignado
alter table public.clientes add column if not exists nombre_administracion text default '';
alter table public.clientes add column if not exists persona_contacto     text default '';
alter table public.clientes add column if not exists cargo                text default '';
alter table public.clientes add column if not exists zona                 text default '';
alter table public.clientes add column if not exists web                  text default '';
alter table public.clientes add column if not exists num_comunidades      integer;
alter table public.clientes add column if not exists fecha_primer_contacto date;
alter table public.clientes add column if not exists fecha_ultimo_contacto date;
alter table public.clientes add column if not exists proxima_accion       text default '';
alter table public.clientes add column if not exists fecha_proxima_accion date;
alter table public.clientes add column if not exists dossier_enviado      boolean not null default false;

create index if not exists idx_clientes_tipo         on public.clientes(tipo);
create index if not exists idx_clientes_administrador on public.clientes(administrador_id);

-- ── 3. Oportunidades ─────────────────────────────────────────
create table if not exists public.oportunidades (
  id               text primary key,
  tenant_id        text not null default 'forgevia',
  cliente_id       text not null,                 -- la comunidad (o cliente) origen
  administrador_id text,                          -- administración que la origina (atribución/ranking)
  titulo           text not null default '',
  descripcion      text default '',
  estado           text not null default 'recibida',
  -- estado: recibida | visita | presupuesto_solicitado | presupuesto_enviado | aceptada | rechazada
  fecha            date not null,
  fecha_visita     date,
  presupuesto_id   text,
  obra_id          text,
  importe_estimado numeric(12,2),
  created_at       timestamptz not null default now()
);

-- ── 4. Interacciones (seguimiento comercial) ─────────────────
create table if not exists public.interacciones (
  id             text primary key,
  tenant_id      text not null default 'forgevia',
  cliente_id     text not null,
  oportunidad_id text,
  tipo           text not null default 'nota',
  -- tipo: llamada | email | whatsapp | reunion | visita | dossier | presupuesto | nota
  fecha          timestamptz not null,
  resumen        text default '',
  created_at     timestamptz not null default now()
);

-- ── Índices por tenant / relación ──
create index if not exists idx_oportunidades_tenant  on public.oportunidades(tenant_id);
create index if not exists idx_oportunidades_cliente on public.oportunidades(cliente_id);
create index if not exists idx_oportunidades_admin   on public.oportunidades(administrador_id);
create index if not exists idx_interacciones_tenant  on public.interacciones(tenant_id);
create index if not exists idx_interacciones_cliente on public.interacciones(cliente_id);

-- ── 5. RLS permisiva (mismo criterio que el resto del esquema) ──
do $$
declare t text;
begin
  foreach t in array array['oportunidades','interacciones']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists fichaloop_%s_all on public.%I', t, t);
    execute format(
      'create policy fichaloop_%s_all on public.%I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- ── 6. (Opcional) Activar la suite fincas en un tenant concreto ──
-- Sustituye 'MI_TENANT' por el id del cliente de administración de fincas.
-- Deja FORGEVIA como está (sector obra).
--
-- update public.tenants
--   set sector = 'fincas',
--       funciones = (select array(select distinct unnest(
--         funciones || array['clientes','comunidades','oportunidades','seguimiento',
--                            'presupuestos','catalogo','facturas','documentos','informes']
--       )))
-- where id = 'MI_TENANT';
