-- ═══════════════════════════════════════════════════════════════════════════
-- fichaloop · MIGRACIÓN COMPLETA (todo en uno)
-- ---------------------------------------------------------------------------
-- Ejecuta en:  Supabase → SQL Editor → New query → pega TODO → Run.
-- Es IDEMPOTENTE: puedes ejecutarlo aunque ya hayas corrido partes; no duplica
-- ni rompe nada (usa "if not exists" / "on conflict do nothing").
-- Si sale el aviso de RLS ("Potential issues detected"), pulsa "Run without
-- RLS": los scripts gestionan sus propias políticas permisivas.
-- Orden = dependencias (estructura primero, datos después).
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- [1] usuarios-modulos.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Permisos por usuario: rol `directivo` + módulos visibles por admin.
--
-- Contexto: hasta ahora todos los usuarios `admin` de un cliente veían los
-- mismos módulos (los que el super-admin activa a nivel de tenant en
-- `tenants.funciones`). Ahora un `directivo` decide, por cada usuario
-- `admin`, qué módulos ve. Se guarda como lista de claves en `usuarios.modulos`.
--
-- La columna `rol` es texto libre (sin CHECK), así que el nuevo valor
-- 'directivo' no necesita cambios de esquema.
--
-- Idempotente: se puede reejecutar sin efecto.

-- 1) Columna de módulos por usuario.
--    NULL / ausente  = acceso completo (legado y directivos, que ven todo).
--    Lista (incl. []) = el admin solo ve esas claves (+ Dashboard, siempre).
alter table public.usuarios
  add column if not exists modulos jsonb;

comment on column public.usuarios.modulos is
  'Módulos del panel que ve un usuario admin (claves de FUNCIONES_DISPONIBLES). '
  'Lo fija un directivo. NULL = acceso completo. Ver usuarioVeModulo en el front.';

-- 2) Ascender a Judit y Gilles a directivos.
--    Ajusta el nombre exacto si en la BD están con apellidos. El match es
--    por nombre (insensible a mayúsculas). Si tienes varios clientes con esos
--    nombres, añade el filtro de tenant_id correspondiente.
update public.usuarios
   set rol = 'directivo'
 where rol = 'admin'
   and lower(nombre) in ('judit', 'gilles');

-- (Opcional) comprobar el resultado:
-- select id, nombre, rol, modulos from public.usuarios where rol = 'directivo';


-- ═══════════════════════════════════════════════════════════════════════════
-- [2] clientes.sql
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- [3] presupuestos.sql
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- [4] compras-proveedor.sql
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- [5] articulos-especificaciones.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- fichaloop · Ficha técnica de los artículos del banco de precios.
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
-- La IA la rellena al escanear facturas (fabricante, medidas, normas…); el
-- resto se edita a mano en el artículo.

alter table articulos add column if not exists especificaciones text;


-- ═══════════════════════════════════════════════════════════════════════════
-- [6] dosier.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Dosier corporativo por cliente (white-label).
-- Se guarda como JSONB en la propia fila del tenant, igual que `web`.
-- Idempotente: se puede reejecutar sin efecto si la columna ya existe.

alter table public.tenants
  add column if not exists dosier jsonb;

comment on column public.tenants.dosier is
  'Dosier corporativo del cliente (portada, bloques y contraportada). Lo edita el admin de la empresa desde su panel; cada bloque activo es una página del PDF.';


-- ═══════════════════════════════════════════════════════════════════════════
-- [7] presupuestos-scaffold.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- fichaloop · Scaffold de PRESUPUESTOS RÁPIDOS (opcional) para FORGEVIA.
-- Crea la mano de obra por m² y los packs vacíos que usas normalmente, para
-- que solo tengas que poner el precio (mano de obra) y arrastrar artículos
-- dentro de cada pack desde el banco. Idempotente (on conflict do nothing).
-- Requiere haber ejecutado antes presupuestos.sql y articulos-especificaciones.sql.

-- ── Mano de obra por m² (categoría mano_obra, unidad m²; pon el precio) ──
insert into articulos (id, tenant_id, referencia, nombre, proveedor_id, categoria, unidad, coste) values
  ('art_mo_pladur',   'forgevia', '', 'Mano de obra · Pladurista',        null, 'mano_obra', 'm²', 0),
  ('art_mo_ceramico', 'forgevia', '', 'Mano de obra · Suelo cerámico',    null, 'mano_obra', 'm²', 0),
  ('art_mo_pintura',  'forgevia', '', 'Mano de obra · Pintura',           null, 'mano_obra', 'm²', 0),
  ('art_mo_alisado',  'forgevia', '', 'Mano de obra · Alisado',           null, 'mano_obra', 'm²', 0)
on conflict (id) do nothing;

-- ── Packs vacíos (edítalos en Banco de precios → Packs y añade artículos) ──
insert into partidas (id, tenant_id, nombre, unidad, descripcion, componentes) values
  ('pack_bano',        'forgevia', 'Baño',                'ud', 'Materiales básicos de un baño.',        '[]'::jsonb),
  ('pack_cocina',      'forgevia', 'Cocina',              'ud', 'Materiales básicos de una cocina.',     '[]'::jsonb),
  ('pack_font_bano',   'forgevia', 'Fontanería baño',     'ud', 'Fontanería de baño.',                   '[]'::jsonb),
  ('pack_font_cocina', 'forgevia', 'Fontanería cocina',   'ud', 'Fontanería de cocina.',                 '[]'::jsonb),
  ('pack_elec_bano',   'forgevia', 'Electricidad baño',   'ud', 'Electricidad de baño.',                 '[]'::jsonb),
  ('pack_elec_cocina', 'forgevia', 'Electricidad cocina', 'ud', 'Electricidad de cocina.',               '[]'::jsonb)
on conflict (id) do nothing;

-- Para borrar el scaffold:
-- delete from partidas  where id like 'pack_%';
-- delete from articulos where id like 'art_mo_%';


