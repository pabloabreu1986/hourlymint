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
- Home: fichar **Entrada / Salida** (captura GPS automática + confirmación con mapa), Fotografías, Mis Obras.
- Mis Obras → detalle de obra (equipo, avance, encargado del día).
- **Parte diario**: trabajo realizado, fotos (se comprimen), material pendiente, guardar borrador.
- **Cierre de parte**: % de avance, observaciones, incidencias y **firma del encargado** (canvas).
- Fotografías, Notificaciones (avisos de fichaje), Perfil (editar teléfono/contraseña, fichajes del día).

**Admin (escritorio):**
- Dashboard: KPIs, resumen de obras, trabajadores en tiempo real + mapa GPS, incidencias, materiales, donut de fichajes.
- Trabajadores: alta/baja/edición de usuarios y **gestión de contraseñas**.
- Obras: crear/editar, asignar **encargado y equipo del día**.
- Partes diarios (con detalle y firma), Materiales pendientes, Incidencias (cambio de estado).
- Vehículos, Herramientas, Almacén, Informes, Configuración (reinicio de datos).

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
  lib/         tipos, persistencia mock (db.ts → localStorage), seed y cliente supabase.ts
  services/    ← "SEAM" de datos. La UI SOLO habla con estos módulos (async, como una API)
    supabase/  implementación real (Postgres + Storage). Cada servicio elige
               supabase o mock según isSupabaseEnabled (presencia de .env)
  context/     AuthContext (sesión persistente)
  components/  UI compartida (Logo, iconos, Avatar, Donut, WorkerMap, SignaturePad…)
  features/
    auth/      Login
    worker/    pantallas móviles del trabajador
    admin/     panel de administración de escritorio
supabase/
  schema.sql   esquema + RLS + bucket + datos semilla
```

El interruptor mock ↔ Supabase vive en cada `src/services/*.ts`: al principio de cada función,
`if (isSupabaseEnabled) return sb.fn(...)`. Así la UI nunca cambia.

### Notas
- Fotos: en modo Supabase van al **bucket privado** (URLs firmadas). En modo mock se guardan
  como data URLs comprimidas en `localStorage` (suficiente para la demo).
- El GPS usa `navigator.geolocation`; si se deniega el permiso, cae a una posición simulada.
- El mapa (`WorkerMap`) es real: Leaflet + tiles de OpenStreetMap, con las coordenadas GPS reales
  de los fichajes.
- Para volver al estado inicial: **Admin → Configuración → Restablecer datos**.
