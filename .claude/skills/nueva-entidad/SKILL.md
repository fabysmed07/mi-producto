---
name: nueva-entidad
description: Agrega una entidad nueva a Soltura que cada usuario con sesión registra y ve solo lo suyo (tabla con RLS + migración aplicada + rutas /api con la sesión del usuario + página con lista y formulario + verificación con dos usuarios). Úsala cuando pidan "agregar/registrar una nueva entidad", un nuevo tipo de registro por usuario o algo equivalente a lo que se hizo con `routine_sessions`.
argument-hint: <nombre-entidad> <campo:tipo[:opciones]> ...
---

# nueva-entidad

Reproduce el patrón de `routine_sessions` para una entidad nueva. Argumentos (`$ARGUMENTS`): nombre de la entidad y sus datos.

Ejemplo: `/nueva-entidad habito nombre:text:max=60 hecho:boolean nota:text?:max=280 nivel:enum=bajo,medio,alto`

- `campo:tipo` con tipos `text`, `boolean`, `integer`, `enum=a,b,c`; un `?` tras el tipo lo hace opcional; `max=N` limita la longitud.
- Si falta el nombre o los datos, o hay algo ambiguo (tipos, qué es obligatorio), pregunta antes de escribir nada.

## Reglas del proyecto que NO se negocian (ver CLAUDE.md)
- El navegador nunca habla con la base: solo con rutas `/api`.
- Las rutas de usuario usan `getSupabaseSession()` (llave pública + cookies) en el servidor. **Nunca** `getSupabaseAdmin()` aquí: la llave secreta es solo del panel admin.
- Tabla nueva ⇒ RLS activo con sus policies **en la misma migración**.
- Cambios de base = migración en `supabase/migrations/`, aplicada con la CLI de Supabase.
- No cambies el diseño: reutiliza las clases de `app/(site)/globals.css` (`form-stack`, `field`, `btn`, `form-msg`) y `app/cuenta/cuenta.css` (`cuenta-card`, `cuenta-top`, `cuenta-back`, `session-*`).
- No hagas commits, branches ni cargues datos de prueba salvo lo indicado en el paso 5 (y limpia lo que crees). Copy y comentarios en español.

## Nombres
Deriva de la entidad (singular `x`, plural `xs`): tabla `public.<plural_snake>`, ruta `app/api/<plural>/route.ts`, página `app/cuenta/<plural>/page.tsx`, componentes `<Entidad>Form.tsx` y `<Entidad>List.tsx`, lib `lib/<plural>.ts`. Columnas en español y snake_case como el resto (`created_at` en inglés, igual que hoy).

## Pasos

### 1. Migración
Crea `supabase/migrations/<AAAAMMDDHHMMSS>_create_<tabla>.sql` (timestamp posterior a la última migración). Plantilla:

```sql
create table public.<tabla> (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- columnas de la entidad, con check de enum / longitud / not null
  created_at timestamptz not null default now()
);

create index <tabla>_user_created_idx on public.<tabla> (user_id, created_at desc);

alter table public.<tabla> enable row level security;

create policy "cada usuario lee lo suyo en <tabla>"
  on public.<tabla> for select to authenticated
  using (user_id = auth.uid());

create policy "cada usuario inserta lo suyo en <tabla>"
  on public.<tabla> for insert to authenticated
  with check (user_id = auth.uid());
```

- `user_id` lo fija `default auth.uid()`; el cliente nunca lo envía.
- Sin policies de update/delete salvo que lo pidan (si las piden: `using` y `with check` con `user_id = auth.uid()`).
- Enums como `text` + `check (col in (...))`; slugs sin tildes ni ñ.

### 2. Aplicar con la CLI de Supabase
```bash
supabase db push --dry-run   # debe listar solo la migración nueva
supabase db push
```
- Si falla con `ProjectRefNotLinkedError` o `AccessTokenRequiredError`: el usuario debe correr `supabase login` y `supabase link --project-ref <ref>` (el ref es el subdominio de `NEXT_PUBLIC_SUPABASE_URL`; pedirá la contraseña de la base). No pidas ni escribas tokens o contraseñas tú; indícaselo y espera.
- Comprueba que existe: `GET $NEXT_PUBLIC_SUPABASE_URL/rest/v1/<tabla>?select=id&limit=1` con la llave pública debe dar 200/401 con `[]`, no `PGRST205`.

