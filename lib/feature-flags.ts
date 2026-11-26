import { getSupabaseSession } from '@/lib/supabase-session';

// Interruptores conocidos. Deben coincidir con las filas de la tabla `feature_flags`.
export const FEATURE_KEYS = ['contador_racha'] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const isFeatureKey = (v: unknown): v is FeatureKey => FEATURE_KEYS.includes(v as FeatureKey);

export type Flag = { enabled: boolean; enabledAt: string | null };

// Lee el estado con la llave pública y la sesión (RLS: SELECT para usuarios con sesión).
// Se llama en cada visita; ante cualquier fallo la feature queda apagada.
export async function getFlag(key: FeatureKey): Promise<Flag> {
  try {
    const supabase = await getSupabaseSession();
    const { data, error } = await supabase.from('feature_flags').select('enabled, enabled_at').eq('key', key).maybeSingle();
    if (error || !data) return { enabled: false, enabledAt: null };
    return { enabled: data.enabled === true, enabledAt: (data.enabled_at as string | null) ?? null };
  } catch {
    return { enabled: false, enabledAt: null };
  }
}
