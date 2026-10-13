import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Cliente con la llave pública y la sesión del usuario (cookies). Solo en servidor.
export async function getSupabaseSession() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Desde un Server Component no se pueden escribir cookies; el middleware las refresca.
          }
        },
      },
    },
  );
}

// Valida el token contra Supabase (no confía solo en la cookie).
export async function getUser() {
  const supabase = await getSupabaseSession();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export { isAdminEmail } from './admin-emails';