### 3. Rutas de API con la sesión del usuario
Crea `lib/<plural>.ts` con la lista de valores válidos (enums), `label`, tipo TS de la fila y type guards, para compartir entre API y UI.

Crea `app/api/<plural>/route.ts`:
- `GET`: sin `getUser()` → 401; `getSupabaseSession()` → `.from('<tabla>').select('<columnas, sin user_id>').order('created_at', {ascending:false}).limit(50)`; error → log del `error.code` y 500.
- `POST`: 401 sin sesión; `request.json().catch(() => null)`; valida tipos, enums, longitudes y trim (vacío → `null` en opcionales) → 400 `{error:'invalid'}`; `insert` **sin** `user_id`; error → 500 `{error:'server'}`; éxito → 201 `{ok:true}`.
- Modela el archivo sobre `app/api/sessions/route.ts`.

### 4. Página con lista y formulario
- `app/cuenta/<plural>/page.tsx` (server component): `getUser()` → `redirect('/login?next=/cuenta/<plural>')`; consulta con `getSupabaseSession()` (RLS); layout `cuenta-top` con título + `LogoutButton`, enlace `<p className="cuenta-back"><Link href="/cuenta">← Volver a mi cuenta</Link></p>`, tarjeta con el formulario y tarjeta con la lista; manejo de error de carga.
- `components/<Entidad>Form.tsx` (client): modelado sobre `components/SessionForm.tsx` — `fetch('/api/<plural>', POST)`, 401 → `/login?next=...`, éxito → `form.reset()` + mensaje + `router.refresh()`.
- `components/<Entidad>List.tsx`: modelado sobre `components/SessionList.tsx`, con estado vacío y fecha con `toLocaleString('es', …)`.
- En `app/cuenta/page.tsx` agrega un enlace (`<p><Link href="/cuenta/<plural>">Administra mis <plural></Link></p>`) dentro de la tarjeta existente.
- El middleware ya exige sesión en `/cuenta/*`; no hace falta tocarlo.
- Estilos: solo si faltan, añade clases mínimas a `app/cuenta/cuenta.css`.

Después corre `npm run lint` (es `tsc --noEmit`) y corrige hasta que pase.

### 5. Verificación con dos usuarios
Objetivo: demostrar que A y B solo ven lo suyo y que RLS lo impone en la base (no solo en la UI).

1. Arranca el servidor con `preview_start` `next-dev` (o usa el que ya corre en :3000).
2. Crea **dos usuarios de prueba** desde `/registro` (o `POST /api/auth/signup`) con emails descartables y contraseñas generadas por ti; no repitas las contraseñas en el chat. Si el proyecto exige confirmación por correo y no puedes confirmar, detente y pídele al usuario que cree dos cuentas o las confirme.
3. Como A: registra al menos un registro (con y sin campos opcionales) y comprueba que aparece en la lista, más reciente primero.
4. Como B (sesión/cookies distintas): la lista de B está vacía; registra uno propio y comprueba que **solo** aparece el de B.
5. Como A de nuevo: sigue viendo solo el suyo.
6. Casos de API (con las cookies de cada usuario): sin cookie → 401; payload inválido (enum fuera de lista, texto demasiado largo) → 400; un `user_id` ajeno en el body se ignora (la fila queda con el id del usuario autenticado).
7. Confirma en la red que el navegador solo habla con `/api/*` (ninguna petición a `*.supabase.co`).
8. Limpia: borra las filas y los usuarios de prueba que creaste (con el panel de Supabase o pidiendo al usuario que lo haga; no uses la llave secreta desde rutas de usuario). Si no puedes borrarlos, dile al usuario cuáles quedaron.

## Cierre
- Actualiza `CLAUDE.md` (sección Arquitectura): tabla, ruta `/api/<plural>`, página y archivos de `lib/`.
- Reporta con honestidad: qué se creó, qué pasó en `lint`/`db push`, y qué pasos de verificación se hicieron o quedaron pendientes.
- No hagas commit ni push; ofrécelo al final.

## Fuera de alcance (menciónalo, no lo hagas sin que lo pidan)
Vista del admin con todas las filas (se haría en `app/admin/page.tsx` con la llave secreta), edición/borrado, integración con el widget.