-- ═══════════════════════════════════════════════════════════════════════════
-- [8] reformas-catalogo.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- fichaloop · Librería de reformas (OPCIONAL) para FORGEVIA.
-- Artículos típicos (a precio 0, se rellenan con tus facturas) + packs por tipo
-- de obra, a partir del listado del cliente. Idempotente. Requiere presupuestos.sql.
-- Borrar: delete from partidas where id like 'pack_r_%'; delete from articulos where id like 'art_r_%';

insert into articulos (id, tenant_id, referencia, nombre, proveedor_id, categoria, unidad, coste) values
  ('art_r_plato_de_ducha','forgevia','','Plato de ducha',null,'material','ud',0),
  ('art_r_mampara','forgevia','','Mampara',null,'material','ud',0),
  ('art_r_valvula_desague_de_ducha','forgevia','','Válvula/desagüe de ducha',null,'material','ud',0),
  ('art_r_griferia_de_ducha','forgevia','','Grifería de ducha',null,'material','ud',0),
  ('art_r_columna_o_conjunto_de_ducha','forgevia','','Columna o conjunto de ducha',null,'material','ud',0),
  ('art_r_inodoro','forgevia','','Inodoro',null,'material','ud',0),
  ('art_r_mueble_de_lavabo','forgevia','','Mueble de lavabo',null,'material','ud',0),
  ('art_r_lavabo','forgevia','','Lavabo',null,'material','ud',0),
  ('art_r_grifo_de_lavabo','forgevia','','Grifo de lavabo',null,'material','ud',0),
  ('art_r_espejo','forgevia','','Espejo',null,'material','ud',0),
  ('art_r_sifon_y_valvula_de_lavabo','forgevia','','Sifón y válvula de lavabo',null,'material','ud',0),
  ('art_r_tuberia_multicapa_ppr_y_accesorios','forgevia','','Tubería multicapa/PPR y accesorios',null,'material','ml',0),
  ('art_r_tuberia_pvc_para_desagues_y_accesorios','forgevia','','Tubería PVC para desagües y accesorios',null,'material','ml',0),
  ('art_r_llaves_de_escuadra','forgevia','','Llaves de escuadra',null,'material','ud',0),
  ('art_r_alicatado_azulejo','forgevia','','Alicatado/azulejo',null,'material','m²',0),
  ('art_r_pavimento','forgevia','','Pavimento',null,'material','m²',0),
  ('art_r_adhesivo_cementoso','forgevia','','Adhesivo cementoso',null,'material','ud',0),
  ('art_r_mortero','forgevia','','Mortero',null,'material','ud',0),
  ('art_r_lechada_material_de_juntas','forgevia','','Lechada/material de juntas',null,'material','ud',0),
  ('art_r_sistema_de_impermeabilizacion','forgevia','','Sistema de impermeabilización',null,'material','ud',0),
  ('art_r_silicona_sanitaria','forgevia','','Silicona sanitaria',null,'material','ud',0),
  ('art_r_perfiles_y_remates','forgevia','','Perfiles y remates',null,'material','ud',0),
  ('art_r_pladur_hidrofugo','forgevia','','Pladur hidrófugo',null,'material','m²',0),
  ('art_r_perfileria_de_pladur','forgevia','','Perfilería de pladur',null,'material','m²',0),
  ('art_r_tornilleria','forgevia','','Tornillería',null,'material','ud',0),
  ('art_r_masilla_y_cinta','forgevia','','Masilla y cinta',null,'material','ud',0),
  ('art_r_downlights_focos','forgevia','','Downlights/focos',null,'material','ud',0),
  ('art_r_interruptores_y_mecanismos','forgevia','','Interruptores y mecanismos',null,'material','ud',0),
  ('art_r_cableado_electrico','forgevia','','Cableado eléctrico',null,'material','ml',0),
  ('art_r_tubo_corrugado','forgevia','','Tubo corrugado',null,'material','ml',0),
  ('art_r_cajas_electricas','forgevia','','Cajas eléctricas',null,'material','ud',0),
  ('art_r_extractor_de_bano','forgevia','','Extractor de baño',null,'material','ud',0),
  ('art_r_pintura_para_techo','forgevia','','Pintura para techo',null,'material','m²',0),
  ('art_r_muebles_bajos','forgevia','','Muebles bajos',null,'material','ud',0),
  ('art_r_muebles_altos','forgevia','','Muebles altos',null,'material','ud',0),
  ('art_r_columnas','forgevia','','Columnas',null,'material','ud',0),
  ('art_r_encimera','forgevia','','Encimera',null,'material','ud',0),
  ('art_r_copete_y_remates','forgevia','','Copete y remates',null,'material','ud',0),
  ('art_r_fregadero','forgevia','','Fregadero',null,'material','ud',0),
  ('art_r_grifo_de_cocina','forgevia','','Grifo de cocina',null,'material','ud',0),
  ('art_r_sifon_y_desague','forgevia','','Sifón y desagüe',null,'material','ud',0),
  ('art_r_tuberias_de_agua_y_accesorios','forgevia','','Tuberías de agua y accesorios',null,'material','ml',0),
  ('art_r_pvc_de_desague','forgevia','','PVC de desagüe',null,'material','ud',0),
  ('art_r_placa_de_cocina','forgevia','','Placa de cocina',null,'material','m²',0),
  ('art_r_horno','forgevia','','Horno',null,'material','ud',0),
  ('art_r_campana_extractor','forgevia','','Campana/extractor',null,'material','ud',0),
  ('art_r_lavavajillas','forgevia','','Lavavajillas',null,'material','ud',0),
  ('art_r_frigorifico','forgevia','','Frigorífico',null,'material','ud',0),
  ('art_r_microondas','forgevia','','Microondas',null,'material','ud',0),
  ('art_r_revestimiento_frontal_de_cocina','forgevia','','Revestimiento/frontal de cocina',null,'material','m²',0),
  ('art_r_material_de_juntas','forgevia','','Material de juntas',null,'material','ud',0),
  ('art_r_silicona','forgevia','','Silicona',null,'material','ud',0),
  ('art_r_enchufes','forgevia','','Enchufes',null,'material','ud',0),
  ('art_r_interruptores','forgevia','','Interruptores',null,'material','ud',0),
  ('art_r_cableado','forgevia','','Cableado',null,'material','ml',0),
  ('art_r_cajas_de_mecanismos','forgevia','','Cajas de mecanismos',null,'material','ud',0),
  ('art_r_cajas_de_derivacion','forgevia','','Cajas de derivación',null,'material','ud',0),
  ('art_r_protecciones_electricas','forgevia','','Protecciones eléctricas',null,'material','ud',0),
  ('art_r_iluminacion_de_techo','forgevia','','Iluminación de techo',null,'material','ud',0),
  ('art_r_iluminacion_bajo_muebles','forgevia','','Iluminación bajo muebles',null,'material','ud',0),
  ('art_r_pintura','forgevia','','Pintura',null,'material','m²',0),
  ('art_r_masilla_y_materiales_de_acabado','forgevia','','Masilla y materiales de acabado',null,'material','ud',0),
  ('art_r_material_de_proteccion_y_demolicion','forgevia','','Material de protección y demolición',null,'material','ud',0),
  ('art_r_sacos_y_gestion_de_residuos','forgevia','','Sacos y gestión de residuos',null,'material','ud',0),
  ('art_r_contenedor','forgevia','','Contenedor',null,'material','ud',0),
  ('art_r_ladrillo','forgevia','','Ladrillo',null,'material','ud',0),
  ('art_r_bloques','forgevia','','Bloques',null,'material','ud',0),
  ('art_r_cemento','forgevia','','Cemento',null,'material','ud',0),
  ('art_r_arena','forgevia','','Arena',null,'material','ud',0),
  ('art_r_yeso','forgevia','','Yeso',null,'material','ud',0),
  ('art_r_pasta_de_agarre','forgevia','','Pasta de agarre',null,'material','ud',0),
  ('art_r_placas_de_pladur','forgevia','','Placas de pladur',null,'material','m²',0),
  ('art_r_perfileria','forgevia','','Perfilería',null,'material','ml',0),
  ('art_r_aislamiento_termico_acustico','forgevia','','Aislamiento térmico/acústico',null,'material','m²',0),
  ('art_r_cintas_y_pastas_de_juntas','forgevia','','Cintas y pastas de juntas',null,'material','ud',0),
  ('art_r_pavimento_ceramico_porcelanico_o_tarima','forgevia','','Pavimento cerámico/porcelánico o tarima',null,'material','m²',0),
  ('art_r_rodapies','forgevia','','Rodapiés',null,'material','ml',0),
  ('art_r_adhesivos','forgevia','','Adhesivos',null,'material','ud',0),
  ('art_r_material_de_rejuntado','forgevia','','Material de rejuntado',null,'material','ud',0),
  ('art_r_material_de_nivelacion','forgevia','','Material de nivelación',null,'material','ud',0),
  ('art_r_puertas_interiores','forgevia','','Puertas interiores',null,'material','ud',0),
  ('art_r_premarcos','forgevia','','Premarcos',null,'material','ud',0),
  ('art_r_manillas_y_herrajes','forgevia','','Manillas y herrajes',null,'material','ud',0),
  ('art_r_armarios','forgevia','','Armarios',null,'material','ud',0),
  ('art_r_imprimacion','forgevia','','Imprimación',null,'material','m²',0),
  ('art_r_masillas','forgevia','','Masillas',null,'material','ud',0),
  ('art_r_selladores','forgevia','','Selladores',null,'material','ud',0),
  ('art_r_material_completo_de_fontaneria','forgevia','','Material completo de fontanería',null,'material','ud',0),
  ('art_r_tuberias_de_agua','forgevia','','Tuberías de agua',null,'material','ml',0),
  ('art_r_desagues_pvc','forgevia','','Desagües PVC',null,'material','ud',0),
  ('art_r_llaves_de_corte','forgevia','','Llaves de corte',null,'material','ud',0),
  ('art_r_colectores','forgevia','','Colectores',null,'material','ud',0),
  ('art_r_sanitarios','forgevia','','Sanitarios',null,'material','ud',0),
  ('art_r_griferias','forgevia','','Griferías',null,'material','ud',0),
  ('art_r_material_electrico_completo','forgevia','','Material eléctrico completo',null,'material','ud',0),
  ('art_r_cuadro_electrico','forgevia','','Cuadro eléctrico',null,'material','ud',0),
  ('art_r_iluminacion','forgevia','','Iluminación',null,'material','ud',0),
  ('art_r_mecanismos','forgevia','','Mecanismos',null,'material','ud',0),
  ('art_r_telecomunicaciones','forgevia','','Telecomunicaciones',null,'material','ud',0),
  ('art_r_material_de_climatizacion','forgevia','','Material de climatización',null,'material','ud',0),
  ('art_r_conductos_tuberias_de_climatizacion','forgevia','','Conductos/tuberías de climatización',null,'material','ml',0),
  ('art_r_rejillas_y_difusores','forgevia','','Rejillas y difusores',null,'material','ud',0),
  ('art_r_material_de_ventilacion','forgevia','','Material de ventilación',null,'material','ud',0),
  ('art_r_termo_caldera_aerotermia','forgevia','','Termo/caldera/aerotermia',null,'material','ud',0),
  ('art_r_ventanas_y_carpinteria_exterior','forgevia','','Ventanas y carpintería exterior',null,'material','ud',0),
  ('art_r_siliconas_espumas_fijaciones_y_consumibles','forgevia','','Siliconas, espumas, fijaciones y consumibles',null,'material','ud',0),
  ('art_r_envolvente_armario_electrico','forgevia','','Envolvente/armario eléctrico',null,'material','ud',0),
  ('art_r_iga','forgevia','','IGA',null,'material','ud',0),
  ('art_r_interruptores_diferenciales','forgevia','','Interruptores diferenciales',null,'material','ud',0),
  ('art_r_magnetotermicos','forgevia','','Magnetotérmicos',null,'material','ud',0),
  ('art_r_protector_contra_sobretensiones','forgevia','','Protector contra sobretensiones',null,'material','ud',0),
  ('art_r_contactores','forgevia','','Contactores',null,'material','ud',0),
  ('art_r_peines_de_conexion','forgevia','','Peines de conexión',null,'material','ud',0),
  ('art_r_borneros','forgevia','','Borneros',null,'material','ud',0),
  ('art_r_cableado_de_diferentes_secciones','forgevia','','Cableado de diferentes secciones',null,'material','ml',0),
  ('art_r_cable_libre_de_halogenos','forgevia','','Cable libre de halógenos',null,'material','ml',0),
  ('art_r_tubo_rigido','forgevia','','Tubo rígido',null,'material','ml',0),
  ('art_r_bandeja_portacables','forgevia','','Bandeja portacables',null,'material','ml',0),
  ('art_r_canaleta','forgevia','','Canaleta',null,'material','ml',0),
  ('art_r_cajas_de_registro','forgevia','','Cajas de registro',null,'material','ud',0),
  ('art_r_conmutadores','forgevia','','Conmutadores',null,'material','ud',0),
  ('art_r_pulsadores','forgevia','','Pulsadores',null,'material','ud',0),
  ('art_r_tomas_industriales','forgevia','','Tomas industriales',null,'material','ud',0),
  ('art_r_lineas_independientes_para_maquinaria','forgevia','','Líneas independientes para maquinaria',null,'material','ml',0),
  ('art_r_lineas_de_climatizacion','forgevia','','Líneas de climatización',null,'material','ml',0),
  ('art_r_linea_de_iluminacion','forgevia','','Línea de iluminación',null,'material','ml',0),
  ('art_r_lineas_de_fuerza','forgevia','','Líneas de fuerza',null,'material','ml',0),
  ('art_r_linea_de_emergencia','forgevia','','Línea de emergencia',null,'material','ml',0),
  ('art_r_alumbrado_normal','forgevia','','Alumbrado normal',null,'material','ud',0),
  ('art_r_alumbrado_de_emergencia','forgevia','','Alumbrado de emergencia',null,'material','ud',0),
  ('art_r_senalizacion_de_salida_emergencia','forgevia','','Señalización de salida/emergencia',null,'material','ud',0),
  ('art_r_detectores_de_presencia','forgevia','','Detectores de presencia',null,'material','ud',0),
  ('art_r_temporizadores','forgevia','','Temporizadores',null,'material','ud',0),
  ('art_r_cable_de_tierra','forgevia','','Cable de tierra',null,'material','ml',0),
  ('art_r_sistema_de_puesta_a_tierra','forgevia','','Sistema de puesta a tierra',null,'material','ud',0),
  ('art_r_regletas_y_bornes','forgevia','','Regletas y bornes',null,'material','ud',0),
  ('art_r_prensaestopas','forgevia','','Prensaestopas',null,'material','ud',0),
  ('art_r_terminales_punteras','forgevia','','Terminales/punteras',null,'material','ud',0),
  ('art_r_bridas_y_fijaciones','forgevia','','Bridas y fijaciones',null,'material','ud',0),
  ('art_r_cable_de_red','forgevia','','Cable de red',null,'material','ml',0),
  ('art_r_tomas_rj45','forgevia','','Tomas RJ45',null,'material','ud',0),
  ('art_r_rack','forgevia','','Rack',null,'material','ud',0),
  ('art_r_material_auxiliar_y_consumibles','forgevia','','Material auxiliar y consumibles',null,'material','ud',0),
  ('art_r_protector_de_sobretensiones','forgevia','','Protector de sobretensiones',null,'material','ud',0),
  ('art_r_diferenciales','forgevia','','Diferenciales',null,'material','ud',0),
  ('art_r_peines_y_borneros','forgevia','','Peines y borneros',null,'material','ud',0),
  ('art_r_cableado_electrico_de_distintas_secciones','forgevia','','Cableado eléctrico de distintas secciones',null,'material','ml',0),
  ('art_r_cruzamientos','forgevia','','Cruzamientos',null,'material','ud',0),
  ('art_r_tomas_de_television','forgevia','','Tomas de televisión',null,'material','ud',0),
  ('art_r_tomas_de_datos_rj45','forgevia','','Tomas de datos/RJ45',null,'material','ud',0),
  ('art_r_tomas_de_telefono','forgevia','','Tomas de teléfono',null,'material','ud',0),
  ('art_r_puntos_de_luz','forgevia','','Puntos de luz',null,'material','ud',0),
  ('art_r_portalamparas_conectores','forgevia','','Portalámparas/conectores',null,'material','ud',0),
  ('art_r_downlights_focos_luminarias','forgevia','','Downlights/focos/luminarias',null,'material','ud',0),
  ('art_r_linea_de_enchufes_generales','forgevia','','Línea de enchufes generales',null,'material','ml',0),
  ('art_r_linea_de_cocina_y_horno','forgevia','','Línea de cocina y horno',null,'material','ml',0),
  ('art_r_linea_de_lavadora','forgevia','','Línea de lavadora',null,'material','ml',0),
  ('art_r_linea_de_lavavajillas','forgevia','','Línea de lavavajillas',null,'material','ml',0),
  ('art_r_linea_de_termo_electrico','forgevia','','Línea de termo eléctrico',null,'material','ml',0),
  ('art_r_linea_de_climatizacion','forgevia','','Línea de climatización',null,'material','ml',0),
  ('art_r_lineas_de_banos_y_auxiliares','forgevia','','Líneas de baños y auxiliares',null,'material','ml',0),
  ('art_r_extractores','forgevia','','Extractores',null,'material','ud',0),
  ('art_r_terminales','forgevia','','Terminales',null,'material','ud',0),
  ('art_r_bridas','forgevia','','Bridas',null,'material','ud',0),
  ('art_r_grapas_y_fijaciones','forgevia','','Grapas y fijaciones',null,'material','ud',0),
  ('art_r_material_de_conexion_y_consumibles','forgevia','','Material de conexión y consumibles',null,'material','ud',0)
