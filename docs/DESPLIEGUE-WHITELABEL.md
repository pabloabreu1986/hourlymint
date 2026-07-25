# Despliegue white-label (fichaloop) — runbook

Deja la plataforma lista para que cada cliente tenga su subdominio
(`nombreempresa.fichaloop.com`) y `fichaloop.com` sea la web de marketing.

Orden recomendado: **1) Código → 2) Supabase → 3) Vercel dominios → 4) Cloudflare DNS**.

---

## 1. Código (deploy a producción)

La rama `whitelabel/branding` está lista y probada (tsc + build OK). Para
publicar, mézclala a `main` y sube (Vercel despliega producción desde `main`):

```bash
git checkout main
git merge --no-ff whitelabel/branding -m "Merge white-label"
git push origin main
```

> El deploy es **seguro para FORGEVIA**: mientras no exista la tabla `tenants`
> en Supabase, el código cae al cliente por defecto (FORGEVIA, todas las
> funciones). `hourlymint.vercel.app` sigue mostrando el login de FORGEVIA.

Verificación post-deploy (con datos reales de FORGEVIA, sin tocar nada):
- `hourlymint.vercel.app` → login de FORGEVIA, los usuarios reales entran igual.
- `hourlymint.vercel.app/?t=apex` → previsualización de la web de fichaloop.

---

## 2. Supabase (tabla de tenants + super-admin)

En **Supabase → SQL Editor → New query**, pega y ejecuta
[`supabase/whitelabel.sql`](../supabase/whitelabel.sql). Crea:
- Tabla `tenants` (marca de cada cliente) + RLS permisiva.
- Cliente **FORGEVIA** con todas las funciones.
- Super-admin de plataforma: usuario **`pablo`** / contraseña **`890p`**.

Es idempotente (se puede reejecutar). Tras esto:
- El super-admin panel (`/super`) funciona en producción con `pablo/890p`.
- Los clientes que crees ahí se guardan en Supabase (compartidos entre
  dispositivos) y pintan su marca en su subdominio.

> ⚠️ Seguridad: igual que el resto del proyecto, no usa Supabase Auth y la RLS
> es permisiva (`anon`). El super-admin va en la tabla `usuarios` con la clave
> en claro. Aceptable como está hoy; endurecer con Auth/Edge Function más
> adelante (ver cabecera de `supabase/schema.sql`).

---

## 3. Vercel (dominios)

En **Vercel → proyecto `hourlymint` → Settings → Domains**, añade:

| Dominio | Para qué |
|---|---|
| `fichaloop.com` | Web de marketing (apex) |
| `www.fichaloop.com` | Redirige a `fichaloop.com` |
| `*.fichaloop.com` | **Comodín**: todos los subdominios de cliente (forgevia, etc.) |

El comodín `*.fichaloop.com` hace que **cualquier** `cliente.fichaloop.com`
sirva la misma app; el subdominio decide qué tenant (marca) se muestra.

> El dominio comodín en Vercel requiere el plan que lo permita y verificación
> del dominio. Vercel te dirá exactamente qué registros necesita (paso 4).

---

## 4. Cloudflare (DNS)

En **Cloudflare → dominio `fichaloop.com` → DNS**, crea los registros que
Vercel te indique. Lo habitual:

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| `A` | `@` (fichaloop.com) | `76.76.21.21` (IP que dé Vercel) | DNS only (gris) |
| `CNAME` | `www` | `cname.vercel-dns.com` | DNS only |
| `CNAME` | `*` (comodín) | `cname.vercel-dns.com` | DNS only |

Notas importantes:
- **Proxy en "DNS only" (nube gris), no naranja**, para que Vercel gestione el
  SSL de los subdominios. Si usas el proxy de Cloudflare (naranja), configura
  el modo SSL en **Full (strict)** y activa **Total TLS**/certificado comodín,
  o los subdominios darán error de certificado.
- Usa **exactamente** los valores (IP / destino CNAME) que muestre Vercel en el
  paso 3; los de la tabla son los típicos pero pueden cambiar.
- El comodín `*` cubre `forgevia.fichaloop.com`, `clienteX.fichaloop.com`, etc.
  sin crear un registro por cliente.

---

## 5. Alta de un cliente nuevo (flujo habitual)

1. Entra en `fichaloop.com` (o `hourlymint.vercel.app/?t=apex`) como `pablo/890p`
   → **Consola → Clientes → Nuevo**.
2. Configura marca, colores, logo y funciones. Guarda. Anota su **slug**.
3. El cliente entra por **`<slug>.fichaloop.com`** y ve su login con su marca.
4. Da de alta sus usuarios (admin/trabajadores) en la tabla `usuarios` de
   Supabase (o desde el panel admin del propio cliente).

> Nota multi-tenant: hoy los **datos** (obras, usuarios, fichajes) son
> compartidos a nivel de Supabase; la separación por `tenant_id` es un paso
> posterior. La marca y las funciones sí son ya por cliente.

---

## Resumen de piezas de código

- `src/lib/host.ts` — resuelve apex vs subdominio (override `?t=apex`/`?t=slug`).
- `src/lib/branding.ts` — tenant activo (síncrono con caché + hidratación async).
- `src/services/tenant.ts` (+ `supabase/tenant.ts`) — CRUD de tenants, resiliente.
- `src/features/marketing/Landing.tsx` — web de fichaloop.com.
- `src/features/super/*` — consola super-admin.
- `src/lib/funciones.ts` — catálogo de feature flags.
- `supabase/whitelabel.sql` — migración de BD.
