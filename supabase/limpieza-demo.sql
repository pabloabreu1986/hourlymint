-- ─────────────────────────────────────────────────────────────
-- fichaloop · Limpieza de los DATOS DE EJEMPLO en Supabase
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- Borra ÚNICAMENTE las filas demo que insertó schema.sql (obras de
-- ejemplo, trabajadores de ejemplo y todo lo que cuelga de ellos).
-- Conserva: tenants, super-admin, el admin del cliente (u_admin) y
-- cualquier dato creado desde la app con IDs generados.
--
-- ⚠️ REVISA la lista de trabajadores antes de ejecutar: si alguno de
-- estos usuarios se convirtió en un empleado REAL (fichajes reales,
-- partes reales…), quítalo de la lista para no perder sus datos.
-- ─────────────────────────────────────────────────────────────

do $$
declare
  demo_usuarios text[] := array[
    'u_juan','u_pedro','u_luis','u_carlos','u_manuel','u_antonio','u_david','u_javier'
  ];
  demo_obras text[] := array['o_vallecas','o_parla','o_climatizacion','o_oficina'];
begin
  -- Todo lo que cuelga de los trabajadores u obras de ejemplo.
  delete from fichajes       where trabajador_id = any(demo_usuarios) or obra_id = any(demo_obras);
  delete from partes         where obra_id = any(demo_obras) or encargado_id = any(demo_usuarios);
  delete from fotos          where obra_id = any(demo_obras) or subida_por = any(demo_usuarios);
  delete from obra_adjuntos  where obra_id = any(demo_obras);
  delete from incidencias    where obra_id = any(demo_obras) or trabajador_id = any(demo_usuarios);
  delete from notificaciones where trabajador_id = any(demo_usuarios) or id in ('n_1','n_2','n_3');

  -- Recursos de ejemplo (IDs exactos de schema.sql).
  delete from vehiculos    where id in ('v_1','v_2','v_3','v_4');
  delete from herramientas where id in ('h_1','h_2','h_3','h_4');
  delete from almacen      where id in ('a_1','a_2','a_3','a_4');

  -- Módulos RRHH: por si se probaron con los trabajadores demo.
  delete from ausencias    where trabajador_id = any(demo_usuarios);
  delete from turnos       where trabajador_id = any(demo_usuarios);
  delete from gastos       where trabajador_id = any(demo_usuarios);
  delete from documentos   where usuario_id = any(demo_usuarios);
  delete from evaluaciones where trabajador_id = any(demo_usuarios);
  delete from metas        where trabajador_id = any(demo_usuarios);
  delete from onboardings  where usuario_id = any(demo_usuarios);

  -- Obras y trabajadores de ejemplo.
  delete from obras    where id = any(demo_obras);
  delete from usuarios where id = any(demo_usuarios);
end $$;

-- Verificación: qué queda en cada tabla.
select 'usuarios' tabla, count(*) filas from usuarios
union all select 'obras', count(*) from obras
union all select 'fichajes', count(*) from fichajes
union all select 'partes', count(*) from partes
union all select 'incidencias', count(*) from incidencias
union all select 'notificaciones', count(*) from notificaciones
union all select 'vehiculos', count(*) from vehiculos
union all select 'herramientas', count(*) from herramientas
union all select 'almacen', count(*) from almacen
order by tabla;