on conflict (id) do nothing;

insert into partidas (id, tenant_id, nombre, unidad, descripcion, componentes) values
  ('pack_r_bano_tipico','forgevia','Baño típico','ud','Materiales típicos de: Baño típico.','[{"id":"c0","articuloId":"art_r_plato_de_ducha","cantidad":1},{"id":"c1","articuloId":"art_r_mampara","cantidad":1},{"id":"c2","articuloId":"art_r_valvula_desague_de_ducha","cantidad":1},{"id":"c3","articuloId":"art_r_griferia_de_ducha","cantidad":1},{"id":"c4","articuloId":"art_r_columna_o_conjunto_de_ducha","cantidad":1},{"id":"c5","articuloId":"art_r_inodoro","cantidad":1},{"id":"c6","articuloId":"art_r_mueble_de_lavabo","cantidad":1},{"id":"c7","articuloId":"art_r_lavabo","cantidad":1},{"id":"c8","articuloId":"art_r_grifo_de_lavabo","cantidad":1},{"id":"c9","articuloId":"art_r_espejo","cantidad":1},{"id":"c10","articuloId":"art_r_sifon_y_valvula_de_lavabo","cantidad":1},{"id":"c11","articuloId":"art_r_tuberia_multicapa_ppr_y_accesorios","cantidad":1},{"id":"c12","articuloId":"art_r_tuberia_pvc_para_desagues_y_accesorios","cantidad":1},{"id":"c13","articuloId":"art_r_llaves_de_escuadra","cantidad":1},{"id":"c14","articuloId":"art_r_alicatado_azulejo","cantidad":1},{"id":"c15","articuloId":"art_r_pavimento","cantidad":1},{"id":"c16","articuloId":"art_r_adhesivo_cementoso","cantidad":1},{"id":"c17","articuloId":"art_r_mortero","cantidad":1},{"id":"c18","articuloId":"art_r_lechada_material_de_juntas","cantidad":1},{"id":"c19","articuloId":"art_r_sistema_de_impermeabilizacion","cantidad":1},{"id":"c20","articuloId":"art_r_silicona_sanitaria","cantidad":1},{"id":"c21","articuloId":"art_r_perfiles_y_remates","cantidad":1},{"id":"c22","articuloId":"art_r_pladur_hidrofugo","cantidad":1},{"id":"c23","articuloId":"art_r_perfileria_de_pladur","cantidad":1},{"id":"c24","articuloId":"art_r_tornilleria","cantidad":1},{"id":"c25","articuloId":"art_r_masilla_y_cinta","cantidad":1},{"id":"c26","articuloId":"art_r_downlights_focos","cantidad":1},{"id":"c27","articuloId":"art_r_interruptores_y_mecanismos","cantidad":1},{"id":"c28","articuloId":"art_r_cableado_electrico","cantidad":1},{"id":"c29","articuloId":"art_r_tubo_corrugado","cantidad":1},{"id":"c30","articuloId":"art_r_cajas_electricas","cantidad":1},{"id":"c31","articuloId":"art_r_extractor_de_bano","cantidad":1},{"id":"c32","articuloId":"art_r_pintura_para_techo","cantidad":1}]'::jsonb),
  ('pack_r_cocina','forgevia','Cocina','ud','Materiales típicos de: Cocina.','[{"id":"c0","articuloId":"art_r_muebles_bajos","cantidad":1},{"id":"c1","articuloId":"art_r_muebles_altos","cantidad":1},{"id":"c2","articuloId":"art_r_columnas","cantidad":1},{"id":"c3","articuloId":"art_r_encimera","cantidad":1},{"id":"c4","articuloId":"art_r_copete_y_remates","cantidad":1},{"id":"c5","articuloId":"art_r_fregadero","cantidad":1},{"id":"c6","articuloId":"art_r_grifo_de_cocina","cantidad":1},{"id":"c7","articuloId":"art_r_sifon_y_desague","cantidad":1},{"id":"c8","articuloId":"art_r_llaves_de_escuadra","cantidad":1},{"id":"c9","articuloId":"art_r_tuberias_de_agua_y_accesorios","cantidad":1},{"id":"c10","articuloId":"art_r_pvc_de_desague","cantidad":1},{"id":"c11","articuloId":"art_r_placa_de_cocina","cantidad":1},{"id":"c12","articuloId":"art_r_horno","cantidad":1},{"id":"c13","articuloId":"art_r_campana_extractor","cantidad":1},{"id":"c14","articuloId":"art_r_lavavajillas","cantidad":1},{"id":"c15","articuloId":"art_r_frigorifico","cantidad":1},{"id":"c16","articuloId":"art_r_microondas","cantidad":1},{"id":"c17","articuloId":"art_r_revestimiento_frontal_de_cocina","cantidad":1},{"id":"c18","articuloId":"art_r_pavimento","cantidad":1},{"id":"c19","articuloId":"art_r_adhesivo_cementoso","cantidad":1},{"id":"c20","articuloId":"art_r_material_de_juntas","cantidad":1},{"id":"c21","articuloId":"art_r_silicona","cantidad":1},{"id":"c22","articuloId":"art_r_enchufes","cantidad":1},{"id":"c23","articuloId":"art_r_interruptores","cantidad":1},{"id":"c24","articuloId":"art_r_cableado","cantidad":1},{"id":"c25","articuloId":"art_r_tubo_corrugado","cantidad":1},{"id":"c26","articuloId":"art_r_cajas_de_mecanismos","cantidad":1},{"id":"c27","articuloId":"art_r_cajas_de_derivacion","cantidad":1},{"id":"c28","articuloId":"art_r_protecciones_electricas","cantidad":1},{"id":"c29","articuloId":"art_r_iluminacion_de_techo","cantidad":1},{"id":"c30","articuloId":"art_r_iluminacion_bajo_muebles","cantidad":1},{"id":"c31","articuloId":"art_r_pintura","cantidad":1},{"id":"c32","articuloId":"art_r_masilla_y_materiales_de_acabado","cantidad":1}]'::jsonb),
  ('pack_r_reforma_completa','forgevia','Reforma completa','ud','Materiales típicos de: Reforma completa.','[{"id":"c0","articuloId":"art_r_material_de_proteccion_y_demolicion","cantidad":1},{"id":"c1","articuloId":"art_r_sacos_y_gestion_de_residuos","cantidad":1},{"id":"c2","articuloId":"art_r_contenedor","cantidad":1},{"id":"c3","articuloId":"art_r_ladrillo","cantidad":1},{"id":"c4","articuloId":"art_r_bloques","cantidad":1},{"id":"c5","articuloId":"art_r_mortero","cantidad":1},{"id":"c6","articuloId":"art_r_cemento","cantidad":1},{"id":"c7","articuloId":"art_r_arena","cantidad":1},{"id":"c8","articuloId":"art_r_yeso","cantidad":1},{"id":"c9","articuloId":"art_r_pasta_de_agarre","cantidad":1},{"id":"c10","articuloId":"art_r_placas_de_pladur","cantidad":1},{"id":"c11","articuloId":"art_r_pladur_hidrofugo","cantidad":1},{"id":"c12","articuloId":"art_r_perfileria","cantidad":1},{"id":"c13","articuloId":"art_r_aislamiento_termico_acustico","cantidad":1},{"id":"c14","articuloId":"art_r_tornilleria","cantidad":1},{"id":"c15","articuloId":"art_r_cintas_y_pastas_de_juntas","cantidad":1},{"id":"c16","articuloId":"art_r_pavimento_ceramico_porcelanico_o_tarima","cantidad":1},{"id":"c17","articuloId":"art_r_rodapies","cantidad":1},{"id":"c18","articuloId":"art_r_adhesivos","cantidad":1},{"id":"c19","articuloId":"art_r_material_de_rejuntado","cantidad":1},{"id":"c20","articuloId":"art_r_material_de_nivelacion","cantidad":1},{"id":"c21","articuloId":"art_r_puertas_interiores","cantidad":1},{"id":"c22","articuloId":"art_r_premarcos","cantidad":1},{"id":"c23","articuloId":"art_r_manillas_y_herrajes","cantidad":1},{"id":"c24","articuloId":"art_r_armarios","cantidad":1},{"id":"c25","articuloId":"art_r_pintura","cantidad":1},{"id":"c26","articuloId":"art_r_imprimacion","cantidad":1},{"id":"c27","articuloId":"art_r_masillas","cantidad":1},{"id":"c28","articuloId":"art_r_selladores","cantidad":1},{"id":"c29","articuloId":"art_r_material_completo_de_fontaneria","cantidad":1},{"id":"c30","articuloId":"art_r_tuberias_de_agua","cantidad":1},{"id":"c31","articuloId":"art_r_desagues_pvc","cantidad":1},{"id":"c32","articuloId":"art_r_llaves_de_corte","cantidad":1},{"id":"c33","articuloId":"art_r_colectores","cantidad":1},{"id":"c34","articuloId":"art_r_sanitarios","cantidad":1},{"id":"c35","articuloId":"art_r_griferias","cantidad":1},{"id":"c36","articuloId":"art_r_material_electrico_completo","cantidad":1},{"id":"c37","articuloId":"art_r_cuadro_electrico","cantidad":1},{"id":"c38","articuloId":"art_r_iluminacion","cantidad":1},{"id":"c39","articuloId":"art_r_mecanismos","cantidad":1},{"id":"c40","articuloId":"art_r_telecomunicaciones","cantidad":1},{"id":"c41","articuloId":"art_r_material_de_climatizacion","cantidad":1},{"id":"c42","articuloId":"art_r_conductos_tuberias_de_climatizacion","cantidad":1},{"id":"c43","articuloId":"art_r_rejillas_y_difusores","cantidad":1},{"id":"c44","articuloId":"art_r_material_de_ventilacion","cantidad":1},{"id":"c45","articuloId":"art_r_termo_caldera_aerotermia","cantidad":1},{"id":"c46","articuloId":"art_r_ventanas_y_carpinteria_exterior","cantidad":1},{"id":"c47","articuloId":"art_r_siliconas_espumas_fijaciones_y_consumibles","cantidad":1}]'::jsonb),
  ('pack_r_electricidad_de_local','forgevia','Electricidad de local','ud','Materiales típicos de: Electricidad de local.','[{"id":"c0","articuloId":"art_r_cuadro_electrico","cantidad":1},{"id":"c1","articuloId":"art_r_envolvente_armario_electrico","cantidad":1},{"id":"c2","articuloId":"art_r_iga","cantidad":1},{"id":"c3","articuloId":"art_r_interruptores_diferenciales","cantidad":1},{"id":"c4","articuloId":"art_r_magnetotermicos","cantidad":1},{"id":"c5","articuloId":"art_r_protector_contra_sobretensiones","cantidad":1},{"id":"c6","articuloId":"art_r_contactores","cantidad":1},{"id":"c7","articuloId":"art_r_peines_de_conexion","cantidad":1},{"id":"c8","articuloId":"art_r_borneros","cantidad":1},{"id":"c9","articuloId":"art_r_cableado_de_diferentes_secciones","cantidad":1},{"id":"c10","articuloId":"art_r_cable_libre_de_halogenos","cantidad":1},{"id":"c11","articuloId":"art_r_tubo_corrugado","cantidad":1},{"id":"c12","articuloId":"art_r_tubo_rigido","cantidad":1},{"id":"c13","articuloId":"art_r_bandeja_portacables","cantidad":1},{"id":"c14","articuloId":"art_r_canaleta","cantidad":1},{"id":"c15","articuloId":"art_r_cajas_de_derivacion","cantidad":1},{"id":"c16","articuloId":"art_r_cajas_de_mecanismos","cantidad":1},{"id":"c17","articuloId":"art_r_cajas_de_registro","cantidad":1},{"id":"c18","articuloId":"art_r_enchufes","cantidad":1},{"id":"c19","articuloId":"art_r_interruptores","cantidad":1},{"id":"c20","articuloId":"art_r_conmutadores","cantidad":1},{"id":"c21","articuloId":"art_r_pulsadores","cantidad":1},{"id":"c22","articuloId":"art_r_tomas_industriales","cantidad":1},{"id":"c23","articuloId":"art_r_lineas_independientes_para_maquinaria","cantidad":1},{"id":"c24","articuloId":"art_r_lineas_de_climatizacion","cantidad":1},{"id":"c25","articuloId":"art_r_linea_de_iluminacion","cantidad":1},{"id":"c26","articuloId":"art_r_lineas_de_fuerza","cantidad":1},{"id":"c27","articuloId":"art_r_linea_de_emergencia","cantidad":1},{"id":"c28","articuloId":"art_r_alumbrado_normal","cantidad":1},{"id":"c29","articuloId":"art_r_alumbrado_de_emergencia","cantidad":1},{"id":"c30","articuloId":"art_r_senalizacion_de_salida_emergencia","cantidad":1},{"id":"c31","articuloId":"art_r_detectores_de_presencia","cantidad":1},{"id":"c32","articuloId":"art_r_temporizadores","cantidad":1},{"id":"c33","articuloId":"art_r_cable_de_tierra","cantidad":1},{"id":"c34","articuloId":"art_r_sistema_de_puesta_a_tierra","cantidad":1},{"id":"c35","articuloId":"art_r_regletas_y_bornes","cantidad":1},{"id":"c36","articuloId":"art_r_prensaestopas","cantidad":1},{"id":"c37","articuloId":"art_r_terminales_punteras","cantidad":1},{"id":"c38","articuloId":"art_r_bridas_y_fijaciones","cantidad":1},{"id":"c39","articuloId":"art_r_cable_de_red","cantidad":1},{"id":"c40","articuloId":"art_r_tomas_rj45","cantidad":1},{"id":"c41","articuloId":"art_r_rack","cantidad":1},{"id":"c42","articuloId":"art_r_material_auxiliar_y_consumibles","cantidad":1}]'::jsonb),
  ('pack_r_electricidad_de_piso','forgevia','Electricidad de piso','ud','Materiales típicos de: Electricidad de piso.','[{"id":"c0","articuloId":"art_r_cuadro_electrico","cantidad":1},{"id":"c1","articuloId":"art_r_iga","cantidad":1},{"id":"c2","articuloId":"art_r_protector_de_sobretensiones","cantidad":1},{"id":"c3","articuloId":"art_r_diferenciales","cantidad":1},{"id":"c4","articuloId":"art_r_magnetotermicos","cantidad":1},{"id":"c5","articuloId":"art_r_peines_y_borneros","cantidad":1},{"id":"c6","articuloId":"art_r_cableado_electrico_de_distintas_secciones","cantidad":1},{"id":"c7","articuloId":"art_r_cable_de_tierra","cantidad":1},{"id":"c8","articuloId":"art_r_tubo_corrugado","cantidad":1},{"id":"c9","articuloId":"art_r_cajas_de_registro","cantidad":1},{"id":"c10","articuloId":"art_r_cajas_de_mecanismos","cantidad":1},{"id":"c11","articuloId":"art_r_enchufes","cantidad":1},{"id":"c12","articuloId":"art_r_interruptores","cantidad":1},{"id":"c13","articuloId":"art_r_conmutadores","cantidad":1},{"id":"c14","articuloId":"art_r_cruzamientos","cantidad":1},{"id":"c15","articuloId":"art_r_tomas_de_television","cantidad":1},{"id":"c16","articuloId":"art_r_tomas_de_datos_rj45","cantidad":1},{"id":"c17","articuloId":"art_r_tomas_de_telefono","cantidad":1},{"id":"c18","articuloId":"art_r_puntos_de_luz","cantidad":1},{"id":"c19","articuloId":"art_r_portalamparas_conectores","cantidad":1},{"id":"c20","articuloId":"art_r_downlights_focos_luminarias","cantidad":1},{"id":"c21","articuloId":"art_r_linea_de_iluminacion","cantidad":1},{"id":"c22","articuloId":"art_r_linea_de_enchufes_generales","cantidad":1},{"id":"c23","articuloId":"art_r_linea_de_cocina_y_horno","cantidad":1},{"id":"c24","articuloId":"art_r_linea_de_lavadora","cantidad":1},{"id":"c25","articuloId":"art_r_linea_de_lavavajillas","cantidad":1},{"id":"c26","articuloId":"art_r_linea_de_termo_electrico","cantidad":1},{"id":"c27","articuloId":"art_r_linea_de_climatizacion","cantidad":1},{"id":"c28","articuloId":"art_r_lineas_de_banos_y_auxiliares","cantidad":1},{"id":"c29","articuloId":"art_r_extractores","cantidad":1},{"id":"c30","articuloId":"art_r_regletas_y_bornes","cantidad":1},{"id":"c31","articuloId":"art_r_terminales","cantidad":1},{"id":"c32","articuloId":"art_r_bridas","cantidad":1},{"id":"c33","articuloId":"art_r_grapas_y_fijaciones","cantidad":1},{"id":"c34","articuloId":"art_r_material_de_conexion_y_consumibles","cantidad":1}]'::jsonb)
