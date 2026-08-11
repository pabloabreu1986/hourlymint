-- fichaloop · Banco de precios con familia (gremio) y precios por proveedor.
-- `familia`: la pestaña del Excel de materiales (Baños, Fontanería…).
-- `precios`: array JSON [{proveedor, referencia, precioSinIva, precioConIva}]
-- para comparar Obramat / Leroy Merlin… El `coste` sigue siendo el unitario
-- usado en presupuestos (normalmente el más barato). Idempotente.
alter table public.articulos add column if not exists familia text;
alter table public.articulos add column if not exists precios jsonb;

comment on column public.articulos.familia is 'Familia/gremio (Baños, Fontanería…), de la pestaña del Excel.';
comment on column public.articulos.precios is 'Precios por proveedor: [{proveedor, referencia, precioSinIva, precioConIva}].';
