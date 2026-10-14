import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';
import { parseTipInput } from '@/lib/tips';

// Panel admin: crea tips con la llave secreta, solo para emails de ADMIN_EMAILS.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const input = parseTipInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { error } = await getSupabaseAdmin().from('tips').insert(input);
  if (error) {
    console.error('tips insert failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
