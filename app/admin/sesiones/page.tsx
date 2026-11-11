import { notFound } from 'next/navigation';
import { formatPeso, routineLabel } from '@/lib/routines';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

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

export default async function SesionesPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const admin = getSupabaseAdmin();
  const [users, sessions] = await Promise.all([
    listAllUsers(),
    fetchAll((from, to) =>
      admin.from('routine_sessions').select('id, user_id, rutina, completado, nota, peso, created_at')
        .order('created_at', { ascending: false }).order('id').range(from, to),
    ),
  ]);

  if (!users || !sessions) {
    return (
      <div className="wrap">
        <div className="topbar"><h1>Sesiones</h1></div>
        <div className="panel"><div className="loading">No se pudieron cargar las sesiones. Probá recargar la página.</div></div>
      </div>
    );
  }

  const emailById = new Map(users.map((u) => [u.id, u.email]));
  const conPeso = sessions.filter((s) => s.peso !== null).length;

  return (
    <div className="wrap">
      <div className="topbar"><h1>Sesiones</h1></div>

      <div className="panel">
        <div className="section-header">
          <h2>Todas las sesiones</h2>
        </div>
        {sessions.length === 0 ? (
          <div className="loading">Aún nadie registra una sesión.</div>
        ) : (
          <table className="stack">
            <thead>
              <tr><th>Usuario</th><th>Rutina</th><th>Estado</th><th>Peso</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id as string}>
                  <td data-label="Usuario">{emailById.get(s.user_id as string) ?? '(usuario eliminado)'}</td>
                  <td data-label="Rutina">{routineLabel(s.rutina as string)}</td>
                  <td data-label="Estado">{s.completado ? 'Completada' : 'A medias'}</td>
                  <td data-label="Peso">{s.peso === null ? '—' : formatPeso(Number(s.peso))}</td>
                  <td data-label="Fecha">
                    <time dateTime={s.created_at as string}>
                      {new Date(s.created_at as string).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="metric-hint">
          {sessions.length} sesiones, {conPeso} con peso. El peso es opcional y lo carga el usuario; las sesiones anteriores no lo tienen. Fechas en UTC.
        </p>
      </div>
    </div>
  );
}
