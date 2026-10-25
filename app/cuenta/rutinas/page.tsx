import { redirect } from 'next/navigation';
import SessionForm from '@/components/SessionForm';
import SessionList from '@/components/SessionList';
import type { RoutineSession } from '@/lib/routines';
import { getSupabaseSession, getUser } from '@/lib/supabase-session';

export default async function RutinasPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/cuenta/rutinas');

  // Llave pública + sesión del usuario: RLS devuelve solo sus sesiones.
  const supabase = await getSupabaseSession();
  const { data, error } = await supabase
    .from('routine_sessions')
    .select('id,rutina,completado,nota,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  const sessions = (data ?? []) as RoutineSession[];

  return (
    <main className="wrap">
      <div className="topbar"><h1>Mis rutinas</h1></div>
      <div className="panel cuenta-card">
        <h2>Registrar una rutina</h2>
        <SessionForm />
      </div>
      <div className="panel cuenta-card cuenta-sessions">
        <h2>Mis sesiones</h2>
        {error ? (
          <p className="session-empty">No se pudieron cargar tus sesiones. Recarga la página.</p>
        ) : (
          <SessionList sessions={sessions} />
        )}
      </div>
    </main>
  );
}
