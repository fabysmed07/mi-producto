import 'server-only';
import { getSupabaseSession, getUser } from './supabase-session';

// Registra la visita del día (una fila por usuario y día). Usa la llave pública y la sesión
// del usuario, así que RLS exige que solo registre la suya. Un fallo nunca rompe la página.
export async function recordVisit() {
  try {
    const user = await getUser();
    if (!user) return;
    const supabase = await getSupabaseSession();
    await supabase
      .from('visits')
      .upsert({ user_id: user.id }, { onConflict: 'user_id,day', ignoreDuplicates: true });
  } catch {
    // Las métricas no deben afectar la navegación.
  }
}
