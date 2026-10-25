import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const pct = (n: number, total: number) => (total === 0 ? '—' : `${Math.round((n / total) * 100)}%`);

// Lunes (UTC) de la semana que contiene a `d`.
function weekStart(d: Date) {
  const day = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
}

async function listAllUsers() {
  const admin = getSupabaseAdmin();
  const users: { id: string; email: string }[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    users.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? '(sin email)' })));
    if (data.users.length < 1000) return users;
  }
}

const PAGE_SIZE = 1000;

// PostgREST corta cada respuesta (~1000 filas): se pide por páginas para no truncar sin avisar.
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[] | null> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error || !data) return null;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

export default async function MetasPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const admin = getSupabaseAdmin();
  const monday = iso(weekStart(new Date()));
  const [users, goalRows, sessionRows] = await Promise.all([
    listAllUsers(),
    fetchAll((from, to) =>
      admin.from('weekly_goals').select('id, user_id, dias_por_semana, fecha_inicio, created_at')
        .order('created_at', { ascending: false }).order('id').range(from, to),
    ),
    // Solo cuenta la semana actual: se filtra desde el lunes (UTC) en la consulta.
    fetchAll((from, to) =>
      admin.from('routine_sessions').select('id, user_id, created_at')
        .eq('completado', true).gte('created_at', monday + 'T00:00:00Z').order('id').range(from, to),
    ),
  ]);

  if (!users || !goalRows || !sessionRows) {
    return (
      <div className="wrap">
        <div className="topbar"><h1>Metas semanales</h1></div>
        <div className="panel"><div className="loading">No se pudieron cargar las metas. Probá recargar la página.</div></div>
      </div>
    );
  }

  const today = iso(new Date());
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  // Días distintos (UTC) con rutina completada, por usuario.
  const doneDays = new Map<string, Set<string>>();
  for (const s of sessionRows) {
    const set = doneDays.get(s.user_id as string) ?? new Set<string>();
    set.add((s.created_at as string).slice(0, 10));
    doneDays.set(s.user_id as string, set);
  }

  // Meta vigente por usuario: la más reciente con inicio ≤ hoy (las filas vienen de la más nueva a la más antigua).
  const goals = goalRows;
  const currentByUser = new Map<string, string>();
  for (const g of goals) {
    if ((g.fecha_inicio as string) <= today && !currentByUser.has(g.user_id as string)) {
      currentByUser.set(g.user_id as string, g.id as string);
    }
  }

  const rows = goals.map((g) => {
    const vigente = currentByUser.get(g.user_id as string) === g.id;
    const from = (g.fecha_inicio as string) > monday ? (g.fecha_inicio as string) : monday;
    const hechos = vigente ? [...(doneDays.get(g.user_id as string) ?? [])].filter((d) => d >= from).length : null;
    return {
      id: g.id as string,
      email: emailById.get(g.user_id as string) ?? '(usuario eliminado)',
      dias: g.dias_por_semana as number,
      inicio: g.fecha_inicio as string,
      estado: vigente ? 'Vigente' : (g.fecha_inicio as string) > today ? 'Aún no inicia' : 'Reemplazada',
      hechos,
      cumple: hechos !== null && hechos >= (g.dias_por_semana as number),
    };
  });

  const vigentes = rows.filter((r) => r.estado === 'Vigente');
  const cumplen = vigentes.filter((r) => r.cumple).length;

  return (
    <div className="wrap">
      <div className="topbar"><h1>Metas semanales</h1></div>

      <div className="metric-cards">
        <div className="panel">
          <div className="metric-label">Cumplen su meta (esta semana)</div>
          <div className="metric-value">{pct(cumplen, vigentes.length)}</div>
          <div className="metric-hint">{cumplen} de {vigentes.length} usuarios con meta vigente.</div>
        </div>
        <div className="panel">
          <div className="metric-label">Usuarios con meta</div>
          <div className="metric-value">{new Set(goals.map((g) => g.user_id)).size}</div>
          <div className="metric-hint">De {users.length} usuarios registrados.</div>
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <h2>Todas las metas</h2>
        </div>
        {rows.length === 0 ? (
          <div className="loading">Aún nadie fija una meta.</div>
        ) : (
          <table className="stack">
            <thead>
              <tr><th>Usuario</th><th>Días/semana</th><th>Inicio</th><th>Estado</th><th>Días completados esta semana</th><th>Cumple</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Usuario">{r.email}</td>
                  <td data-label="Días/semana">{r.dias}</td>
                  <td data-label="Inicio">{r.inicio}</td>
                  <td data-label="Estado">{r.estado}</td>
                  <td data-label="Días completados esta semana">{r.hechos ?? '—'}</td>
                  <td data-label="Cumple">{r.hechos === null ? '—' : r.cumple ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="metric-hint">
          Una usuaria o usuario cumple si en la semana actual (lunes a domingo, UTC; contando desde la fecha de inicio si es posterior) completó rutinas en al menos tantos días distintos como su meta vigente. La meta vigente es la más reciente cuyo inicio ya llegó.
        </p>
      </div>
    </div>
  );
}
