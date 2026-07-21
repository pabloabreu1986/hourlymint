# FORGEVIA · Control de Obra

App web (PWA) de control de obra para **FORGEVIA Proyectos Integrales**: fichajes con GPS,
gestión de obras, partes diarios y panel de administración. Corre **100% en el navegador**
y **persiste los datos en `localStorage`** — sin backend todavía.

> **Dos modos automáticos:** si defines las variables de Supabase en `.env`, la app usa
> **Supabase** (Postgres + Storage) para todo. Si no, funciona con **datos mock** en
> `localStorage`. El mismo código corre en ambos; la elección la hace la presencia de las claves.

## Arranque

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # sirve el build
```

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

## Conectar Supabase (capa gratuita)

La integración ya está cableada. Pasos (una sola vez):

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y
   pulsa **Run**. Esto crea las tablas, las políticas (RLS), el **bucket privado `fotos-obra`** y
   los datos de ejemplo.
3. **Project Settings → API**: copia la *Project URL* y la *anon public key*.
4. Copia `.env.example` a `.env` y pega los valores:
   ```bash
   cp .env.example .env
   # edita VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
   npm run dev
   ```
5. Listo: la app detecta las claves y usa Supabase automáticamente. Sin `.env`, vuelve a los mocks.

Para un guion de pruebas manuales paso a paso por perfil (trabajador,
encargado, admin), ver [`docs/PRUEBAS.md`](docs/PRUEBAS.md).

### Tiempo real y salida automática (solo Supabase)

Dos piezas de `supabase/schema.sql` solo tienen efecto en modo Supabase (no existen en el mock):

- **Realtime**: la tabla `fichajes` está añadida a la publicación `supabase_realtime`. El Dashboard
  se suscribe a `postgres_changes` sobre `fichajes` y vuelve a pedir los datos en cuanto cambia algo
  — así "Ahora mismo" se actualiza sin recargar ni hacer polling.
- **`pg_cron`**: un job (`cierre-automatico-fichajes`, cada minuto) ejecuta
  `cron_cierre_automatico_fichajes()`, que registra la salida cuando se cumple el cuadrante de la
  obra + margen, cierra pausas abiertas, y a las 23:59 cierra cualquier pausa/hora extra que haya
  quedado abierta. En modo mock este comportamiento no corre en servidor.

### Fotos (encargado / admin)

- Las fotos se suben al **bucket privado** `fotos-obra`; en la app se muestran con **URLs firmadas
  temporales** (1 h), no con enlaces públicos.
- **Visibilidad** (idéntica en modo mock y Supabase):
  - **Trabajador**: sus fotos + las de las obras en las que participa.
  - **Encargado**: todas las fotos de las obras que dirige → **las de sus trabajadores**.
  - **Admin**: todas (menú **Fotografías**, con filtro por obra).

### ⚠️ Seguridad

No se usa Supabase Auth (login simple usuario/contraseña, como pediste). Las políticas son
permisivas para el rol `anon` y el panel admin lee la tabla `usuarios` (incluidas contraseñas).
Es razonable para una herramienta **interna**, pero la *anon key* viaja en el navegador. Cuando
quieras endurecerlo, migra el login a Supabase Auth + rol admin o a una Edge Function. Ver la
cabecera de `supabase/schema.sql`.

## Arquitectura

```
src/
  lib/
    types.ts   tipos compartidos (Usuario, Obra, Fichaje, ParteDiario…)
    horas.ts   ← única fuente de verdad para calcular jornadas: calcularJornada(),
               formatDuracion/formatHoras, estado (sin_fichar/trabajando/descansando/
               cerrado/en_extra) y sus estilos. La usan Home, Perfil, Dashboard,
               AdminTrabajadores, AdminObras y AdminHoras — nunca se duplica el cálculo.
    db.ts      persistencia mock (→ localStorage), seed.ts, supabase.ts (cliente)
  services/    ← "SEAM" de datos. La UI SOLO habla con estos módulos (async, como una API)
    supabase/  implementación real (Postgres + Storage). Cada servicio elige
               supabase o mock según isSupabaseEnabled (presencia de .env)
  context/     AuthContext (sesión persistente)
  components/  UI compartida (Logo, iconos, Avatar, Donut, WorkerMap, SignaturePad…)
  features/
    auth/      Login
    worker/    pantallas móviles del trabajador (incluye WorkerLayout: header + tab bar inferior)
    admin/     panel de administración. Escritorio: sidebar completo. Móvil (`lg:hidden`):
               cabecera estilo trabajador + tab bar inferior con 4 accesos (AdminLayout.tsx)
supabase/
  schema.sql   esquema + RLS + bucket + Realtime + pg_cron (salida automática) + datos semilla
```

El interruptor mock ↔ Supabase vive en cada `src/services/*.ts`: al principio de cada función,
`if (isSupabaseEnabled) return sb.fn(...)`. Así la UI nunca cambia.

### Patrón responsive (admin)

Las pantallas de admin no usan media queries de JS: cada vista renderiza **ambos** layouts en el
DOM y Tailwind decide cuál se ve — `md:hidden`/`hidden md:block` (o `lg:`) según el caso. Ejemplo
en `Dashboard.tsx` y `AdminObras.tsx`: tarjetas apiladas en móvil, tabla en escritorio, mismos datos.

### Notas
- Fotos: en modo Supabase van al **bucket privado** (URLs firmadas). En modo mock se guardan
  como data URLs comprimidas en `localStorage` (suficiente para la demo).
- El GPS usa `navigator.geolocation`; si se deniega el permiso, cae a una posición simulada.
- El mapa (`WorkerMap`) es real: Leaflet + tiles de OpenStreetMap, con las coordenadas GPS reales
  de los fichajes.
- Para volver al estado inicial: **Admin → Configuración → Restablecer datos**.
