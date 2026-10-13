'use client';

import { useEffect, useState } from 'react';
import LogoutButton from '@/components/LogoutButton';

type Signup = { email: string; created_at: string };
type Feedback = { email: string | null; texto: string; created_at: string };
type Loaded<T> = { status: 'loading' } | { status: 'error' } | { status: 'ok'; rows: T[] };

// El servidor y el navegador tienen distinta zona horaria e idioma: la fecha local se calcula
// solo en el cliente, tras montar, para que la hidratación no vea textos distintos.
function LocalDate({ iso }: { iso: string }) {
  const [text, setText] = useState('');
  useEffect(() => { setText(new Date(iso).toLocaleString()); }, [iso]);
  return <time dateTime={iso}>{text}</time>;
}

function csvEscape(value: unknown) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}

type Props = { signups: Signup[] | null; feedback: Feedback[] | null };

const toLoaded = <T,>(rows: T[] | null): Loaded<T> => (rows ? { status: 'ok', rows } : { status: 'error' });

export default function AdminDashboard(props: Props) {
  const signups = toLoaded(props.signups);
  const feedback = toLoaded(props.feedback);

  function downloadCsv() {
    if (signups.status !== 'ok') return;
    const lines = ['email,created_at', ...signups.rows.map((r) => csvEscape(r.email) + ',' + csvEscape(r.created_at))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signups.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revocar de inmediato puede cancelar la descarga en algunos navegadores.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const count = (l: Loaded<unknown>) => (l.status === 'ok' ? `(${l.rows.length})` : '');

  return (
    <div className="wrap">
      <div id="dashboard-view">
        <div className="topbar">
          <h1>Admin</h1>
          <LogoutButton className="secondary" />
        </div>

        <div className="sections">
          <div className="panel">
            <div className="section-header">
              <h2>Signups <span className="count">{count(signups)}</span></h2>
              <button className="secondary" onClick={downloadCsv} disabled={signups.status !== 'ok'}>Descargar CSV</button>
            </div>
            {signups.status === 'loading' && <div className="loading">Cargando…</div>}
            {signups.status === 'error' && <div className="loading">No se pudieron cargar los signups. Probá recargar la página.</div>}
            {signups.status === 'ok' && signups.rows.length === 0 && <div className="loading">Todavía no hay signups.</div>}
            {signups.status === 'ok' && signups.rows.length > 0 && (
              <table>
                <thead><tr><th>Email</th><th>Fecha</th></tr></thead>
                <tbody>
                  {signups.rows.map((r, i) => (
                    <tr key={i}><td>{r.email}</td><td><LocalDate iso={r.created_at} /></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel">
            <div className="section-header">
              <h2>Feedback <span className="count">{count(feedback)}</span></h2>
            </div>
            {feedback.status === 'loading' && <div className="loading">Cargando…</div>}
            {feedback.status === 'error' && <div className="loading">No se pudo cargar el feedback. Probá recargar la página.</div>}
            {feedback.status === 'ok' && feedback.rows.length === 0 && <div className="loading">Todavía no hay feedback.</div>}
            {feedback.status === 'ok' && feedback.rows.length > 0 && (
              <table>
                <thead><tr><th>Email</th><th>Mensaje</th><th>Fecha</th></tr></thead>
                <tbody>
                  {feedback.rows.map((r, i) => (
                    <tr key={i}><td>{r.email || '—'}</td><td>{r.texto}</td><td><LocalDate iso={r.created_at} /></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
