# Pruebas manuales · FORGEVIA

Guía de pruebas por perfil de usuario, para verificar cada funcionalidad ya
conectada a Supabase (base de datos + Storage de fotos).

> Este documento **no lista contraseñas reales** a propósito: los usuarios
> ya están dados de alta en Supabase con el equipo real, pero las
> credenciales viven solo en la base de datos, nunca en un archivo que
> pueda acabar en git. Inicia sesión con el nombre y contraseña reales que
> ya tienes; aquí solo se describen los pasos, con nombres de rol
> genéricos.

## Antes de empezar

- La app detecta Supabase por la presencia de `.env` (`VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY`). Si existe, **todo** lo que hagas en las pruebas
  se guarda en la base de datos real, no en `localStorage`.
- **"Admin → Configuración → Restablecer datos" NO restablece Supabase.**
  Ese botón solo borra el `localStorage` del modo mock. Si quieres volver los
  datos de Supabase a su estado inicial, pídemelo.
- El GPS usa la ubicación real del navegador; si deniegas el permiso o el
  dispositivo no lo soporta, la app no falla — ficha igualmente con una
  coordenada simulada cerca de Madrid.
- El mapa de "Trabajadores en tiempo real" ya es real (Leaflet + OpenStreetMap),
  con la ubicación GPS de cada fichaje.
- "Encargado" no es un rol aparte: es quien tenga `encargadoId` en la obra
  ese día (se asigna desde **Admin → Obras**). Solo el encargado ve el botón
  "Cerrar parte del día" en el detalle de su obra.

## Paso 0 (Admin) — asignar el equipo antes de probar

Las obras de ejemplo ya no tienen nadie asignado (se limpiaron al dar de
alta al equipo real). Antes de poder probar los flujos de trabajador/
encargado, entra como **admin** y en **Obras → editar una obra**:

1. Marca 2–3 trabajadores en "Equipo asignado".
2. Elige uno de ellos como "Encargado del día" en el desplegable.
3. Guarda.

Con eso ya puedes probar el resto de este documento usando cualquiera de
esos trabajadores y el que hayas puesto como encargado.

---

## 1) Trabajador (cualquiera asignado a una obra hoy)

1. **Login** con logo → entra directo a Home.
2. **Fichar entrada**: pulsa "ENTRADA". No pide confirmación previa — ficha
   al instante y captura GPS en segundo plano. Al terminar aparece un modal
   "Fichaje registrado" con hora, coordenadas (o "Sin ubicación") y un pin en
   el mapa. Cierra con "Hecho".
3. Comprueba que el botón **SALIDA** estaba deshabilitado antes de fichar
   entrada, y que **ENTRADA** ahora está deshabilitado (ya fichada).
4. **Mis Obras** → debe listar la obra a la que le asignaste en el Paso 0.
   Entra al detalle: equipo del día, encargado destacado, avance.
5. **Parte diario** (desde el detalle de obra): escribe algo en "Trabajo
   realizado", añade una línea de **material pendiente** (nombre + cantidad
   + unidad), sube una foto (botón de cámara → selector de archivo/cámara).
   Pulsa **"Guardar borrador"** y confirma que aparece "✓ Guardado".
   - Nota: el botón **"Ir a cierre" no guarda el borrador automáticamente**
     — si vas a probar el cierre por separado, guarda antes.
   - Si este trabajador no es el encargado de la obra, **no verá** el botón
     "Cerrar parte del día" en el detalle de obra — es esperado, no un bug.
6. **Fotografías** (desde Home): confirma que la foto subida aparece
   agrupada bajo el nombre de la obra.
7. **Fichar salida**: pulsa "SALIDA", confirma el modal de registro.
8. **Notificaciones** (pestaña "Avisos"): revisa que se ven avisos propios
   y globales. Marca alguno como leído tocándolo, y prueba "Marcar leídas".
9. **Perfil**: edita el teléfono y dejando la contraseña en blanco (no debe
   cambiarla); guarda. Revisa la lista "Mis fichajes de hoy" (entrada y
   salida con hora y GPS).

### Pausa para descanso y horas extra

