import { redirect } from 'next/navigation';
import TipList from '@/components/TipList';
import { getSupabaseSession, getUser } from '@/lib/supabase-session';
import { TIP_COLUMNS, type Tip } from '@/lib/tips';

export default async function TipsPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/cuenta/tips');

  // Llave pública + sesión del usuario: RLS solo permite leer.
  const supabase = await getSupabaseSession();
  const { data, error } = await supabase
    .from('tips')
    .select(TIP_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <main className="wrap">
      <div className="topbar"><h1>Tips</h1></div>
      <div className="panel cuenta-card cuenta-sessions">
        {error ? (
          <p className="session-empty">No se pudieron cargar los tips. Recarga la página.</p>
        ) : (
          <TipList tips={(data ?? []) as Tip[]} />
        )}
      </div>
    </main>
  );
}
