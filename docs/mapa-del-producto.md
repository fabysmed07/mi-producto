# Mapa del producto: Soltura

Guía para quien llega nuevo al proyecto. Cada afirmación lleva entre paréntesis el archivo (y la línea, cuando aplica) donde se ve. Lo que no se pudo confirmar leyendo el código está marcado como **sin confirmar**.

> Fuente: lectura del código en la rama `onboarding`. No se ejecutó la app con datos reales ni se consultó ninguna base de datos.

---

## 1. Qué hace la app (en lenguaje de producto)

**Soltura** ofrece rutinas de movilidad de seis minutos para quien pasa muchas horas sentado (`app/(site)/page.tsx:103`). Tiene tres caras:

**a) Una landing pública con una rutina guiada.**
- Quien llega a `/` ve un cronómetro con seis movimientos de un minuto cada uno, en dos posiciones: "De pie" y "En tu silla" (`components/RoutineWidget.tsx:6`, `components/RoutineWidget.tsx:10-23`).
- El botón "Empezar mi rutina" sube al cronómetro y lo arranca (`components/CtaLink.tsx`, `components/RoutineContext.tsx`, `components/RoutineWidget.tsx:111-124`).
- No hace falta cuenta para usarlo: la propia página lo dice (`app/(site)/page.tsx:42`).
- La landing también tiene una lista de espera por email y un formulario de opiniones (`app/(site)/page.tsx:85-97`).

**b) Un espacio personal para quien se registra.**
Cada persona, desde `/cuenta`, puede:
- Anotar **a mano** cada rutina que hizo: qué zona (cuello, espalda baja, cadera, hombros, muñecas, cuerpo completo), si la completó o la dejó a medias, una nota opcional y un peso opcional (`components/SessionForm.tsx:47-71`, `lib/routines.ts:2-9`).
- Fijar una meta semanal de 1 a 7 días (`lib/goals.ts:8`, `app/api/goals/route.ts:28-33`).
- Ver el avance de esa meta y leer los consejos ("tips") que publica el equipo (`app/cuenta/page.tsx:56-92`).
- Cada usuario ve solo lo suyo (`app/cuenta/rutinas/page.tsx:11`, comentario en `app/api/sessions/route.ts:7`).

**c) Un panel de administración** solo para los emails de `ADMIN_EMAILS`, con:
- Resumen, signups, feedback, métricas, metas, rutinas, sesiones y tips (`app/admin/layout.tsx:9-18`).
- Las métricas buscan responder si la gente se activa, vuelve y termina la rutina (`app/admin/metricas/page.tsx:108-114`).

**Cosas que conviene saber desde el día uno**
- **El cronómetro no guarda nada.** `RoutineWidget` no hace ninguna llamada a la API (se leyó el archivo completo: `components/RoutineWidget.tsx`). Registrar una rutina es una acción aparte, manual, en `/cuenta/rutinas`.
- **"Completada / abandonada" es lo que el usuario declara**, no algo que la app mida (`components/SessionForm.tsx:57-61`). No se guarda duración ni en qué minuto se abandonó (no hay tales columnas en `supabase/migrations/20261012120000_create_routine_sessions.sql:4-11`).
- **Hay textos marcados `[REVISAR]` visibles al público** en el widget (`components/RoutineWidget.tsx:167` y `components/RoutineWidget.tsx:220`), con estilo propio en `app/(site)/globals.css:62`. Son copy pendiente de revisar; no parece intencional dejarlos en producción (**sin confirmar** la intención).
- Es un prototipo y la app no cobra nada: no hay código de pagos en las rutas de `app/api/` (listado de `app/api/`). Que "pagos e IA se simulan" viene de `CLAUDE.md:26`, no de código.

---

## 2. Componentes: las partes del proyecto

Stack: Next.js 15 (App Router), React 19, TypeScript, Supabase (`package.json:11-18`). No hay tests; `npm run lint` en realidad ejecuta `tsc --noEmit` (`package.json:6-9`).

