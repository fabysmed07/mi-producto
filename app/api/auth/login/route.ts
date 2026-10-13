import { NextResponse } from 'next/server';
import { getSupabaseSession, isAdminEmail } from '@/lib/supabase-session';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const supabase = await getSupabaseSession();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
    if (error.code === 'email_not_confirmed') return NextResponse.json({ error: 'not_confirmed' }, { status: 401 });
    return NextResponse.json({ error: 'credentials' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, admin: isAdminEmail(data.user?.email) });
}
