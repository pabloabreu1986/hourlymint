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
