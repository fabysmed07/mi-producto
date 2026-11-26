import { notFound } from 'next/navigation';
import AdminFlagToggle from '@/components/AdminFlagToggle';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

const FLAGS = [
  { key: 'contador_racha', label: 'Contador de días seguidos', hint: 'Tarjeta "Mi racha" en /cuenta (Nivel 1 del plan de exposición).' },
];

export default async function InterruptoresPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const { data, error } = await getSupabaseAdmin().from('feature_flags').select('key, enabled, enabled_at');
  const rows = new Map((data ?? []).map((r) => [r.key as string, r]));

  return (
    <div className="wrap">
      <div className="topbar"><h1>Interruptores</h1></div>
      {error ? (
        <div className="panel"><div className="loading">No se pudieron cargar los interruptores. Recarga la página.</div></div>
      ) : (
        <div className="panel">
          <table className="stack">
            <thead><tr><th>Feature</th><th>Estado</th><th>Última vez encendido</th><th></th></tr></thead>
            <tbody>
              {FLAGS.map((f) => {
                const row = rows.get(f.key);
                return (
                  <tr key={f.key}>
                    <td data-label="Feature">{f.label}<div className="metric-hint">{f.hint}</div></td>
                    <td data-label="Estado">{row ? (row.enabled ? 'Encendido' : 'Apagado') : 'Sin fila'}</td>
                    <td data-label="Última vez encendido">{row?.enabled_at ? new Date(row.enabled_at as string).toLocaleString('es', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC' : '—'}</td>
                    <td>{row ? <AdminFlagToggle flagKey={f.key} enabled={row.enabled === true} /> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="metric-hint">El cambio se ve al refrescar. Al reencender, la señal de /admin/metricas se mide desde esa nueva fecha.</p>
        </div>
      )}
    </div>
  );
}
