import { redirect } from 'next/navigation';
import GoalForm from '@/components/GoalForm';
import GoalList from '@/components/GoalList';
import { MAX_GOALS, currentGoal, weekStartIso, type WeeklyGoal } from '@/lib/goals';
import { getSupabaseSession, getUser } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

export default async function MetaPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/cuenta/meta');

  // Llave pública + sesión del usuario: RLS devuelve solo sus metas y sesiones.
  const supabase = await getSupabaseSession();
  const today = new Date().toISOString().slice(0, 10);
  const monday = weekStartIso(today);
  const [goalsRes, sessionsRes] = await Promise.all([
    supabase
      .from('weekly_goals')
      .select('id,dias_por_semana,fecha_inicio,created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_GOALS),
    supabase.from('routine_sessions').select('created_at').eq('completado', true).gte('created_at', monday + 'T00:00:00Z'),
  ]);
  const goals = (goalsRes.data ?? []) as WeeklyGoal[];

  // Progreso: días distintos (UTC) con rutina completada desde el lunes, o desde el inicio de la meta si es posterior.
  const goal = currentGoal(goals, today);
  const from = goal && goal.fecha_inicio > monday ? goal.fecha_inicio : monday;
  const doneDays = new Set(
    (sessionsRes.data ?? []).map((s) => (s.created_at as string).slice(0, 10)).filter((d) => d >= from),
  ).size;

  return (
    <main className="wrap">
      <div className="topbar"><h1>Mi meta semanal</h1></div>
      {goal && !goalsRes.error && (
        <div className="panel cuenta-card">
          <div className="metric-label">Esta semana</div>
          {sessionsRes.error ? (
            <div className="metric-hint">No se pudo cargar tu progreso. Recarga la página.</div>
          ) : (
            <>
              <div className="summary-main">{doneDays} de {goal.dias_por_semana}<small>{goal.dias_por_semana === 1 ? 'día' : 'días'}</small></div>
              <div className="metric-hint">
                {doneDays >= goal.dias_por_semana ? '¡Cumpliste tu meta de esta semana!' : 'Días con rutina completada esta semana.'}
              </div>
            </>
          )}
        </div>
      )}
      <div className="panel cuenta-card">
        <h2>Fijar una meta</h2>
        <GoalForm />
      </div>
      <div className="panel cuenta-card cuenta-sessions">
        <h2>Mis metas</h2>
        {goalsRes.error ? (
          <p className="session-empty">No se pudieron cargar tus metas. Recarga la página.</p>
        ) : (
          <GoalList goals={goals} />
        )}
      </div>
    </main>
  );
}
