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

- **Route groups**: `app/(site)` es la landing pública (`/`, con su propio `globals.css`); `app/admin` es el panel privado (`/admin`, con `admin.css` y layout propios). Los estilos de cada zona están separados.
- **Escritura de formularios**: `SignupForm` y `FeedbackForm` hacen POST a `app/api/signups` y `app/api/feedback`. Estas rutas validan y insertan con `getSupabaseAdmin()` (`lib/supabase-server.ts`, llave secreta, `server-only`, ignora RLS). Los códigos de error se mapean a HTTP (p. ej. `23505` → 409 `duplicate`).
- **Auth**: registro/login/logout por email y contraseña vía `app/api/auth/*`, con sesión en cookies (`@supabase/ssr`) usando `lib/supabase-session.ts` (`getUser()`, `isAdminEmail()`). `middleware.ts` refresca la sesión y manda `/admin` a `/login?next=…` sin sesión; las páginas `(auth)` son `/login` y `/registro`. `/cuenta` (`app/cuenta`) es la pantalla de bienvenida tras registrarse/ingresar (saludo, logout, aviso de que pronto se registrarán rutinas); también exige sesión. El navegador no usa cliente de Supabase.
- **Admin**: `middleware.ts`, `app/admin/layout.tsx` y `app/admin/page.tsx` exigen sesión **y** email en `ADMIN_EMAILS` (sin permiso: aviso 403 en `/cuenta/sin-acceso`); `app/admin/page.tsx` lee `signups`/`feedback` en el servidor con la llave secreta y los pasa a `components/AdminDashboard.tsx`.
- **Seguridad en BD**: las migraciones en `supabase/migrations/` dejan RLS activa; la segunda migración elimina las políticas de INSERT públicas, así que el navegador no puede escribir directamente: toda escritura pasa por las rutas `/api`. La migración `20261008…` quita el SELECT para `authenticated` (cualquiera puede registrarse). No importes `lib/supabase-server.ts` desde código cliente.
- **Widget de rutina**: `RoutineWidget` (reloj/ejercicios) se registra en `RoutineProvider` (`components/RoutineContext.tsx`) con `register(fn)`; los CTA (`CtaLink`: menú, hero, cierre) llaman `start()` del contexto para subir al widget y arrancar la rutina sin acoplarse entre sí.
- Alias de imports: `@/` apunta a la raíz del repo.
