-- Los formularios ahora escriben desde rutas de servidor (app/api/*) con la llave secreta,
-- que ignora RLS. Se retira el permiso de inserción directa desde el navegador.
-- Las políticas de lectura para usuarios autenticados no cambian.

drop policy if exists "cualquiera puede insertar en signups" on public.signups;
drop policy if exists "cualquiera puede insertar en feedback" on public.feedback;