1. Ficha entrada. El botón **"PAUSA"** debe estar habilitado ("Pausa para
   descanso") y **"HORAS EXTRA"** deshabilitado ("Cierra tu turno primero").
2. Pulsa **PAUSA** → el botón cambia a **"REANUDAR"** ("Reanudar trabajo").
   Puedes repetir esto varias veces en el mismo día (varias pausas).
3. Ficha **salida**. Si te queda una pausa abierta, se cierra sola en ese
   mismo instante (sin modal aparte) y luego aparece el modal de salida.
4. Con la salida ya fichada, **HORAS EXTRA** pasa a "Fichar horas extra".
   Pulsa para abrirlas → el botón cambia a "Cerrar horas extra".
5. Prueba pausar **dentro** de las horas extra: el botón de horas extra
   sigue activo ("Cerrar horas extra") aunque estés en pausa; al cerrarlas
   se cierra también la pausa abierta, igual que con la salida.
6. En **Perfil → Mis fichajes de hoy** deben verse todos los eventos por
   separado (Inicio/Fin de pausa, Inicio/Fin horas extra) con su icono y
   color propios (ámbar para pausas, morado para horas extra).

### Aviso automático de "Fichaje pendiente"

Cualquiera con sesión abierta después de las **09:30** dispara la revisión
(se repite cada 5 min). Si un trabajador asignado hoy a una obra en curso no
ha fichado entrada, recibe una notificación personal una sola vez al día.

1. Entra con un trabajador asignado a una obra en curso que **no** haya
   fichado entrada, después de las 09:30 hora local.
2. Ve a **Notificaciones** → debería aparecer "Fichaje pendiente: No has
   fichado la entrada hoy en {obra}...".
3. Como **admin**, abre la campana del panel (arriba a la derecha) o
   **Notificaciones** en el menú lateral → debe verse el mismo aviso,
   identificado con el nombre del trabajador.
4. Repite el login/recarga varias veces seguidas y confirma que **no se
   duplica** el aviso (una sola vez por trabajador y día).

---

## 2) Encargado del día (quien hayas puesto como tal en el Paso 0)

Mismo flujo de trabajador (fichar, parte diario, fotos, notificaciones,
perfil) más el cierre del parte, que solo él puede hacer en su obra:

1. **Mis Obras → (la obra asignada)** → debe verse el badge "ENCARGADO"
   junto a su nombre en el equipo.
2. Pulsa **"Cerrar parte del día"**.
3. Ajusta el **% de avance** con el slider.
4. Revisa el resumen de **materiales pendientes** (te lleva de vuelta al
   parte diario si quieres editarlos; no se edita aquí).
5. Escribe algo en **Observaciones**.
6. En **Incidencias**, escribe algo distinto de "ninguna" (p. ej. "Falta
   cemento") — **esto crea automáticamente una incidencia** visible luego
   para el admin en Incidencias. Si escribes "ninguna"/"ninguno" (o lo
   dejas vacío), no se crea nada.
7. Intenta pulsar **"Cerrar parte" sin firmar** → debe salir una alerta
   "Falta la firma del encargado." y bloquear el envío.
8. Firma en el recuadro (con ratón o dedo/táctil). Prueba también **"Borrar"**
   para limpiar el trazo y volver a firmar.
9. Pulsa **"Cerrar parte"** → modal "¡Parte enviado!" con el avance final.
10. Verifica que el parte queda bloqueado: vuelve a **Parte diario** y
    **Cierre** de esa obra/día — todo debe verse de solo lectura (firma
    como imagen fija, sin botones de edición).

---

## 3) Admin

1. **Dashboard**: KPIs, resumen de obras, bloque **"Ahora mismo"** con un
   cronómetro en vivo por trabajador (segundo a segundo, sin recargar la
   página) que cambia de color según su estado — verde "Trabajando", ámbar
   "Descansando", morado "Horas extra" — más el recuento de activos/
   descansando arriba. Prueba abrir dos sesiones (una admin, otra
   trabajador): al fichar desde el móvil, el dashboard del admin debe
   actualizarse solo, sin recargar (va por Realtime, no por polling).
   También: incidencias recientes, materiales pendientes, donut de fichajes.
2. **Campana de notificaciones** (header): el número debe coincidir con las
   notificaciones sin leer; al abrir lleva a **Notificaciones**, donde puedes
   "Marcar todas leídas".
3. **Obras**: crea una obra nueva (nombre obligatorio — si lo dejas vacío,
   Guardar simplemente no hace nada, no hay mensaje de error). Edita una
   existente: cambia el **encargado del día** con el desplegable y marca/
   desmarca gente en "Equipo asignado" — si el encargado elegido no está
   marcado en el equipo, se añade solo al guardar. Prueba eliminar una obra
   de prueba (pide confirmación, es irreversible).
   - **Cuadrante**: marca/desmarca días de la semana (L-D), cambia hora de
     entrada/salida y el margen de salida automática (minutos). Guarda y
     confirma que se mantiene al reabrir la obra para editar.
4. **Trabajadores**: crea un usuario nuevo (contraseña por defecto `1234`),
   edítalo, usa el icono de ojo para revelar/ocultar su contraseña en la
   tabla, y dale de baja (Estado → Baja) en vez de borrarlo. Confirma que
   **no puedes borrar** al usuario con rol Admin (botón deshabilitado).
5. **Partes diarios**: haz clic en la fila del parte cerrado en el apartado
   anterior → modal de detalle con trabajo realizado, fotos, materiales,
   observaciones/incidencias y la firma. Es solo lectura, no hay edición
   desde aquí.
6. **Fotografías**: filtra por obra y confirma que se ve la foto subida,
   cargada como URL firmada (no un enlace público).
7. **Materiales**: lista agregada de material pendiente de todos los partes
   (no solo hoy) — de solo lectura, sin acción de "marcar entregado" todavía.
8. **Incidencias**: debe aparecer la incidencia creada automáticamente al
   cerrar el parte (paso 6 del apartado de encargado) con estado "Nueva".
   Cambia su estado con el desplegable (Nueva → En proceso → Resuelta).
9. **Vehículos / Herramientas / Almacén**: son de solo lectura en esta
   versión (sin botones de alta/edición) — no es un bug si no encuentras
   cómo añadir un vehículo nuevo, esa pantalla es solo un listado por ahora.
10. **Informes**: KPIs (avance medio, partes cerrados/totales, obras),
    avance por obra, donut de estado de obras. No hay exportación a PDF/Excel
    todavía (nota al pie de la propia pantalla).
11. **Configuración**: revisa que el texto explica que "Restablecer datos"
    es solo para el modo mock (ver nota al principio de este documento).
12. **Horas**: elige un trabajador y navega semana anterior/siguiente con
    las flechas. La tabla debe mostrar, por día, entrada/salida (con
    etiqueta "AUTOMÁTICA" si la salida la puso el sistema), ordinarias,
    descanso y horas extra por separado, con el total de la semana al pie
    y los totales del mes debajo. Si el trabajador tiene el turno todavía
    abierto hoy, las horas ordinarias de ese día deben verse creciendo
    conforme pasa el tiempo (recalculan contra la hora actual).

### Salida automática (requiere esperar o revisar el cron)

Cada minuto, un job en Supabase (`pg_cron`) revisa las obras cuyo margen
tras la hora de salida ya se cumplió y hoy es día laborable:

1. Configura una obra con **hora de salida próxima** (p. ej. dentro de 2
   minutos) y margen 0-1 min, para no esperar mucho.
2. Ficha entrada con un trabajador de esa obra y no la salida.
3. Espera a que pase la hora de salida + margen. Al cabo de un minuto (el
   cron corre cada minuto), debe aparecer una **salida marcada
   "Automática"** con la hora exacta del cuadrante (no la hora en que se
   detectó), visible en Perfil, en "Ahora mismo" (pasa a "Jornada
   cerrada") y en Horas.
4. El trabajador debe recibir una notificación explicando que a partir de
   ahora cualquier trabajo se ficha como horas extra.
5. Si había una pausa abierta, debe cerrarse en el mismo instante que la
   salida automática.
6. Recuerda devolver la obra a un horario normal después de probar esto.

### Admin en móvil

Abre el panel de admin desde un iPhone (o el emulador de Chrome DevTools):

1. **Sin menú hamburguesa**: la cabecera muestra el logo y, a la derecha, el
   avatar con la campana de notificaciones (badge con el número de sin leer).
   Debajo, el saludo con el nombre del admin y la fecha — mismo estilo que la
   Home del trabajador, con espacio respetado para el notch/isla del iPhone.
2. **Barra inferior** con 4 pestañas: **Dashboard, Obras, Trabajadores,
   Perfil**. El resto de secciones (Partes, Materiales, Incidencias,
   Vehículos, Herramientas, Almacén, Informes, Configuración) no están en
   móvil — solo se llega a ellas desde el sidebar de escritorio.
3. **Dashboard**: los KPIs se ven en tarjetas 2×2 sin desbordar ni cortar
   texto; "Resumen de obras" es una lista de tarjetas (no una tabla con
   scroll horizontal); "Ahora mismo" fluye con la página, sin scroll interno.
4. **Obras**: cada tarjeta de obra muestra tiempo trabajado (ordinario/
   extra), el desplegable de "Personal asignado" (chevron abajo/arriba) y la
   galería de fotos agrupada por fecha.
5. **Perfil** (pestaña nueva): avatar, nombre, puesto, editar teléfono/
   contraseña y "Cerrar sesión" — confirma que el botón no queda tapado por
   la barra inferior al hacer scroll hasta el final.

---

## Cosas a vigilar durante las pruebas

- **Fotos**: confirma en el navegador (pestaña Red/Network) que las subidas
  van contra `.../storage/v1/object/fotos-obra/...` y que la visualización
  usa `.../storage/v1/object/sign/...` (URL firmada), no una URL pública.
- **GPS denegado**: deniega el permiso de ubicación del navegador y ficha
  entrada — debe registrar igualmente una coordenada simulada cerca de
  Madrid, sin bloquear el fichaje.
- **Concurrencia del aviso de fichaje**: recargar varias veces seguidas no
  debe crear avisos duplicados para el mismo trabajador.
- **Sesión persistente**: cierra el navegador y vuelve a abrirlo sin cerrar
  sesión — debe seguir logueado (la sesión se guarda en `localStorage` y no
  caduca).
- **Registro horario**: ningún fichaje se edita ni se borra desde la app
  (ni siquiera el admin puede hacerlo hoy). La tabla ya tiene una columna
  `corrige_a` preparada para cuando se construya una pantalla de
  corrección manual — de momento no hay ninguna, es solo el diseño.
