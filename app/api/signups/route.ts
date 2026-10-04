import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from('signups').insert({ email });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'duplicate' }, { status: 409 });
    console.error('signups insert failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
