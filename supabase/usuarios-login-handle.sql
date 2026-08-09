-- fichaloop · Usuario corto de login (handle), separado del nombre completo.
-- El nombre completo (legal) se usa en documentos; el `usuario` es el login
-- corto, autogenerado del nombre. Idempotente.
alter table public.usuarios add column if not exists usuario text;

comment on column public.usuarios.usuario is
  'Usuario corto de login, autogenerado del nombre (ver lib/usuario-handle). Único por empresa. Vacío = se entra por el nombre completo.';
