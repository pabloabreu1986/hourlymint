-- ─────────────────────────────────────────────────────────────
-- FORGEVIA · Esquema Supabase (Postgres + Storage)
-- Ejecuta este script en: Supabase → SQL Editor → New query → Run.
-- Crea las tablas, políticas, el bucket privado de fotos y los datos
-- de ejemplo. Es idempotente: puedes volver a ejecutarlo.
--
-- ⚠️ SEGURIDAD (leer): esta app NO usa Supabase Auth (el cliente pidió
-- login simple usuario/contraseña gestionado a mano). Por eso las
-- políticas son permisivas para el rol `anon` y el panel admin lee la
-- tabla `usuarios` (incluidas las contraseñas). Es aceptable para una
-- herramienta interna, pero la clave anónima viaja en el navegador:
-- cualquiera con ella podría leer datos. Cuando quieras endurecerlo,
-- migra el login a Supabase Auth + rol admin o a una Edge Function.
-- ─────────────────────────────────────────────────────────────

-- ── Tablas ───────────────────────────────────────────────────
create table if not exists usuarios (
  id        text primary key,
  nombre    text not null,
  password  text not null,
  rol       text not null default 'trabajador',
  telefono  text,
  puesto    text,
  activo    boolean not null default true,
  color     text not null default '#3B4756'
);

create table if not exists obras (
  id             text primary key,
  nombre         text not null,
  direccion      text default '',
  estado         text not null default 'pendiente',
  avance         int  not null default 0,
  encargado_id   text references usuarios(id) on delete set null,
  trabajador_ids text[] not null default '{}',
  color          text not null default '#BE6B39',
  created_at     date not null default current_date
);

create table if not exists fichajes (
  id           text primary key,
  trabajador_id text references usuarios(id) on delete cascade,
  obra_id      text references obras(id) on delete set null,
  tipo         text not null,
  timestamp    timestamptz not null default now(),
  gps          jsonb,
  estado       text not null default 'correcto'
);

create table if not exists partes (
  id                    text primary key,
  obra_id               text references obras(id) on delete cascade,
  fecha                 date not null,
  encargado_id          text references usuarios(id) on delete set null,
  trabajo_realizado     text default '',
  materiales_pendientes jsonb not null default '[]',
  observaciones         text default '',
  incidencias           text default '',
  avance                int  not null default 0,
  firma                 text,
  estado                text not null default 'borrador',
  created_at            timestamptz not null default now(),
  closed_at             timestamptz,
  unique (obra_id, fecha)
);

create table if not exists fotos (
  id         text primary key,
  obra_id    text references obras(id) on delete cascade,
  parte_id   text references partes(id) on delete set null,
  subida_por text references usuarios(id) on delete set null,
  path       text not null,
  created_at timestamptz not null default now()
);
create index if not exists fotos_obra_idx on fotos (obra_id);
create index if not exists fotos_subida_por_idx on fotos (subida_por);

-- Material de referencia de obra (fotos/vídeo) subido por el admin/encargado,
-- para que lo vea el equipo asignado. Distinto de `fotos` (avance, sube cada
-- trabajador). Comparte el mismo bucket `fotos-obra`, bajo el prefijo `adjuntos/`.
create table if not exists obra_adjuntos (
  id         text primary key,
  obra_id    text references obras(id) on delete cascade,
  tipo       text not null default 'imagen',
  subido_por text references usuarios(id) on delete set null,
  path       text not null,
  created_at timestamptz not null default now()
);
create index if not exists obra_adjuntos_obra_idx on obra_adjuntos (obra_id);

create table if not exists incidencias (
  id           text primary key,
  obra_id      text references obras(id) on delete cascade,
  titulo       text not null,
  descripcion  text default '',
  fecha        timestamptz not null default now(),
  estado       text not null default 'nueva',
  trabajador_id text references usuarios(id) on delete set null
);

create table if not exists notificaciones (
  id           text primary key,
  trabajador_id text references usuarios(id) on delete cascade,
  tipo         text not null default 'aviso',
  titulo       text not null,
  mensaje      text default '',
  fecha        timestamptz not null default now(),
  leida        boolean not null default false
);

