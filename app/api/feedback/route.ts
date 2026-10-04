import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const texto = typeof body?.texto === 'string' ? body.texto.trim() : '';
  const rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';
  if (!texto || texto.length > 2000 || rawEmail.length > 254) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('feedback')
    .insert({ email: rawEmail || null, texto });
  if (error) {
    console.error('feedback insert failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
