-- ─────────────────────────────────────────────────────────────
-- fichaloop · Eliminar los usuarios de PRUEBA de Pablo en FORGEVIA
-- (pabloObr y pabloEnc), conservando los trabajadores reales que
-- creó el cliente.
--
-- Ejecuta en: Supabase → SQL Editor. Idempotente.
--
-- Qué hace:
--   · Borra los dos usuarios y su actividad personal (fichajes,
--     partes, fotos, ausencias, turnos, gastos, documentos,
--     evaluaciones, metas, onboardings, notificaciones, denuncias
--     no anónimas).
--   · En entidades compartidas que pueden ser reales NO borra nada:
--     los desvincula (obras, vehículos, incidencias, adjuntos).
--
-- Antes de ejecutar, comprueba qué se va a borrar:
--   select id, nombre, rol, puesto from usuarios
--   where tenant_id = 'forgevia' and nombre in ('pabloObr','pabloEnc');
-- ─────────────────────────────────────────────────────────────

do $$
declare
  ids text[];
begin
  select array_agg(id) into ids
  from usuarios
  where tenant_id = 'forgevia' and nombre in ('pabloObr', 'pabloEnc');

  if ids is null then
    raise notice 'No se encontraron pabloObr/pabloEnc en forgevia. Nada que borrar.';
    return;
  end if;

  -- Actividad personal: se borra.
  delete from fichajes       where trabajador_id = any(ids);
  delete from partes         where encargado_id = any(ids);
  delete from fotos          where subida_por = any(ids);
  delete from notificaciones where trabajador_id = any(ids);
  delete from ausencias      where trabajador_id = any(ids);
  delete from turnos         where trabajador_id = any(ids);
  delete from gastos         where trabajador_id = any(ids);
  delete from documentos     where usuario_id = any(ids);
  delete from evaluaciones   where trabajador_id = any(ids) or evaluador_id = any(ids);
  delete from metas          where trabajador_id = any(ids);
  delete from onboardings    where usuario_id = any(ids);
  delete from denuncias      where trabajador_id = any(ids); -- las anónimas no llevan id, no se tocan

  -- Entidades compartidas: solo se desvinculan.
  update obras set encargado_id = null where encargado_id = any(ids);
  update obras
     set trabajador_ids = (
       select coalesce(array_agg(t), '{}')
       from unnest(trabajador_ids) t
       where not (t = any(ids))
     )
   where trabajador_ids && ids;
  update vehiculos     set asignado_a = null    where asignado_a = any(ids);
  update incidencias   set trabajador_id = null where trabajador_id = any(ids);
  update obra_adjuntos set subido_por = null    where subido_por = any(ids);

  -- Los usuarios en sí.
  delete from usuarios where id = any(ids);

  raise notice 'Eliminados % usuario(s): %', array_length(ids, 1), ids;
end $$;

-- Verificación: trabajadores que quedan en FORGEVIA.
select id, nombre, rol, puesto, activo
from usuarios
where tenant_id = 'forgevia'
order by rol, nombre;