### Páginas (`app/`)
| Parte | Qué hace | Archivo |
|---|---|---|
| Landing `/` | Página pública: cronómetro, ensayo "por qué seis minutos", lista de espera, opiniones | `app/(site)/page.tsx` (estilos: `app/(site)/globals.css`) |
| `/login` y `/registro` | Pantallas de acceso; ambas usan el mismo formulario | `app/(auth)/login/page.tsx`, `app/(auth)/registro/page.tsx`, `components/AuthForm.tsx` |
| `/cuenta` | Tablero con tres tarjetas: rutinas de la semana, meta semanal, último tip | `app/cuenta/page.tsx:56-92` |
| `/cuenta/rutinas` | Formulario para registrar una sesión + lista de las 50 últimas | `app/cuenta/rutinas/page.tsx` |
| `/cuenta/meta` | Meta semanal, su progreso y el historial de metas | `app/cuenta/meta/page.tsx` |
| `/cuenta/tips` | Lista de tips | `app/cuenta/tips/page.tsx`, `components/TipList.tsx` |
| `/cuenta/sin-acceso` | Aviso cuando alguien sin permiso entra a `/admin` | `app/cuenta/sin-acceso/page.tsx`, `middleware.ts:38-46` |
| `/admin/*` | Panel: Resumen, Signups, Feedback, Métricas, Metas, Rutinas, Sesiones, Tips | `app/admin/layout.tsx:9-18`, una carpeta por pestaña en `app/admin/` |

### Rutas de API (`app/api/`)
El navegador solo habla con estas rutas, nunca con Supabase directamente (no hay cliente de Supabase en los componentes `'use client'` revisados: `components/AuthForm.tsx`, `components/SessionForm.tsx`; el resto de componentes cliente **sin confirmar** uno por uno).

| Ruta | Qué hace | Llave que usa | Archivo |
|---|---|---|---|
| `POST /api/auth/signup` | Crea la cuenta (email + contraseña de 8 a 72) | pública + sesión | `app/api/auth/signup/route.ts` |
| `POST /api/auth/login` | Inicia sesión; avisa si es admin | pública + sesión | `app/api/auth/login/route.ts` |
| `/api/auth/logout` | Cierra sesión | — | `app/api/auth/logout/route.ts` (no leída a fondo) |
| `GET/POST /api/sessions` | Lista y crea sesiones de rutina | pública + sesión | `app/api/sessions/route.ts` |
| `PATCH /api/sessions/[id]` | Solo permite cambiar el peso de una sesión | pública + sesión | `app/api/sessions/[id]/route.ts:9-31` |
| `GET/POST /api/goals`, `/api/goals/[id]` | Metas semanales (la de `[id]` borra) | pública + sesión | `app/api/goals/route.ts` (el DELETE de `[id]` **sin confirmar**, no leído) |
| `GET /api/tips` | Tips para usuarios con sesión | pública + sesión | `app/api/tips/route.ts` (no leída a fondo) |
| `POST /api/signups` | Guarda un email en la lista de espera (pública) | **secreta** | `app/api/signups/route.ts:13` |
| `POST /api/feedback` | Guarda una opinión (pública) | **secreta** | `app/api/feedback/route.ts:12-14` |
| `POST /api/admin/tips`, `/api/admin/tips/[id]` | Crear, editar y borrar tips (solo admin) | **secreta** | `app/api/admin/tips/route.ts:7-21` |

### Acceso y permisos
- **`middleware.ts`**: refresca la sesión; sin sesión manda `/admin` y `/cuenta` a `/login?next=…` (`middleware.ts:35-37`); con sesión pero sin ser admin, muestra el aviso 403 (`middleware.ts:39-46`); con sesión, saca a quien visita `/login` o `/registro` hacia `/cuenta` (`middleware.ts:47-49`).
- **`lib/supabase-session.ts`**: cliente de Supabase con llave pública y cookies del usuario, solo en servidor; `getUser()` valida el token contra Supabase (`lib/supabase-session.ts:6-31`).
- **`lib/supabase-server.ts`**: cliente con la llave secreta (ignora RLS), `server-only` (`lib/supabase-server.ts:1-14`).
- **`lib/admin-emails.ts`**: decide si un email es admin leyendo `ADMIN_EMAILS` (`lib/admin-emails.ts:2-9`).

