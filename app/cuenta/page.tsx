import Link from 'next/link';
import { redirect } from 'next/navigation';
import { routineLabel } from '@/lib/routines';
import type { WeeklyGoal } from '@/lib/goals';
import { getSupabaseSession, getUser } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

// Lunes (UTC) de la semana que contiene a `d`.
function weekStart(d: Date) {
  const day = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
}

export default async function CuentaPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/cuenta');

  // Llave pública + sesión del usuario: RLS devuelve solo lo suyo (y los tips, que son globales).
  const supabase = await getSupabaseSession();
  const now = new Date();
  const monday = iso(weekStart(now));
  const [weekRes, lastRes, goalsRes, tipRes] = await Promise.all([
    supabase.from('routine_sessions').select('completado, created_at').gte('created_at', monday + 'T00:00:00Z'),
    supabase.from('routine_sessions').select('rutina, created_at').order('created_at', { ascending: false }).limit(1),
    // La meta vigente directo: la más reciente con inicio ≤ hoy (UTC), sin depender de cuántas metas haya.
    supabase.from('weekly_goals').select('id, dias_por_semana, fecha_inicio, created_at').lte('fecha_inicio', iso(now)).order('created_at', { ascending: false }).limit(1),
    supabase.from('tips').select('consejo_dia').order('created_at', { ascending: false }).limit(1),
  ]);

  const week = weekRes.data ?? [];
  const last = lastRes.data?.[0];
  const goal = ((goalsRes.data ?? []) as WeeklyGoal[])[0];
  const tip = tipRes.data?.[0]?.consejo_dia as string | undefined;

  // Días distintos (UTC) con rutina completada desde el lunes, o desde el inicio de la meta si es posterior.
  const from = goal && goal.fecha_inicio > monday ? goal.fecha_inicio : monday;
  const doneDays = new Set(
    week.filter((s) => s.completado).map((s) => (s.created_at as string).slice(0, 10)).filter((d) => d >= from),
  ).size;

  const lastText = last
    ? `Última: ${routineLabel(last.rutina as string)}, ${new Date(last.created_at as string).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`
    : 'Aún no registras ninguna.';

  return (
    <main className="wrap">
      <div className="topbar">
        <h1>Hola, <span className="cuenta-email">{user.email}</span></h1>
      </div>
      <p className="page-sub">Así va tu semana.</p>

      <div className="summary-cards">
        <Link href="/cuenta/rutinas" className="panel summary-card">
          <div className="metric-label">Mis rutinas</div>
          <div className="summary-main">{weekRes.error ? '—' : week.length}<small>esta semana</small></div>
          <div className="metric-hint">{lastText}</div>
          <span className="summary-cta">Registrar una rutina →</span>
        </Link>

        <Link href="/cuenta/meta" className="panel summary-card">
          <div className="metric-label">Mi meta semanal</div>
          {goalsRes.error ? (
            <>
              <div className="summary-main">—</div>
              <div className="metric-hint">No se pudo cargar tu meta. Recarga la página.</div>
              <span className="summary-cta">Ver mi meta →</span>
            </>
          ) : goal ? (
            <>
              <div className="summary-main">{doneDays} de {goal.dias_por_semana}<small>{goal.dias_por_semana === 1 ? 'día' : 'días'}</small></div>
              <div className="metric-hint">{doneDays >= goal.dias_por_semana ? '¡Cumpliste tu meta de esta semana!' : 'Días con rutina completada esta semana.'}</div>
              <span className="summary-cta">Cambiar mi meta →</span>
            </>
          ) : (
            <>
              <div className="summary-main">—</div>
              <div className="metric-hint">Aún no fijas una meta.</div>
              <span className="summary-cta">Fijar mi meta →</span>
            </>
          )}
        </Link>

        <Link href="/cuenta/tips" className="panel summary-card">
          <div className="metric-label">Tips</div>
          {tip ? <p className="summary-quote">{tip}</p> : <div className="metric-hint" style={{ margin: '8px 0 6px' }}>Todavía no hay tips.</div>}
          <span className="summary-cta">Ver todos los tips →</span>
        </Link>
      </div>
    </main>
  );
}
