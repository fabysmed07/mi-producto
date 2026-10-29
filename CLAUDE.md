# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

"Soltura": landing de rutinas de movilidad de seis minutos para quien pasa ocho horas sentado. Next.js 15 (App Router) + React 19 + TypeScript, con Supabase. Todo el copy y los comentarios están en español.

## Ficha del Proyecto
1. Quien usa mi app: la gente que pasa varias horas sentada en la oficina
2. Que registra (entidad principal): sesion de rutina, cada vez que alguien completa o abandona una rutina de 6 minutos
3. Sus datos (3 a 5): Rutina elegida (cuello, espalda baja, cadera, hombros, etc); Fecha y hora; Completado (Si/No); Nota opcional (hoy me dolia la lumbar)
4. Que ve cada uno: usuario ve solo lo suyo;
admin ve todas las sesiones, rutinas mas usadas, tasa de abandono
5. Que quiero probar: Que la gente regrese a la rutina dia con dia; si los 6 minutos se completan o se abandonan; que cada usuario vea solo lo suyo y el admin vea todo

## Reglas del Proyecto
- Next.js con rutas de API. El navegador nunca habla con la base.
- La llave secreta solo se usa en las rutas del panel admin.
- El panel admin solo es para los emails de ADMIN_EMAILS.
- Las rutas de la app consultan la base con la llave publica y la sesion del usuario, siempre en el servidor, para que se aplique el RLS.
- Toda tabla nueva tiene RLS activo, con reglas en la misma migracion.
- Los cambios en la base van como migracion en supabase/migrations/ y los aplicas tu con la CLI de Supabase.
- No cambies el diseño sin que te lo pida.
- No hagas commits ni cargues datos de prueba sin que te lo pida.
- Es un prototipo: pagos e IA se simulan.
- Nunca abras nuevos branches a menos que el usuario lo pida
- Usa la información de .env.local para la migración.
- Migraciones: la base de desarrollo (la de `.env.local`) la migras tú desde aquí. La de producción nunca: la migra Vercel en cada deploy de producción (`vercel.json`: `next build` y, solo si `VERCEL_ENV=production`, `supabase db push --db-url "$POSTGRES_URL_NON_POOLING"`). Si el build o una migración fallan, el deploy falla; en preview no se migra nada. Nunca corras `db push` ni SQL contra producción.

## Comandos

```bash
npm run dev     # servidor de desarrollo (puerto 3000; también como "next-dev" en .claude/launch.json)
npm run build
npm run start
npm run lint    # en realidad es `tsc --noEmit` (no hay ESLint)
```

No hay tests configurados.

