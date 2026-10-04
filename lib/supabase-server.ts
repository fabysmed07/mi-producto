import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cliente con la llave secreta: solo se importa desde rutas de servidor.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
