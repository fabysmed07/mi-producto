import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Solo para el login del admin y su lectura bajo RLS. Usa la llave pública.
let client: SupabaseClient | null = null;

export function getSupabaseBrowser() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
  }
  return client;
}
