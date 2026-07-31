# Control horario · PWA

App web (PWA) con panel de administración y vista móvil. Corre **100% en el navegador**;
persiste los datos en `localStorage` o, si se conecta, en **Supabase** (Postgres + Storage).

> **Dos modos automáticos:** si defines las variables de Supabase en `.env`, la app usa
> **Supabase** para todo. Si no, funciona con **datos mock** en `localStorage`. El mismo
> código corre en ambos; la elección la hace la presencia de las claves.

## Arranque

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # sirve el build
```

## Conectar Supabase (capa gratuita)

La integración ya está cableada. Pasos (una sola vez):

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: ejecuta las migraciones de `supabase/` **en este orden**
   (cada una es idempotente):
   1. [`supabase/schema.sql`](supabase/schema.sql) — tablas base, políticas (RLS), **bucket
      privado de fotos**, publicación de **Realtime**, job de **`pg_cron`** y datos de ejemplo.
   2. [`supabase/multi-tenant.sql`](supabase/multi-tenant.sql) — columna `tenant_id` + índices
      en todas las tablas (aislamiento por cliente).
   3. [`supabase/whitelabel.sql`](supabase/whitelabel.sql) — tabla `tenants` (marca por cliente)
      y alta del super-admin.
   4. [`supabase/demo-solicitudes.sql`](supabase/demo-solicitudes.sql) — tabla de leads del
      formulario "Solicitar demo" de la landing.
   5. [`supabase/modulos-rrhh.sql`](supabase/modulos-rrhh.sql) — tablas de los módulos RRHH
      (ausencias, turnos, gastos, documentos, evaluaciones, metas, onboarding, comunicados,
      canal de denuncias).
3. **Project Settings → API**: copia la *Project URL* y la *anon public key*.
4. Copia `.env.example` a `.env` y pega los valores:
   ```bash
   cp .env.example .env
   # edita VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
   npm run dev
   ```
5. Listo: la app detecta las claves y usa Supabase automáticamente. Sin `.env`, vuelve a los mocks.

### Tiempo real y salida automática (solo Supabase)

Dos piezas de `supabase/schema.sql` solo tienen efecto en modo Supabase (no existen en el mock):

- **Realtime**: la tabla de fichajes está añadida a la publicación `supabase_realtime`. El panel
  se suscribe a `postgres_changes` y vuelve a pedir los datos en cuanto cambia algo — sin recargar
  ni hacer polling.
- **`pg_cron`**: un job (cada minuto) cierra automáticamente jornadas abiertas según el cuadrante
  configurado por registro, y cierra a medianoche cualquier tramo que haya quedado abierto. En modo
  mock este comportamiento no corre en servidor.

### Seguridad

No se usa Supabase Auth (login simple usuario/contraseña). Las políticas son permisivas para el
rol `anon` y el panel admin lee la tabla de usuarios (incluidas contraseñas). Es razonable para
una herramienta **interna**, pero la *anon key* viaja en el navegador. Para endurecerlo, migra el
login a Supabase Auth + rol admin o a una Edge Function. Ver la cabecera de `supabase/schema.sql`.

## Arquitectura

```
src/
  lib/
    types.ts   tipos compartidos (entidades del dominio)
    horas.ts   ← única fuente de verdad para calcular jornadas: cálculo de tramos,
               formateo de duración y estado en vivo. La usan todas las pantallas
               que muestran tiempo trabajado — nunca se duplica el cálculo.
    db.ts      persistencia mock (→ localStorage), seed.ts, supabase.ts (cliente)
  services/    ← "SEAM" de datos. La UI SOLO habla con estos módulos (async, como una API)
    supabase/  implementación real (Postgres + Storage). Cada servicio elige
               supabase o mock según isSupabaseEnabled (presencia de .env)
  context/     AuthContext (sesión persistente)
  components/  UI compartida (iconos, Avatar, Donut, mapa, firma…)
  features/
    auth/      Login
    worker/    pantallas móviles del perfil operativo (header + tab bar inferior)
    admin/     panel de administración. Escritorio: sidebar completo. Móvil (`lg:hidden`):
               cabecera + tab bar inferior con accesos principales
supabase/
  schema.sql           esquema base + RLS + bucket + Realtime + pg_cron + datos semilla
  multi-tenant.sql     tenant_id + índices (aislamiento por cliente)
  whitelabel.sql       tabla tenants (marca por cliente) + super-admin
  demo-solicitudes.sql leads del formulario de demo
  modulos-rrhh.sql     módulos RRHH (ausencias, turnos, gastos, documentos, talento…)
```

El interruptor mock ↔ Supabase vive en cada `src/services/*.ts`: al principio de cada función,
`if (isSupabaseEnabled) return sb.fn(...)`. Así la UI nunca cambia.

### Patrón responsive (admin)

Las pantallas de admin no usan media queries de JS: cada vista renderiza **ambos** layouts en el
DOM y Tailwind decide cuál se ve — `md:hidden`/`hidden md:block` (o `lg:`) según el caso. Tarjetas
apiladas en móvil, tabla en escritorio, mismos datos.

### Notas
- Fotos: en modo Supabase van a un **bucket privado** (URLs firmadas). En modo mock se guardan
  como data URLs comprimidas en `localStorage` (suficiente para la demo).
- El GPS usa `navigator.geolocation`; si se deniega el permiso o falla, el fichaje se guarda
  **sin ubicación** (`gps: null`) — nunca se inventa una posición.
- El mapa es real: Leaflet + tiles de OpenStreetMap, con coordenadas GPS reales.

---

La descripción funcional del producto (qué hace cada pantalla, credenciales de prueba,
reglas de negocio) vive en `docs/`, fuera de este README.
