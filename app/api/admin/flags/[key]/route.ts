import { NextResponse } from 'next/server';
import { isFeatureKey } from '@/lib/feature-flags';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

type Ctx = { params: Promise<{ key: string }> };

// Enciende o apaga un interruptor. Solo ADMIN_EMAILS; escribe con la llave secreta.
export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { key } = await ctx.params;
  const body = (await request.json().catch(() => null)) as { enabled?: unknown } | null;
  if (!isFeatureKey(key) || typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('feature_flags')
    .update({ enabled: body.enabled })
    .eq('key', key)
    .select('enabled, enabled_at');
  if (error) {
    console.error('feature_flags update failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  if (!data?.length) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, enabled: data[0].enabled });
}
