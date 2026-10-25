import { notFound } from 'next/navigation';
import { ROUTINES } from '@/lib/routines';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

const pct = (n: number, total: number) => (total === 0 ? '—' : `${Math.round((n / total) * 100)}%`);

export default async function RutinasPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const { data, error } = await getSupabaseAdmin().from('routine_sessions').select('rutina, completado');
  if (error) {
    return (
      <div className="wrap">
        <div className="topbar"><h1>Rutinas</h1></div>
        <div className="panel"><div className="loading">No se pudieron cargar las rutinas. Probá recargar la página.</div></div>
      </div>
    );
  }

  const byRoutine = new Map<string, { total: number; done: number }>();
  for (const s of data ?? []) {
    const r = byRoutine.get(s.rutina as string) ?? { total: 0, done: 0 };
    r.total++;
    if (s.completado) r.done++;
    byRoutine.set(s.rutina as string, r);
  }
  // Más usadas primero.
  const rows = ROUTINES.map((r) => ({ label: r.label, ...(byRoutine.get(r.value) ?? { total: 0, done: 0 }) }))
    .sort((a, b) => b.total - a.total);
  const total = rows.reduce((n, r) => n + r.total, 0);
  const done = rows.reduce((n, r) => n + r.done, 0);

  return (
    <div className="wrap">
      <div className="topbar"><h1>Rutinas</h1></div>

      <div className="metric-cards">
        <div className="panel">
          <div className="metric-label">Sesiones totales</div>
          <div className="metric-value">{total}</div>
          <div className="metric-hint">{done} completadas.</div>
        </div>
        <div className="panel">
          <div className="metric-label">Tasa de abandono</div>
          <div className="metric-value">{pct(total - done, total)}</div>
          <div className="metric-hint">{total - done} de {total} sesiones no se completaron.</div>
        </div>
        <div className="panel">
          <div className="metric-label">Más usada</div>
          <div className="metric-value" style={{ fontSize: 24 }}>{total === 0 ? '—' : rows[0].label}</div>
          <div className="metric-hint">{total === 0 ? 'Aún no hay sesiones.' : `${rows[0].total} sesiones.`}</div>
        </div>
      </div>

      <div className="panel">
        <div className="section-header"><h2>Uso por rutina</h2></div>
        <table className="stack">
          <thead><tr><th>Rutina</th><th>Sesiones</th><th>Completadas</th><th>Abandono</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}><td data-label="Rutina">{r.label}</td><td data-label="Sesiones">{r.total}</td><td data-label="Completadas">{r.done}</td><td data-label="Abandono">{pct(r.total - r.done, r.total)}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="metric-hint">El usuario marca si completó la rutina; el abandono mide lo declarado.</p>
      </div>
    </div>
  );
}
