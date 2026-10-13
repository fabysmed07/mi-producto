-- Ahora cualquier persona puede registrarse y ser "authenticated". La lectura de signups y
-- feedback pasa por app/api/admin/data (llave secreta, solo emails de ADMIN_EMAILS),
-- así que se retira el SELECT directo para authenticated.

drop policy if exists "solo autenticados leen signups" on public.signups;
drop policy if exists "solo autenticados leen feedback" on public.feedback;