### Lógica compartida (`lib/`)
- `lib/routines.ts`: las seis rutinas válidas, validación del peso y tipos (`lib/routines.ts:2-43`).
- `lib/goals.ts`: reglas de las metas (días 1-7, rango de fechas, tope de 50) (`lib/goals.ts:8-45`).
- `lib/tips.ts`: complejidad, límite de 280 caracteres y validación de un tip (`lib/tips.ts:4-46`).
- `lib/visits.ts`: registra una visita por usuario y día; un fallo nunca rompe la página (`lib/visits.ts:6-17`).

### Base de datos (`supabase/migrations/`)
Tablas con RLS: `signups` y `feedback` (`20260927120000_…`), `routine_sessions` (`20261012120000_…`), `tips` (`20261013120000_…`), `visits` (`20261015120000_…`), `weekly_goals` (`20261022120000_…`, con ajustes en `20261024120000_…` y `20261024130000_…`). El peso se añadió después (`20261105120000_add_peso_to_routine_sessions.sql:5`). Las políticas públicas de INSERT de `signups`/`feedback` se retiran en `20261003120000_…` y el SELECT de usuarios autenticados en `20261008120000_…` (solo por los nombres de los archivos; **su contenido sin confirmar**, no se leyó).

### Otros
- `components/`: formularios y listas (`SessionForm`, `SessionList`, `SessionWeightEdit`, `GoalForm`, `GoalList`, `GoalDeleteButton`, `AdminTipForm`, `AdminSignups`, `AdminFeedback`, `SignupForm`, `FeedbackForm`), navegación (`SiteNav`, `AuthNav`, `LogoutButton`) y el cronómetro (`RoutineWidget`, `RoutineContext`, `CtaLink`).
- `scripts/seed-datos-prueba.mjs`: script para cargar datos de prueba; lee `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SECRET_KEY` (`scripts/seed-datos-prueba.mjs:25-26`). Qué hace exactamente, **sin confirmar** (solo se leyeron sus primeras constantes).
- `vercel.json`: en cada deploy de producción corre `supabase db push` tras `next build` (`vercel.json:3`).
- `.claude/`: agentes revisores (`revisor-seguridad`, `revisor-qa`, `revisor-mobile`) y la skill `nueva-entidad` (`.claude/agents/*.md`, `.claude/skills/nueva-entidad/SKILL.md`).
- `CLAUDE.md`: reglas de trabajo del repo (ramas y PR, migraciones, no tocar producción).

