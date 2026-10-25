'use client';

import LocalDate from '@/components/LocalDate';

type Signup = { email: string; created_at: string };

function csvEscape(value: unknown) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}

export default function AdminSignups({ signups }: { signups: Signup[] | null }) {
  function downloadCsv() {
    if (!signups) return;
    const lines = ['email,created_at', ...signups.map((r) => csvEscape(r.email) + ',' + csvEscape(r.created_at))];
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

  return (
    <div className="panel">
      <div className="section-header">
        <h2>Signups <span className="count">{signups ? `(${signups.length})` : ''}</span></h2>
        <button className="secondary" onClick={downloadCsv} disabled={!signups}>Descargar CSV</button>
      </div>
      {!signups && <div className="loading">No se pudieron cargar los signups. Probá recargar la página.</div>}
      {signups && signups.length === 0 && <div className="loading">Todavía no hay signups.</div>}
      {signups && signups.length > 0 && (
        <table className="stack">
          <thead><tr><th>Email</th><th>Fecha</th></tr></thead>
          <tbody>
            {signups.map((r, i) => (
              <tr key={i}><td data-label="Email">{r.email}</td><td data-label="Fecha"><LocalDate iso={r.created_at} /></td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