on conflict (id) do nothing;


-- ═══════════════════════════════════════════════════════════════════════════
-- [9] packs-gremios.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- fichaloop · Packs por gremio (OPCIONAL). REQUIERE haber ejecutado antes
-- reformas-catalogo.sql (usa sus artículos art_r_*). Idempotente.
-- Borrar: delete from partidas where id like 'pack_g_%';

insert into partidas (id, tenant_id, nombre, unidad, descripcion, componentes) values
  ('pack_g_fontaneria_bano','forgevia','Fontanería baño','ud','Pack por gremio: Fontanería baño.','[{"id":"c0","articuloId":"art_r_plato_de_ducha","cantidad":1},{"id":"c1","articuloId":"art_r_mampara","cantidad":1},{"id":"c2","articuloId":"art_r_valvula_desague_de_ducha","cantidad":1},{"id":"c3","articuloId":"art_r_griferia_de_ducha","cantidad":1},{"id":"c4","articuloId":"art_r_columna_o_conjunto_de_ducha","cantidad":1},{"id":"c5","articuloId":"art_r_inodoro","cantidad":1},{"id":"c6","articuloId":"art_r_mueble_de_lavabo","cantidad":1},{"id":"c7","articuloId":"art_r_lavabo","cantidad":1},{"id":"c8","articuloId":"art_r_grifo_de_lavabo","cantidad":1},{"id":"c9","articuloId":"art_r_sifon_y_valvula_de_lavabo","cantidad":1},{"id":"c10","articuloId":"art_r_tuberia_multicapa_ppr_y_accesorios","cantidad":1},{"id":"c11","articuloId":"art_r_tuberia_pvc_para_desagues_y_accesorios","cantidad":1},{"id":"c12","articuloId":"art_r_llaves_de_escuadra","cantidad":1},{"id":"c13","articuloId":"art_r_silicona_sanitaria","cantidad":1}]'::jsonb),
  ('pack_g_electricidad_bano','forgevia','Electricidad baño','ud','Pack por gremio: Electricidad baño.','[{"id":"c0","articuloId":"art_r_downlights_focos","cantidad":1},{"id":"c1","articuloId":"art_r_interruptores_y_mecanismos","cantidad":1},{"id":"c2","articuloId":"art_r_cableado_electrico","cantidad":1},{"id":"c3","articuloId":"art_r_tubo_corrugado","cantidad":1},{"id":"c4","articuloId":"art_r_cajas_electricas","cantidad":1},{"id":"c5","articuloId":"art_r_extractor_de_bano","cantidad":1}]'::jsonb),
  ('pack_g_fontaneria_cocina','forgevia','Fontanería cocina','ud','Pack por gremio: Fontanería cocina.','[{"id":"c0","articuloId":"art_r_fregadero","cantidad":1},{"id":"c1","articuloId":"art_r_grifo_de_cocina","cantidad":1},{"id":"c2","articuloId":"art_r_sifon_y_desague","cantidad":1},{"id":"c3","articuloId":"art_r_llaves_de_escuadra","cantidad":1},{"id":"c4","articuloId":"art_r_tuberias_de_agua_y_accesorios","cantidad":1},{"id":"c5","articuloId":"art_r_pvc_de_desague","cantidad":1},{"id":"c6","articuloId":"art_r_silicona","cantidad":1}]'::jsonb),
  ('pack_g_electricidad_cocina','forgevia','Electricidad cocina','ud','Pack por gremio: Electricidad cocina.','[{"id":"c0","articuloId":"art_r_enchufes","cantidad":1},{"id":"c1","articuloId":"art_r_interruptores","cantidad":1},{"id":"c2","articuloId":"art_r_cableado","cantidad":1},{"id":"c3","articuloId":"art_r_tubo_corrugado","cantidad":1},{"id":"c4","articuloId":"art_r_cajas_de_mecanismos","cantidad":1},{"id":"c5","articuloId":"art_r_cajas_de_derivacion","cantidad":1},{"id":"c6","articuloId":"art_r_protecciones_electricas","cantidad":1},{"id":"c7","articuloId":"art_r_iluminacion_de_techo","cantidad":1},{"id":"c8","articuloId":"art_r_iluminacion_bajo_muebles","cantidad":1}]'::jsonb),
  ('pack_g_pladur','forgevia','Pladur','ud','Pack por gremio: Pladur.','[{"id":"c0","articuloId":"art_r_placas_de_pladur","cantidad":1},{"id":"c1","articuloId":"art_r_pladur_hidrofugo","cantidad":1},{"id":"c2","articuloId":"art_r_perfileria","cantidad":1},{"id":"c3","articuloId":"art_r_perfileria_de_pladur","cantidad":1},{"id":"c4","articuloId":"art_r_tornilleria","cantidad":1},{"id":"c5","articuloId":"art_r_cintas_y_pastas_de_juntas","cantidad":1},{"id":"c6","articuloId":"art_r_masilla_y_cinta","cantidad":1},{"id":"c7","articuloId":"art_r_aislamiento_termico_acustico","cantidad":1}]'::jsonb),
  ('pack_g_pintura','forgevia','Pintura','ud','Pack por gremio: Pintura.','[{"id":"c0","articuloId":"art_r_pintura","cantidad":1},{"id":"c1","articuloId":"art_r_imprimacion","cantidad":1},{"id":"c2","articuloId":"art_r_masillas","cantidad":1},{"id":"c3","articuloId":"art_r_pintura_para_techo","cantidad":1}]'::jsonb),
  ('pack_g_alicatado_y_solado','forgevia','Alicatado y solado','ud','Pack por gremio: Alicatado y solado.','[{"id":"c0","articuloId":"art_r_alicatado_azulejo","cantidad":1},{"id":"c1","articuloId":"art_r_pavimento","cantidad":1},{"id":"c2","articuloId":"art_r_adhesivo_cementoso","cantidad":1},{"id":"c3","articuloId":"art_r_lechada_material_de_juntas","cantidad":1},{"id":"c4","articuloId":"art_r_perfiles_y_remates","cantidad":1},{"id":"c5","articuloId":"art_r_material_de_nivelacion","cantidad":1},{"id":"c6","articuloId":"art_r_material_de_rejuntado","cantidad":1},{"id":"c7","articuloId":"art_r_adhesivos","cantidad":1}]'::jsonb)
on conflict (id) do nothing;