create table if not exists vehiculos (
  id         text primary key,
  matricula  text,
  modelo     text,
  asignado_a text references usuarios(id) on delete set null,
  estado     text not null default 'disponible'
);

create table if not exists herramientas (
  id        text primary key,
  nombre    text,
  cantidad  int not null default 0,
  ubicacion text default 'almacen'
);

create table if not exists almacen (
  id     text primary key,
  nombre text,
  stock  int not null default 0,
  unidad text default 'uds',
  minimo int not null default 0
);

-- ── RLS (permisiva para `anon`, sin Supabase Auth) ──────────
do $$
declare t text;
begin
  foreach t in array array[
    'usuarios','obras','fichajes','partes','fotos','obra_adjuntos','incidencias',
    'notificaciones','vehiculos','herramientas','almacen'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists forgevia_all on %I', t);
    execute format(
      'create policy forgevia_all on %I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- ── Storage: bucket privado de fotos ────────────────────────
-- Límite de 50MB por archivo (coincide con MAX_UPLOAD_MB en src/lib/files.ts).
insert into storage.buckets (id, name, public, file_size_limit)
values ('fotos-obra', 'fotos-obra', false, 52428800)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists forgevia_fotos_select on storage.objects;
drop policy if exists forgevia_fotos_insert on storage.objects;
drop policy if exists forgevia_fotos_delete on storage.objects;

create policy forgevia_fotos_select on storage.objects
  for select to anon, authenticated using (bucket_id = 'fotos-obra');
create policy forgevia_fotos_insert on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'fotos-obra');
create policy forgevia_fotos_delete on storage.objects
  for delete to anon, authenticated using (bucket_id = 'fotos-obra');

-- ── Datos de ejemplo (mismos que el modo mock) ──────────────
insert into usuarios (id, nombre, password, rol, telefono, puesto, activo, color) values
  ('u_admin','Antonio Manzanares','admin1234','admin','600 000 000','Administrador',true,'#3B4756'),
  ('u_juan','Juan Pérez','1234','trabajador','611111111','Oficial 1ª',true,'#BE6B39'),
  ('u_pedro','Pedro García','1234','trabajador','621212121','Instalador',true,'#2E6F8E'),
  ('u_luis','Luis Martínez','1234','trabajador','632323232','Oficial 1ª',true,'#5B7A4B'),
  ('u_carlos','Carlos López','1234','trabajador','643434343','Peón',true,'#8E4B6F'),
  ('u_manuel','Manuel Ruiz','1234','trabajador','654545454','Oficial 2ª',true,'#3B4756'),
  ('u_antonio','Antonio Sánchez','1234','trabajador','665656565','Encargado',true,'#B08423'),
  ('u_david','David Fernández','1234','trabajador','676767676','Peón',true,'#4B5F8E'),
  ('u_javier','Javier Morales','1234','trabajador','687878787','Instalador',true,'#8E5B3B')
on conflict (id) do nothing;

insert into obras (id, nombre, direccion, estado, avance, encargado_id, trabajador_ids, color) values
  ('o_vallecas','Reforma Local Vallecas','C/ Sierra de Guadarrama, 20','en_curso',70,'u_antonio','{u_juan,u_antonio,u_carlos,u_javier}','#BE6B39'),
  ('o_parla','Reforma Vivienda Parla','C/ Real, 45','en_curso',45,'u_luis','{u_luis,u_david}','#2E6F8E'),
  ('o_climatizacion','Instalación Climatización','C/ Orense, 12 · Madrid','pendiente',30,'u_pedro','{u_pedro,u_javier}','#5B7A4B'),
  ('o_oficina','Reforma Oficina Orense','C/ Orense, 34 · Madrid','pendiente',0,'u_manuel','{u_manuel}','#8E4B6F')
on conflict (id) do nothing;

insert into fichajes (id, trabajador_id, obra_id, tipo, timestamp, gps, estado) values
  ('f_juan_e','u_juan','o_vallecas','entrada', current_date + time '08:03', '{"lat":40.418,"lng":-3.701}','correcto'),
  ('f_pedro_e','u_pedro','o_climatizacion','entrada', current_date + time '08:07', '{"lat":40.421,"lng":-3.706}','tarde'),
  ('f_luis_e','u_luis','o_parla','entrada', current_date + time '08:02', '{"lat":40.412,"lng":-3.699}','correcto'),
  ('f_carlos_e','u_carlos','o_vallecas','entrada', current_date + time '08:05', '{"lat":40.419,"lng":-3.702}','correcto'),
  ('f_antonio_e','u_antonio','o_vallecas','entrada', current_date + time '08:04', '{"lat":40.417,"lng":-3.703}','correcto'),
  ('f_javier_e','u_javier','o_vallecas','entrada', current_date + time '08:06', '{"lat":40.420,"lng":-3.700}','correcto')
on conflict (id) do nothing;

insert into partes (id, obra_id, fecha, encargado_id, trabajo_realizado, materiales_pendientes, observaciones, incidencias, avance, estado) values
  ('p_vallecas_hoy','o_vallecas', current_date,'u_antonio',
   'Se ha terminado todo el techo de pladur del comedor y se ha empezado el trasdosado de la cocina. Instaladas cajas eléctricas del pasillo.',
   '[{"id":"m_1","nombre":"Placas de Pladur 13mm","cantidad":24,"unidad":"uds"},{"id":"m_2","nombre":"Tornillos Pladur","cantidad":25,"unidad":"uds"},{"id":"m_3","nombre":"Sacos de yeso","cantidad":3,"unidad":"uds"}]',
   'Pendiente confirmación de cliente sobre cambio de color del suelo.','Ninguna',70,'borrador')
on conflict (id) do nothing;

insert into incidencias (id, obra_id, titulo, descripcion, fecha, estado, trabajador_id) values
  ('i_1','o_vallecas','Falta material','Faltan sacos de yeso para terminar el trasdosado del pasillo.', current_date + time '09:15','nueva','u_antonio'),
  ('i_2','o_parla','Retraso en entrega','El proveedor retrasa la entrega de la carpintería hasta el jueves.', current_date + time '10:20','nueva','u_luis')
on conflict (id) do nothing;

insert into notificaciones (id, trabajador_id, tipo, titulo, mensaje, fecha, leida) values
  ('n_1','u_manuel','fichaje','No has fichado la entrada','Recuerda fichar tu entrada en Reforma Oficina Orense.', current_date + time '09:30', false),
  ('n_2','u_david','fichaje','No has fichado la entrada','Recuerda fichar tu entrada en Reforma Vivienda Parla.', current_date + time '09:30', false),
  ('n_3', null,'aviso','Reunión de coordinación','Mañana a las 07:45 en el almacén antes de salir a obra.', current_date + time '14:00', false)
on conflict (id) do nothing;

insert into vehiculos (id, matricula, modelo, asignado_a, estado) values
  ('v_1','1234 KBM','Renault Kangoo','u_luis','en_uso'),
  ('v_2','5678 LHN','Ford Transit','u_pedro','en_uso'),
  ('v_3','9012 MJP','Citroën Jumpy', null,'disponible'),
  ('v_4','3456 NKR','Iveco Daily', null,'taller')
on conflict (id) do nothing;

insert into herramientas (id, nombre, cantidad, ubicacion) values
  ('h_1','Radial Bosch GWS',3,'o_vallecas'),
  ('h_2','Taladro percutor Makita',5,'almacen'),
  ('h_3','Andamio modular',2,'o_parla'),
  ('h_4','Nivel láser',4,'almacen')
on conflict (id) do nothing;

insert into almacen (id, nombre, stock, unidad, minimo) values
  ('a_1','Placas de Pladur 13mm',40,'uds',30),
  ('a_2','Tornillos Pladur',12,'cajas',20),
  ('a_3','Sacos de yeso',8,'uds',15),
  ('a_4','Perfilería 48mm',120,'ml',60)
on conflict (id) do nothing;
