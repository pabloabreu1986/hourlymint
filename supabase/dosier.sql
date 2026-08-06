-- Dosier corporativo por cliente (white-label).
-- Se guarda como JSONB en la propia fila del tenant, igual que `web`.
-- Idempotente: se puede reejecutar sin efecto si la columna ya existe.

alter table public.tenants
  add column if not exists dosier jsonb;

comment on column public.tenants.dosier is
  'Dosier corporativo del cliente (portada, bloques y contraportada). Lo edita el admin de la empresa desde su panel; cada bloque activo es una página del PDF.';
