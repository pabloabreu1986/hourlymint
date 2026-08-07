-- ─────────────────────────────────────────────────────────────
-- fichaloop · DATOS DE EJEMPLO del módulo Presupuestos (FORGEVIA)
-- Para probar el flujo sin teclear. Todo lleva ids con "_demo_" para
-- poder borrarlo luego (ver el bloque final comentado).
-- Idempotente: on conflict do nothing.
-- ─────────────────────────────────────────────────────────────

-- Proveedor
insert into proveedores (id, tenant_id, nombre, cif, telefono, email) values
  ('prov_demo_obramat', 'forgevia', 'Obramat', 'A00000000', '900 000 000', 'pedidos@obramat.es')
on conflict (id) do nothing;

-- Artículos (precios aproximados de referencia)
insert into articulos (id, tenant_id, referencia, nombre, proveedor_id, categoria, unidad, coste) values
  ('art_demo_gres',    'forgevia', 'GRES-60',  'Gres porcelánico baño',       'prov_demo_obramat', 'material',  'm²', 18.50),
  ('art_demo_pladur',  'forgevia', 'PLAD-HID', 'Placa pladur hidrófugo',      'prov_demo_obramat', 'material',  'm²',  9.20),
  ('art_demo_wc',      'forgevia', 'WC-STD',   'Inodoro con cisterna',        'prov_demo_obramat', 'material',  'ud', 95.00),
  ('art_demo_lavabo',  'forgevia', 'LAV-PED',  'Lavabo con pedestal',         'prov_demo_obramat', 'material',  'ud', 78.00),
  ('art_demo_plato',   'forgevia', 'PLATO-80', 'Plato de ducha resina 80x80', 'prov_demo_obramat', 'material',  'ud', 130.00),
  ('art_demo_luz',     'forgevia', 'LED-EMP',  'Foco LED empotrable',         'prov_demo_obramat', 'material',  'ud', 12.00),
  ('art_demo_oficial', 'forgevia', 'MO-OF1',   'Oficial 1ª',                  null,                'mano_obra', 'h',  22.00)
on conflict (id) do nothing;

-- Receta "Baño 4×4 con plato de ducha" (unidad = ud)
insert into partidas (id, tenant_id, nombre, unidad, descripcion, componentes) values
  ('part_demo_bano', 'forgevia', 'Baño 4×4 con plato de ducha', 'ud',
   'Reforma completa de baño de 4x4 m con plato de ducha.',
   '[
     {"id":"c1","articuloId":"art_demo_gres","cantidad":16},
     {"id":"c2","articuloId":"art_demo_pladur","cantidad":24},
     {"id":"c3","articuloId":"art_demo_wc","cantidad":1},
     {"id":"c4","articuloId":"art_demo_lavabo","cantidad":1},
     {"id":"c5","articuloId":"art_demo_plato","cantidad":1},
     {"id":"c6","articuloId":"art_demo_luz","cantidad":4},
     {"id":"c7","articuloId":"art_demo_oficial","cantidad":24}
   ]'::jsonb)
on conflict (id) do nothing;

-- Plantillas de disclaimer
insert into disclaimers (id, tenant_id, titulo, texto) values
  ('dis_demo_visita', 'forgevia', 'Pendiente de visita',
   'Presupuesto orientativo, pendiente de confirmar con visita de obra y mediciones exactas.'),
  ('dis_demo_validez', 'forgevia', 'Validez',
   'Validez del presupuesto: 30 días desde la fecha de emisión. IVA no incluido.')
on conflict (id) do nothing;

-- ── Para borrar los datos de ejemplo cuando quieras (descomenta y ejecuta):
-- delete from partidas    where id like 'part_demo_%';
-- delete from articulos   where id like 'art_demo_%';
-- delete from proveedores where id like 'prov_demo_%';
-- delete from disclaimers where id like 'dis_demo_%';
