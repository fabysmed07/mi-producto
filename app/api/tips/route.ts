import { NextResponse } from 'next/server';
import { getSupabaseSession, getUser } from '@/lib/supabase-session';
import { TIP_COLUMNS } from '@/lib/tips';

// Solo lectura: llave pública + sesión del usuario (RLS). Crear/editar/borrar es solo del admin.
export async function GET() {
  if (!(await getUser())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = await getSupabaseSession();
  const { data, error } = await supabase
    .from('tips')
    .select(TIP_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('tips select failed:', error.code);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ tips: data });
}
