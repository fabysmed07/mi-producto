import { NextResponse } from 'next/server';
import { getSupabaseSession, getUser } from '@/lib/supabase-session';
import { isGoalDays, isGoalStart, MAX_GOALS } from '@/lib/goals';

const COLUMNS = 'id,dias_por_semana,fecha_inicio,created_at';

// Usa la llave pública y la sesión del usuario: RLS limita todo a sus propias filas.
export async function GET() {
  if (!(await getUser())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = await getSupabaseSession();
  const { data, error } = await supabase
    .from('weekly_goals')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(MAX_GOALS);
  if (error) {
    console.error('goals select failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ goals: data });
}

export async function POST(request: Request) {
  if (!(await getUser())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!isGoalDays(body?.dias_por_semana)) {
    return NextResponse.json({ error: 'invalid', field: 'dias_por_semana' }, { status: 400 });
  }
  if (!isGoalStart(body?.fecha_inicio, new Date().toISOString().slice(0, 10))) {
    return NextResponse.json({ error: 'invalid', field: 'fecha_inicio' }, { status: 400 });
  }

  // user_id lo fija la base (default auth.uid()); nunca viene del cliente.
  const supabase = await getSupabaseSession();
  const { count, error: countError } = await supabase.from('weekly_goals').select('id', { count: 'exact', head: true });
  if (!countError && (count ?? 0) >= MAX_GOALS) {
    return NextResponse.json({ error: 'limit' }, { status: 409 });
  }
  const { error } = await supabase
    .from('weekly_goals')
    .insert({ dias_por_semana: body.dias_por_semana, fecha_inicio: body.fecha_inicio });
  if (error) {
    // El trigger de la base también impone el tope si dos envíos se cruzan.
    if (error.message?.includes('limite_metas')) return NextResponse.json({ error: 'limit' }, { status: 409 });
    console.error('goals insert failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
