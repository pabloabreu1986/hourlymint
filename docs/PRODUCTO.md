# FORGEVIA · Control de Obra

App web (PWA) de control de obra para **FORGEVIA Proyectos Integrales**: fichajes con GPS,
gestión de obras, partes diarios y panel de administración. Corre **100% en el navegador**
y **persiste los datos en `localStorage`** — sin backend todavía (o en Supabase, ver README).

## Credenciales de prueba

El **usuario es el nombre del trabajador**. No hay registro ni recuperación de contraseña:
el administrador da de alta/baja usuarios y fija contraseñas a mano desde el panel
(**Admin → Trabajadores**).

| Rol         | Usuario              | Contraseña  |
| ----------- | -------------------- | ----------- |
| Trabajador  | `Juan Pérez`         | `1234`      |
| Encargado¹  | `Antonio Sánchez`    | `1234`      |
| Admin       | `Antonio Manzanares` | `admin1234` |

¹ El resto de trabajadores usan también `1234`. "Encargado" no es un rol: es una asignación
por obra y por día (se cambia en **Admin → Obras**).

## Qué hay implementado

**Trabajador (móvil):**
- Login con logo + usuario/contraseña. La sesión **persiste para siempre** en `localStorage`.
- Home: fichar **Entrada / Salida**, **pausa** (inicio/fin) y **horas extra** (inicio/fin), con
  captura GPS automática + confirmación con mapa. Estado de jornada en vivo (sin fichar → trabajando
  → descansando → cerrado → en horas extra), cronómetro con `src/lib/horas.ts`.
- **Salida automática**: si la obra tiene cuadrante (días laborables + horario) y el trabajador no
  ficha su salida, un job de servidor (`pg_cron`, cada minuto) se la registra al pasar el margen
  configurado, cierra cualquier pausa abierta y avisa por notificación. A partir de ahí, cualquier
  fichaje se considera horas extra.
- Mis Obras → detalle de obra (equipo, avance, encargado del día).
- **Parte diario**: trabajo realizado, fotos (se comprimen), material pendiente, guardar borrador.
- **Cierre de parte**: % de avance, observaciones, incidencias y **firma del encargado** (canvas).
- Fotografías, Notificaciones (avisos de fichaje), Perfil (editar teléfono/contraseña, fichajes del día).

**Admin (escritorio):**
- Dashboard: KPIs, resumen de obras, **"Ahora mismo"** con cronómetros en vivo por trabajador
  (Realtime: cualquier fichaje en cualquier móvil actualiza el panel al instante, sin recargar) +
  mapa GPS, incidencias, materiales, donut de fichajes.
- Trabajadores: alta/baja/edición de usuarios y **gestión de contraseñas**.
- Obras: crear/editar, asignar **encargado y equipo del día**, cuadrante (días laborables/horario/
  margen de salida automática). Cada card muestra **tiempo trabajado hoy** (ordinario vs. horas
  extra), un desplegable de **personal asignado** (cargo + tiempo de cada uno, ordenado de más a
  menos, con "sin fichar" al final) y una **galería de fotos** agrupada por fecha (más reciente primero).
- **Horas**: pantalla dedicada con el detalle de jornada de cada trabajador (tramos, pausas, extra).
- Partes diarios (con detalle y firma), Materiales pendientes, Incidencias (cambio de estado).
- Vehículos, Herramientas, Almacén, Informes, Configuración (reinicio de datos).

**Admin (móvil):**
- Vista completa del panel adaptada a iPhone: cabecera con el mismo look & feel que la vista de
  trabajador (logo, avatar/notificaciones, saludo con nombre, respetando el notch vía
  `env(safe-area-inset-top)`), tarjetas en vez de tablas, y galería/desplegables reutilizados de
  las vistas de escritorio.
- **Barra de navegación inferior** (como la del trabajador) con 4 accesos: Dashboard, Obras,
  Trabajadores y Perfil — sin menú hamburguesa. El resto de secciones del admin (Partes, Materiales,
  Incidencias, Vehículos, Herramientas, Almacén, Informes, Notificaciones, Configuración) quedan
  reservadas al sidebar de escritorio (`lg:` en adelante).

## Fotos (encargado / admin)

- Las fotos se suben al **bucket privado** `fotos-obra`; en la app se muestran con **URLs firmadas
  temporales** (1 h), no con enlaces públicos.
- **Visibilidad** (idéntica en modo mock y Supabase):
  - **Trabajador**: sus fotos + las de las obras en las que participa.
  - **Encargado**: todas las fotos de las obras que dirige → **las de sus trabajadores**.
  - **Admin**: todas (menú **Fotografías**, con filtro por obra).

## Pruebas manuales

Para un guion de pruebas manuales paso a paso por perfil (trabajador, encargado, admin),
ver [`PRUEBAS.md`](PRUEBAS.md).
