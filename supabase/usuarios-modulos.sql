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