### Variables de entorno
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_EMAILS` (`lib/supabase-session.ts:9-10`, `lib/supabase-server.ts:9-10`, `lib/admin-emails.ts:4`). En deploy, además `VERCEL_ENV` y `POSTGRES_URL_NON_POOLING` (`vercel.json:3`).

---

## 3. Flujo de usuario: del registro al primer registro guardado

1. **Llega a la landing.** Ve la landing y puede probar el cronómetro sin cuenta (`app/(site)/page.tsx:42`, `components/RoutineWidget.tsx`). Si no hay sesión, el menú muestra "Ingresar" y "Registrarme" (`components/AuthNav.tsx:13-16`).
2. **Abre `/registro`.** Se muestra `AuthForm` en modo registro (`components/AuthForm.tsx:14`, `app/(auth)/registro/page.tsx`). Si ya tuviera sesión, el middleware lo manda a `/cuenta` (`middleware.ts:47-49`).
3. **Envía email y contraseña.** El formulario hace `POST /api/auth/signup` (`components/AuthForm.tsx:27-31`). El servidor valida: email con formato correcto y de hasta 254 caracteres; contraseña de 8 a 72 (`app/api/auth/signup/route.ts:10-15`). Los errores se traducen a mensajes en español (`components/AuthForm.tsx:6-12`).
4. **Supabase crea la cuenta.** `auth.signUp` se llama con la llave pública (`app/api/auth/signup/route.ts:17-18`). El servidor responde `needsConfirmation: true` si no se abrió sesión (`app/api/auth/signup/route.ts:25-26`).
   - **Si exige confirmar el correo:** la persona ve "Revisa tu correo para confirmar tu cuenta y luego inicia sesión" (`components/AuthForm.tsx:35-36`) y tiene que confirmar y entrar por `/login` (`app/api/auth/login/route.ts:14`).
   - **Si no lo exige:** entra directo. Si el proyecto remoto exige confirmación, **sin confirmar**: el `supabase/config.toml` local dice `enable_confirmations = false` (`supabase/config.toml:225`), pero eso configura el Supabase local, no el remoto.
5. **Redirección a `/cuenta`.** Si hubo sesión, el navegador hace una navegación completa a `/cuenta` (o a `/admin` si el email es admin) (`components/AuthForm.tsx:38-42`). En `/login` el flag de admin sale de `app/api/auth/login/route.ts:17`; en el registro **sin confirmar** que la respuesta incluya `admin` (`app/api/auth/signup/route.ts:26` no lo envía, así que un admin recién registrado iría a `/cuenta`).
6. **Se registra una visita.** El layout de `/cuenta` llama a `recordVisit()` en cada carga (`app/cuenta/layout.tsx:23`), que guarda una fila por usuario y día (`lib/visits.ts:11-13`).
7. **Ve el tablero vacío.** Sin datos, `/cuenta` muestra "Aún no registras ninguna.", "Aún no fijas una meta." y "Todavía no hay tips." si no hay tips (`app/cuenta/page.tsx:45-47`, `app/cuenta/page.tsx:78-82`, `app/cuenta/page.tsx:89`). La tarjeta "Mis rutinas" lleva a `/cuenta/rutinas` (`app/cuenta/page.tsx:57-62`).
8. **Abre "Mis rutinas".** El servidor comprueba la sesión y lee sus sesiones con RLS (`app/cuenta/rutinas/page.tsx:8-17`). Ve el formulario "Registrar una rutina" (`app/cuenta/rutinas/page.tsx:23-26`).
9. **Llena el formulario.** Elige rutina (obligatoria), marca "Completada" o "La dejé a medias" (por defecto, completada), y opcionalmente escribe una nota (hasta 280) y un peso (`components/SessionForm.tsx:47-70`).
10. **Envía.** `POST /api/sessions` con `rutina`, `completado`, `nota`, `peso` (`components/SessionForm.tsx:19-28`). El servidor exige sesión (401 si no) y valida la rutina, el booleano, la nota y el peso (`app/api/sessions/route.ts:25-32`).
11. **Se guarda con RLS.** El `insert` va con la llave pública y la sesión del usuario; `user_id` no viene del cliente, lo pone la base con `default auth.uid()` (`app/api/sessions/route.ts:34-38`, `supabase/migrations/20261012120000_create_routine_sessions.sql:6`). La política de inserción exige que la fila sea suya (`…create_routine_sessions.sql:23-26`).
12. **Confirmación.** Responde 201; el formulario se limpia, muestra "Sesión registrada." y refresca la lista (`app/api/sessions/route.ts:43`, `components/SessionForm.tsx:35-39`). La sesión aparece arriba en "Mis sesiones" (`app/cuenta/rutinas/page.tsx:27-34`), y ya cuenta en el tablero y en las métricas del admin (`app/cuenta/page.tsx:27`, `app/admin/metricas/page.tsx:38`).

Después de la primera sesión, el peso se puede cambiar (`components/SessionWeightEdit.tsx`, `app/api/sessions/[id]/route.ts`); el resto de la sesión no se puede editar (permiso de UPDATE solo sobre `peso`, comentario en `app/api/sessions/[id]/route.ts:7-8`).

---

## 4. Dónde tocar: los tres cambios más probables

Son una **suposición mía** de cuáles son los cambios más probables, a partir de lo que vi en el código y en el `README.md` (que recoge dudas de usuarios sobre el copy y el widget).

### A. Agregar, quitar o renombrar una rutina (zona)
La lista de zonas está repetida en varios sitios y **tienen que coincidir**:
- `lib/routines.ts:2-9`: la lista `ROUTINES` (la usan el formulario, el admin y las métricas: `components/SessionForm.tsx:52`, `components/AdminTipForm.tsx:80`, `app/admin/rutinas/page.tsx:32`, `app/admin/metricas/page.tsx:73`).
- Una **migración nueva** en `supabase/migrations/` que cambie el `check` de `routine_sessions.rutina` (`20261012120000_create_routine_sessions.sql:7`) y el de `tips.zona` (`20261013120000_create_tips.sql:8`). El comentario de `lib/routines.ts:1` y de `lib/tips.ts:3` lo recuerdan. Según `CLAUDE.md:29-30`, la migración a la base de desarrollo la aplica quien trabaja desde aquí y la de producción la aplica Vercel.
- `scripts/seed-datos-prueba.mjs:20-22`: copia propia de la lista y de las tasas de finalización.
- Nota: las zonas del registro **no** son los movimientos del cronómetro. Los seis movimientos del widget están en `components/RoutineWidget.tsx:10-23` y son independientes de `ROUTINES`.

### B. Añadir un dato nuevo a cada sesión (como se hizo con el peso)
El camino del peso muestra qué se toca:
- Migración nueva con la columna y su `check` (`supabase/migrations/20261105120000_add_peso_to_routine_sessions.sql:5`); si debe poder editarse después, `grant update (columna)` como en `…:16`.
- Validación y tipos en `lib/routines.ts` (`RoutineSession` en `:19-26`, `parsePeso` en `:30-41`).
- Rutas: `app/api/sessions/route.ts` (`COLUMNS` en `:5`, validación en `:27-32`, `insert` en `:38`) y, si se edita, `app/api/sessions/[id]/route.ts`.
- Pantallas: `components/SessionForm.tsx` (campo y envío, `:22-27` y `:66-69`), `components/SessionList.tsx` y `components/SessionWeightEdit.tsx` (mostrar y editar), `app/cuenta/rutinas/page.tsx:15` (el `select`).
- Admin: `app/admin/sesiones/page.tsx:42` (el `select` y la tabla en `:78-80`).

### C. Cambiar el texto o la experiencia de la landing y el cronómetro
- Textos de la landing: `app/(site)/page.tsx` (titular y subtítulo en `:38-39`, ensayo en `:50-75`, cierre en `:79-80`).
- Los `[REVISAR]` pendientes: `components/RoutineWidget.tsx:167` y `:220`.
- Movimientos, indicaciones y duración del cronómetro: `components/RoutineWidget.tsx:6` (`DUR = 60` segundos por movimiento) y `:10-23` (`STEPS`).
- Estilos: `app/(site)/globals.css`. Ojo: `CLAUDE.md:24` pide no cambiar el diseño sin que se pida.
- Si el cambio fuera que el cronómetro **guarde la sesión sola** al terminar (hoy no lo hace), habría que llamar a `POST /api/sessions` desde `components/RoutineWidget.tsx` y decidir qué rutina (zona) registrar, porque el widget no tiene ese concepto. Es una idea, no algo que el código ya prepare (**sin confirmar** que sea lo que se quiere).

---

## Cosas que conviene saber

Tres cosas que suelen hacer perder tiempo a quien llega nuevo. Son observaciones; el código no se ha cambiado.

### 1. `CLAUDE.md` no coincide del todo con el código
- **`/cuenta`:** `CLAUDE.md:50` la describe como "pantalla de bienvenida ... aviso de que pronto se registrarán rutinas". En el código es un tablero con tres tarjetas (`app/cuenta/page.tsx:56-92`). Las líneas 53-55 del propio `CLAUDE.md` ya la describen así, de modo que el archivo se contradice a sí mismo.
- **Pestañas del admin:** `CLAUDE.md:51` las lista sin "Sesiones", pero existe (`app/admin/layout.tsx:16`).
- **Pestaña de inicio de cuenta:** `CLAUDE.md:51` la llama "Inicio"; en el código es "Mi cuenta" (`app/cuenta/layout.tsx:11`).
- **Llave secreta:** la regla de `CLAUDE.md:19` dice que solo se usa en el panel admin, pero también la usan `POST /api/signups` y `POST /api/feedback`, que son públicas (`app/api/signups/route.ts:13`, `app/api/feedback/route.ts:12`). `CLAUDE.md:49` sí lo reconoce; la regla de la línea 19 no.
- **Qué hacer mientras tanto:** ante una duda, fíate del código y no solo de `CLAUDE.md`.

### 2. Tres endpoints GET que ninguna pantalla llama
- **Cuáles:** `GET /api/sessions` (`app/api/sessions/route.ts:8`), `GET /api/goals` (`app/api/goals/route.ts:8`) y `GET /api/tips` (`app/api/tips/route.ts:6`).
- **Por qué se nota:** los `fetch` de `components/` y `app/` solo hacen POST, PATCH y DELETE (búsqueda de `/api/` en esas carpetas). Las páginas leen la base directamente en el servidor (`app/cuenta/page.tsx:26-32`, `app/cuenta/rutinas/page.tsx:11-17`, `app/cuenta/meta/page.tsx:17-24`).
- **Consecuencia:** repiten consultas que ya están en las páginas, y pueden desincronizarse. No los uses como referencia de cómo se pinta una pantalla.
- **Sin confirmar:** si algo fuera del repo (un script, una prueba manual) los llama.
- **Posible origen:** la skill `nueva-entidad` pide crear siempre un GET (`.claude/skills/nueva-entidad/SKILL.md`, paso 3). Es una hipótesis.

### 3. "Rutina" significa tres cosas distintas
- **La zona del cuerpo:** `ROUTINES` en `lib/routines.ts:2-9` (cuello, cadera, …). Es lo que guarda la columna `routine_sessions.rutina` (`supabase/migrations/20261012120000_create_routine_sessions.sql:7`) y también `tips.zona` (`supabase/migrations/20261013120000_create_tips.sql:8`).
- **La rutina guiada del cronómetro:** seis movimientos de un minuto (`components/RoutineWidget.tsx:6`, `components/RoutineWidget.tsx:10-23`). No tiene relación con la lista de zonas.
- **La sesión que alguien registra** a mano (`components/SessionForm.tsx`).
- **Pantallas parecidas con funciones distintas:**
  - `/cuenta/rutinas` registra sesiones (`app/cuenta/rutinas/page.tsx`).
  - `/admin/rutinas` muestra uso y abandono por zona (`app/admin/rutinas/page.tsx:32`).
  - `/admin/sesiones` lista las filas con su peso (`app/admin/sesiones/page.tsx:42`).
- **Nombre del archivo:** `lib/routines.ts` también contiene la validación del peso (`parsePeso`, `formatPeso`, `lib/routines.ts:30-43`), que no tiene que ver con zonas.

---

## Cosas que no pude confirmar (resumen)
- Si el Supabase remoto exige confirmar el correo al registrarse (`supabase/config.toml:225` solo cubre el entorno local).
- El contenido de las migraciones `20261003…`, `20261008…`, `20261024…` y `20261024130000…`, y de `app/api/auth/logout`, `app/api/tips`, `app/api/goals/[id]` y `app/api/admin/tips/[id]`: no se leyeron enteros.
- Qué hace exactamente `scripts/seed-datos-prueba.mjs`.
- Que ningún componente cliente no revisado hable con Supabase; solo se verificaron `AuthForm` y `SessionForm`.
- Si los `[REVISAR]` visibles son intencionales.
- Que lo descrito en `CLAUDE.md` sobre pagos e IA simulados corresponda a código: en las rutas de API no hay nada de pagos.
