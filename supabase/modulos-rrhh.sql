-- ─────────────────────────────────────────────────────────────
-- fichaloop · Módulos RRHH (suite tipo Factorial)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- Qué hace:
--   1. Crea las tablas de los módulos: ausencias, turnos, gastos,
--      documentos, evaluaciones, metas, onboardings, comunicados
--      y denuncias (todas con tenant_id + índice).
--   2. Añade usuarios.dias_vacaciones (saldo anual, por defecto 22).
--   3. Activa los módulos nuevos en el tenant FORGEVIA.
--
-- ⚠️ RLS: mismo criterio permisivo que el resto del esquema (sin
-- Supabase Auth). El aislamiento por tenant lo aplica la app. Cuando
-- se endurezca la seguridad, endurecer TODAS las políticas a la vez.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Tablas ────────────────────────────────────────────────

create table if not exists ausencias (
  id           text primary key,
  tenant_id    text not null default 'forgevia',
  trabajador_id text not null,
  tipo         text not null,                    -- vacaciones | baja_medica | permiso | otro
  fecha_inicio date not null,
  fecha_fin    date not null,
  motivo       text default '',
  estado       text not null default 'pendiente',-- pendiente | aprobada | rechazada
  respuesta    text,
  creada_en    timestamptz not null default now()
);

create table if not exists turnos (
  id           text primary key,
  tenant_id    text not null default 'forgevia',
  trabajador_id text not null,
  fecha        date not null,
  obra_id      text,
  hora_inicio  time not null default '09:00',
  hora_fin     time not null default '18:00',
  nota         text default ''
);

create table if not exists gastos (
  id           text primary key,
  tenant_id    text not null default 'forgevia',
  trabajador_id text not null,
  obra_id      text,
  concepto     text not null,
  categoria    text not null default 'otro',     -- dietas | transporte | material | alojamiento | otro
  importe      numeric(10,2) not null,
  fecha        date not null,
  justificante text,                              -- data URL de la foto del ticket
  estado       text not null default 'pendiente',-- pendiente | aprobado | rechazado | pagado
  creado_en    timestamptz not null default now()
);

create table if not exists documentos (
  id         text primary key,
  tenant_id  text not null default 'forgevia',
  usuario_id text,                                -- null = documento de empresa
  nombre     text not null,
  categoria  text not null default 'otro',        -- nomina | contrato | certificado | otro
  path       text not null,                       -- contenido como data URL
  mime       text default 'application/octet-stream',
  subido_por text,
  created_at timestamptz not null default now()
);

create table if not exists evaluaciones (
  id           text primary key,
  tenant_id    text not null default 'forgevia',
  trabajador_id text not null,
  evaluador_id text,
  periodo      text not null,
  puntuaciones jsonb not null,                    -- { puntualidad, calidad, seguridad, equipo } 1-5
  comentario   text default '',
  created_at   timestamptz not null default now()
);

create table if not exists metas (
  id             text primary key,
  tenant_id      text not null default 'forgevia',
  trabajador_id  text,                            -- null = meta de empresa
  titulo         text not null,
  descripcion    text default '',
  progreso       int not null default 0,          -- 0-100
  fecha_objetivo date not null,
  created_at     timestamptz not null default now()
);

create table if not exists onboardings (
  id         text primary key,
  tenant_id  text not null default 'forgevia',
  usuario_id text not null,
  tipo       text not null default 'alta',        -- alta | baja
  tareas     jsonb not null default '[]',         -- [{ id, texto, hecha }]
  created_at timestamptz not null default now()
);

create table if not exists comunicados (
  id        text primary key,
  tenant_id text not null default 'forgevia',
  titulo    text not null,
  cuerpo    text default '',
  autor_id  text,
  fecha     timestamptz not null default now(),
  fijado    boolean not null default false
);

create table if not exists denuncias (
  id           text primary key,
  tenant_id    text not null default 'forgevia',
  categoria    text not null default 'otro',      -- acoso | seguridad | fraude | otro
  descripcion  text not null,
  anonima      boolean not null default true,
  trabajador_id text,                             -- null si es anónima
  estado       text not null default 'nueva',     -- nueva | en_revision | cerrada
  fecha        timestamptz not null default now()
);

-- ── Índices por tenant ──
create index if not exists idx_ausencias_tenant    on ausencias(tenant_id);
create index if not exists idx_turnos_tenant       on turnos(tenant_id);
create index if not exists idx_turnos_fecha        on turnos(tenant_id, fecha);
create index if not exists idx_gastos_tenant       on gastos(tenant_id);
create index if not exists idx_documentos_tenant   on documentos(tenant_id);
create index if not exists idx_evaluaciones_tenant on evaluaciones(tenant_id);
create index if not exists idx_metas_tenant        on metas(tenant_id);
create index if not exists idx_onboardings_tenant  on onboardings(tenant_id);
create index if not exists idx_comunicados_tenant  on comunicados(tenant_id);
create index if not exists idx_denuncias_tenant    on denuncias(tenant_id);

-- ── RLS permisiva (mismo criterio que el resto del esquema) ──
do $$
declare t text;
begin
  foreach t in array array['ausencias','turnos','gastos','documentos','evaluaciones',
                           'metas','onboardings','comunicados','denuncias']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists fichaloop_%s_all on %I', t, t);
    execute format(
      'create policy fichaloop_%s_all on %I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- ── 2. Saldo de vacaciones en usuarios ───────────────────────
alter table usuarios add column if not exists dias_vacaciones int default 22;

-- ── 3. Activar los módulos nuevos en FORGEVIA ────────────────
update tenants
set funciones = (
  select array(select distinct unnest(
    funciones || array['ausencias','turnos','gastos','nomina','documentos','evaluaciones',
                       'metas','onboarding','organigrama','comunicados','denuncias']
  ))
)
where id = 'forgevia';