Variables en `.env.local` (no versionado): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_EMAILS` (emails separados por coma con acceso a `/admin`).

## Arquitectura

- **Route groups**: `app/(site)` es la landing pública (`/`, con su propio `globals.css`); `app/admin` es el panel privado (`/admin`). La landing tiene su `globals.css`; las zonas con sesión (admin, cuenta, login/registro) comparten `app/shell.css` (tokens de Soltura, barra de navegación, paneles, botones, tablas apiladas en móvil) y añaden solo lo propio en `admin.css` / `cuenta.css`. Fuentes compartidas en `lib/fonts.ts`.
- **Escritura de formularios**: `SignupForm` y `FeedbackForm` hacen POST a `app/api/signups` y `app/api/feedback`. Estas rutas validan y insertan con `getSupabaseAdmin()` (`lib/supabase-server.ts`, llave secreta, `server-only`, ignora RLS). Los códigos de error se mapean a HTTP (p. ej. `23505` → 409 `duplicate`).
- **Auth**: registro/login/logout por email y contraseña vía `app/api/auth/*`, con sesión en cookies (`@supabase/ssr`) usando `lib/supabase-session.ts` (`getUser()`, `isAdminEmail()`). `middleware.ts` refresca la sesión y manda `/admin` a `/login?next=…` sin sesión; las páginas `(auth)` son `/login` y `/registro`. `/cuenta` (`app/cuenta`) es la pantalla de bienvenida tras registrarse/ingresar (saludo, logout, aviso de que pronto se registrarán rutinas); también exige sesión. El navegador no usa cliente de Supabase.
- **Admin**: `middleware.ts`, `app/admin/layout.tsx` y `app/admin/page.tsx` exigen sesión **y** email en `ADMIN_EMAILS` (sin permiso: aviso 403 en `/cuenta/sin-acceso`); `app/admin/layout.tsx` y `app/cuenta/layout.tsx` muestran `components/SiteNav.tsx` (barra compartida; la marca lleva a `/`; en cuenta: Inicio · Mis rutinas · Mi meta · Tips, y "Panel admin" solo para admins; en admin:  Resumen `/admin`, Signups, Feedback, Métricas, Metas, Rutinas, Tips; con "Mi cuenta" y logout). Cada pestaña es su página en `app/admin/*` y lee en el servidor con la llave secreta: `/admin` (tarjetas con conteos), `/admin/signups` (`AdminSignups`, con CSV), `/admin/feedback` (`AdminFeedback`), `/admin/rutinas` (solo lectura: uso y abandono por rutina desde `routine_sessions`).
- **Seguridad en BD**: las migraciones en `supabase/migrations/` dejan RLS activa; la segunda migración elimina las políticas de INSERT públicas, así que el navegador no puede escribir directamente: toda escritura pasa por las rutas `/api`. La migración `20261008…` quita el SELECT para `authenticated` (cualquiera puede registrarse). No importes `lib/supabase-server.ts` desde código cliente.
- **Sesiones de rutina**: tabla `routine_sessions` (migración `20261012…`, RLS: cada usuario lee/inserta solo lo suyo; `user_id` lo fija `default auth.uid()`). `app/api/sessions` (GET/POST) y `app/cuenta/page.tsx` la consultan con `getSupabaseSession()` (llave pública + sesión, nunca la secreta) para que se aplique RLS. `/cuenta` es un tablero con tres tarjetas (rutinas de la semana, avance de la meta, último tip; todo con `getSupabaseSession()`); `/cuenta/rutinas` muestra `SessionForm` + `SessionList`. Rutinas válidas en `lib/routines.ts` (deben coincidir con el check de la tabla).
- **Meta semanal**: tabla `weekly_goals` (migración `20261022…`, RLS: cada usuario lee/inserta solo lo suyo; `user_id` por `default auth.uid()`; sin update: cada meta nueva es una fila; el usuario puede borrar las suyas con `DELETE /api/goals/[id]` (policy de delete, migración `20261024130000…`, que además hace que el trigger del tope tome un bloqueo por usuario) y la vigente es la más reciente con `fecha_inicio` ≤ hoy UTC). `app/api/goals` (GET/POST) y `/cuenta/meta` (`GoalForm`, `GoalList`) usan `getSupabaseSession()`. Validación en `lib/goals.ts` (1–7 días, fecha `yyyy-mm-dd` entre 30 días atrás y 365 adelante; la fecha por defecto del formulario es la local del navegador; tope de 50 metas por usuario, con respuesta 409 `limit`, impuesto también por trigger y un check de rango amplio en la migración `20261024…`). `/cuenta/meta` muestra el progreso de la semana y la etiqueta de cada meta (Vigente / Aún no inicia / Reemplazada). El admin ve todas en `/admin/metas` (llave secreta, solo `ADMIN_EMAILS`): "cumple" = en la semana actual (lunes–domingo UTC, desde `fecha_inicio` si es posterior) tiene rutinas con `completado = true` en al menos `dias_por_semana` días distintos.
- **Tips**: tabla `tips` global (migración `20261013…`, RLS: solo SELECT para `authenticated`; sin policies de escritura). Los usuarios leen con `getSupabaseSession()` en `app/api/tips` (GET) y `/cuenta/tips`. Solo el admin crea/edita/borra: `app/api/admin/tips` (POST) y `app/api/admin/tips/[id]` (PATCH/DELETE) verifican `isAdminEmail` y escriben con la llave secreta; la gestión vive en `/admin/tips` (`components/AdminTipForm.tsx`). Zonas/complejidad/validación en `lib/tips.ts` (zonas = `lib/routines.ts`).
- **Widget de rutina**: `RoutineWidget` (reloj/ejercicios) se registra en `RoutineProvider` (`components/RoutineContext.tsx`) con `register(fn)`; los CTA (`CtaLink`: menú, hero, cierre) llaman `start()` del contexto para subir al widget y arrancar la rutina sin acoplarse entre sí.
- Alias de imports: `@/` apunta a la raíz del repo.

## Métricas

Página `/admin/metricas` (`app/admin/metricas/page.tsx`, solo `ADMIN_EMAILS`). Lee en el servidor con la llave secreta: usuarios de Auth, `routine_sessions` y `visits`. Todos los días y semanas son UTC (semanas de lunes a domingo). Los admins cuentan como cualquier usuario.

| Métrica | Pregunta que responde | Cómo se calcula |
|---|---|---|
| Usuarios registrados | ¿Cuánta gente llegó? | Total de usuarios de Auth. |
| Activación | ¿Quienes se registran llegan a usar la rutina? | Usuarios con al menos una fila en `routine_sessions` ÷ usuarios registrados. |
| Retorno | ¿La gente vuelve a la app en días distintos? | Usuarios con al menos 2 valores distintos de `day` en `visits` ÷ usuarios registrados. |
| Finalización | ¿Los 6 minutos se completan o se abandonan? | Sesiones con `completado = true` ÷ sesiones totales. |
| Finalización por rutina | ¿Hay rutinas que se abandonan más que otras? | Lo mismo que Finalización, agrupado por `rutina`; tabla con las seis de `lib/routines.ts`. |
| Regreso con rutina completada | ¿Regresan día con día a hacer la rutina, no solo a abrir la app? | Usuarios con `completado = true` en al menos 2 días distintos (`created_at`) ÷ usuarios con al menos una sesión. |
| Gráfico semanal (últimas 8 semanas) | ¿Crece la base y vuelve la gente? | Usuarios nuevos por `created_at` y usuarios distintos con al menos una visita en la semana. |

- **Visitas**: tabla `visits` (una fila por usuario y día, `unique (user_id, day)`, RLS: cada usuario registra y lee solo las suyas). `recordVisit()` en `lib/visits.ts` se llama desde `app/cuenta/layout.tsx` con la llave pública y la sesión del usuario; un fallo nunca rompe la página. Solo hay datos desde que existe la tabla.
- **Límites**: `completado` lo marca el usuario a mano, así que la finalización mide lo declarado. No se guarda duración ni punto de abandono. Con menos de 10 sesiones la página avisa de muestra pequeña.