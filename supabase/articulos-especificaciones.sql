-- fichaloop · Ficha técnica de los artículos del banco de precios.
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
-- La IA la rellena al escanear facturas (fabricante, medidas, normas…); el
-- resto se edita a mano en el artículo.

alter table articulos add column if not exists especificaciones text;
