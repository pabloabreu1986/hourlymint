-- fichaloop · Datos fiscales/legales del tenant para presupuestos y facturas.
-- Razón social, NIF, domicilio, IBAN, forma de pago, IVA por defecto y texto
-- legal (RGPD). Se guarda como JSON. Idempotente.
alter table public.tenants add column if not exists fiscal jsonb;
comment on column public.tenants.fiscal is 'Datos fiscales: {razonSocial, nif, direccion, cp, ciudad, provincia, iban, formaPago, ivaDefecto, textoLegal}.';
