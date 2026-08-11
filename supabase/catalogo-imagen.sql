-- fichaloop · Foto del producto en el banco de precios (artículos).
-- La chica pega la imagen desde la web del proveedor (Obramat…) o la sube;
-- se guarda en un bucket público de Storage y la columna guarda su URL.
-- Idempotente.

-- 1) Columna con la URL de la imagen.
alter table public.articulos add column if not exists imagen text;
comment on column public.articulos.imagen is
  'URL de la foto del producto (bucket público catalogo) o data URL en modo mock.';

-- 2) Bucket público para las fotos del catálogo.
insert into storage.buckets (id, name, public)
values ('catalogo', 'catalogo', true)
on conflict (id) do update set public = true;

-- 3) Políticas de acceso al bucket (lectura pública; alta/baja para la app).
drop policy if exists catalogo_select on storage.objects;
drop policy if exists catalogo_insert on storage.objects;
drop policy if exists catalogo_delete on storage.objects;
create policy catalogo_select on storage.objects
  for select to anon, authenticated using (bucket_id = 'catalogo');
create policy catalogo_insert on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'catalogo');
create policy catalogo_delete on storage.objects
  for delete to anon, authenticated using (bucket_id = 'catalogo');
