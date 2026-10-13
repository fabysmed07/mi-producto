import { NextResponse } from 'next/server';
import { getSupabaseSession, getUser } from '@/lib/supabase-session';
import { isRoutine } from '@/lib/routines';

const COLUMNS = 'id,rutina,completado,nota,created_at';

// Usa la llave pública y la sesión del usuario: RLS limita todo a sus propias filas.
export async function GET() {
  if (!(await getUser())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = await getSupabaseSession();
  const { data, error } = await supabase
    .from('routine_sessions')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.error('sessions select failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ sessions: data });
}

export async function POST(request: Request) {
  if (!(await getUser())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const nota = typeof body?.nota === 'string' ? body.nota.trim() : '';
  if (!isRoutine(body?.rutina) || typeof body?.completado !== 'boolean' || nota.length > 280) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  // user_id lo fija la base (default auth.uid()); nunca viene del cliente.
  const supabase = await getSupabaseSession();
  const { error } = await supabase
    .from('routine_sessions')
    .insert({ rutina: body.rutina, completado: body.completado, nota: nota || null });
  if (error) {
    console.error('sessions insert failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
