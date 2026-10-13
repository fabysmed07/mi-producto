import { NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 400 });
  }

  const supabase = await getSupabaseSession();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.status === 429) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
    if (error.code === 'weak_password') return NextResponse.json({ error: 'invalid_password' }, { status: 400 });
    console.error('signUp failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  // Sin sesión = el proyecto exige confirmar el email (o el email ya existía).
  return NextResponse.json({ ok: true, needsConfirmation: !data.session }, { status: 201 });
}
