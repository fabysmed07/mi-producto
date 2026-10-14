import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';
import { isUuid, parseTipInput } from '@/lib/tips';

type Ctx = { params: Promise<{ id: string }> };

// Devuelve una respuesta de error si no es admin o el id no es válido; null si todo bien.
async function guard(ctx: Ctx) {
  const user = await getUser();
  if (!user) return { res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  if (!isAdminEmail(user.email)) return { res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  const { id } = await ctx.params;
  if (!isUuid(id)) return { res: NextResponse.json({ error: 'invalid' }, { status: 400 }) };
  return { id };
}

export async function PATCH(request: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.res) return g.res;

  const input = parseTipInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('tips')
    .update(input)
    .eq('id', g.id)
    .select('id');
  if (error) {
    console.error('tips update failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  if (!data?.length) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.res) return g.res;

  const { data, error } = await getSupabaseAdmin()
    .from('tips')
    .delete()
    .eq('id', g.id)
    .select('id');
  if (error) {
    console.error('tips delete failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  if (!data?.length) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
