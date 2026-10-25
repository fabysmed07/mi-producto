import { NextResponse } from 'next/server';
import { getSupabaseSession, getUser } from '@/lib/supabase-session';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Usa la llave pública y la sesión del usuario: RLS solo deja borrar sus propias metas.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getUser())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const supabase = await getSupabaseSession();
  const { data, error } = await supabase.from('weekly_goals').delete().eq('id', id).select('id');
  if (error) {
    console.error('goals delete failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  if (!data || data.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
