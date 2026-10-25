import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

// Los datos se leen en el servidor al renderizar: así llegan completos desde la primera carga.
export const dynamic = 'force-dynamic';

const count = (table: string) =>
  getSupabaseAdmin().from(table).select('*', { count: 'exact', head: true });

export default async function AdminPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const [signups, feedback, sessions, goals, tips] = await Promise.all([
    count('signups'), count('feedback'), count('routine_sessions'), count('weekly_goals'), count('tips'),
  ]);
  const show = (r: { count: number | null; error: unknown }) => (r.error || r.count === null ? '—' : String(r.count));

  const cards = [
    { href: '/admin/signups', label: 'Signups', value: show(signups), hint: 'Correos en la lista de espera.' },
    { href: '/admin/feedback', label: 'Feedback', value: show(feedback), hint: 'Mensajes recibidos.' },
    { href: '/admin/rutinas', label: 'Sesiones de rutina', value: show(sessions), hint: 'Completadas o abandonadas.' },
    { href: '/admin/metas', label: 'Metas semanales', value: show(goals), hint: 'Metas fijadas por los usuarios.' },
    { href: '/admin/tips', label: 'Tips', value: show(tips), hint: 'Tips publicados.' },
    { href: '/admin/metricas', label: 'Métricas', value: 'Ver', hint: 'Activación, retorno y finalización.' },
  ];

  return (
    <div className="wrap">
      <div className="topbar"><h1>Resumen</h1></div>
      <div className="summary-cards">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="panel summary-card">
            <div className="metric-label">{c.label}</div>
            <div className="metric-value">{c.value}</div>
            <div className="metric-hint">{c.hint}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
