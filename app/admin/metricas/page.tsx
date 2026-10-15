import Link from 'next/link';
import { notFound } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { ROUTINES } from '@/lib/routines';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

const WEEKS = 8;
const DAY_MS = 86_400_000;

// Lunes (UTC) de la semana que contiene a `d`, como yyyy-mm-dd.
function weekStart(d: Date) {
  const day = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const pct = (n: number, total: number) => (total === 0 ? '—' : `${Math.round((n / total) * 100)}%`);

async function listAllUsers() {
  const admin = getSupabaseAdmin();
  const users: { id: string; created_at: string }[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    users.push(...data.users.map((u) => ({ id: u.id, created_at: u.created_at })));
    if (data.users.length < 1000) return users;
  }
}

export default async function MetricasPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const admin = getSupabaseAdmin();
  const [users, sessionsRes, visitsRes] = await Promise.all([
    listAllUsers(),
    admin.from('routine_sessions').select('user_id, rutina, completado, created_at'),
    admin.from('visits').select('user_id, day'),
  ]);

  const failed = !users || sessionsRes.error || visitsRes.error;
  if (failed) {
    return (
      <div className="wrap">
        <p className="back"><Link href="/admin">← Volver al panel admin</Link></p>
        <div className="topbar"><h1>Métricas</h1><LogoutButton className="secondary" /></div>
        <div className="panel"><div className="loading">No se pudieron cargar las métricas. Probá recargar la página.</div></div>
      </div>
    );
  }

  const total = users.length;
  const sessions = sessionsRes.data ?? [];
  const activated = new Set(sessions.map((r) => r.user_id as string));

  // Finalización: sesiones completadas / sesiones totales, global y por rutina.
  const byRoutine = new Map<string, { total: number; done: number }>();
  const doneDays = new Map<string, Set<string>>();
  let doneTotal = 0;
  for (const s of sessions) {
    const r = byRoutine.get(s.rutina as string) ?? { total: 0, done: 0 };
    r.total++;
    if (s.completado) {
      r.done++;
      doneTotal++;
      const days = doneDays.get(s.user_id as string) ?? new Set<string>();
      days.add((s.created_at as string).slice(0, 10));
      doneDays.set(s.user_id as string, days);
    }
    byRoutine.set(s.rutina as string, r);
  }
  const doneReturners = [...doneDays.values()].filter((d) => d.size >= 2).length;
  const routineRows = ROUTINES.map((r) => ({ label: r.label, ...(byRoutine.get(r.value) ?? { total: 0, done: 0 }) }));
  const lowSample = sessions.length < 10;
  const daysByUser = new Map<string, Set<string>>();
  for (const v of visitsRes.data ?? []) {
    const set = daysByUser.get(v.user_id as string) ?? new Set<string>();
    set.add(v.day as string);
    daysByUser.set(v.user_id as string, set);
  }
  const activatedCount = users.filter((u) => activated.has(u.id)).length;
  const returnedCount = users.filter((u) => (daysByUser.get(u.id)?.size ?? 0) >= 2).length;

  // Por semana: usuarios nuevos y usuarios con al menos una visita.
  const thisWeek = weekStart(new Date());
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(thisWeek.getTime() - (WEEKS - 1 - i) * 7 * DAY_MS);
    return { key: iso(start), nuevos: 0, activos: new Set<string>() };
  });
  const byKey = new Map(weeks.map((w) => [w.key, w]));
  for (const u of users) {
    const w = byKey.get(iso(weekStart(new Date(u.created_at))));
    if (w) w.nuevos++;
  }
  for (const v of visitsRes.data ?? []) {
    const w = byKey.get(iso(weekStart(new Date(v.day + 'T00:00:00Z'))));
    if (w) w.activos.add(v.user_id as string);
  }
  const series = weeks.map((w) => ({ key: w.key, nuevos: w.nuevos, activos: w.activos.size }));
  const max = Math.max(1, ...series.flatMap((s) => [s.nuevos, s.activos]));

  const W = 640, H = 240, padL = 32, padB = 28, padT = 12;
  const plotW = W - padL, plotH = H - padB - padT;
  const group = plotW / series.length;
  const bar = Math.min(26, group / 2 - 4);
  const y = (n: number) => padT + plotH - (n / max) * plotH;

  const cards = [
    { label: 'Usuarios registrados', value: String(total), hint: 'Cuentas creadas en total.' },
    { label: 'Activación', value: pct(activatedCount, total), hint: `${activatedCount} de ${total} crearon al menos un registro de rutina.` },
    { label: 'Retorno', value: pct(returnedCount, total), hint: `${returnedCount} de ${total} entraron en al menos dos días distintos.` },
    { label: 'Finalización', value: pct(doneTotal, sessions.length), hint: `${doneTotal} de ${sessions.length} sesiones se completaron.` },
    { label: 'Regreso con rutina completada', value: pct(doneReturners, activated.size), hint: `${doneReturners} de ${activated.size} usuarios con registros completaron una rutina en al menos dos días distintos.` },
  ];

  return (
    <div className="wrap">
      <p className="back"><Link href="/admin">← Volver al panel admin</Link></p>
      <div className="topbar">
        <h1>Métricas</h1>
        <LogoutButton className="secondary" />
      </div>

      <div className="metric-cards">
        {cards.map((c) => (
          <div className="panel" key={c.label}>
            <div className="metric-label">{c.label}</div>
            <div className="metric-value">{c.value}</div>
            <div className="metric-hint">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <h2>Finalización por rutina</h2>
        </div>
        <table>
          <thead><tr><th>Rutina</th><th>Sesiones</th><th>Completadas</th><th>Finalización</th></tr></thead>
          <tbody>
            {routineRows.map((r) => (
              <tr key={r.label}><td>{r.label}</td><td>{r.total}</td><td>{r.done}</td><td>{pct(r.done, r.total)}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="metric-hint">
          {lowSample ? 'Muestra pequeña (menos de 10 sesiones): los porcentajes todavía no son confiables. ' : ''}
          El usuario marca si completó la rutina; la tasa mide lo declarado. Los días se cuentan en UTC.
        </p>
      </div>

      <div className="panel">
        <div className="section-header">
          <h2>Por semana (últimas {WEEKS})</h2>
          <div className="legend">
            <span><i className="dot dot-new" /> Usuarios nuevos</span>
            <span><i className="dot dot-active" /> Usuarios que entraron</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="metric-chart" role="img" aria-label="Usuarios nuevos y usuarios que entraron por semana">
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={padL} x2={W} y1={y(max * t)} y2={y(max * t)} className="grid" />
              <text x={padL - 6} y={y(max * t) + 4} textAnchor="end" className="axis">{Math.round(max * t)}</text>
            </g>
          ))}
          {series.map((s, i) => {
            const cx = padL + group * i + group / 2;
            return (
              <g key={s.key}>
                <rect x={cx - bar - 2} y={y(s.nuevos)} width={bar} height={padT + plotH - y(s.nuevos)} className="bar-new">
                  <title>{`Semana del ${s.key}: ${s.nuevos} nuevos`}</title>
                </rect>
                <rect x={cx + 2} y={y(s.activos)} width={bar} height={padT + plotH - y(s.activos)} className="bar-active">
                  <title>{`Semana del ${s.key}: ${s.activos} entraron`}</title>
                </rect>
                <text x={cx} y={H - 8} textAnchor="middle" className="axis">{s.key.slice(5)}</text>
              </g>
            );
          })}
        </svg>
        <p className="metric-hint">Semanas de lunes a domingo (UTC); la etiqueta es el lunes (mm-dd). Las visitas se cuentan desde que existe la tabla <code>visits</code>.</p>
      </div>
    </div>
  );
}
