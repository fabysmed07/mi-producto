'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

type Signup = { email: string; created_at: string };
type Feedback = { email: string | null; texto: string; created_at: string };
type Loaded<T> = { status: 'loading' } | { status: 'error' } | { status: 'ok'; rows: T[] };

const formatDate = (iso: string) => new Date(iso).toLocaleString();

function csvEscape(value: unknown) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}

function translateAuthError(message: string) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (msg.includes('email not confirmed')) return 'El email todavía no fue confirmado.';
  if (msg.includes('too many requests') || msg.includes('for security purposes')) {
    return 'Demasiados intentos. Esperá unos segundos e intentá de nuevo.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'No se pudo conectar. Revisá tu conexión.';
  return 'No se pudo iniciar sesión. Intentá de nuevo.';
}

export default function AdminPage() {
  // null = todavía no sabemos si hay sesión (evita parpadear el login).
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [signups, setSignups] = useState<Loaded<Signup>>({ status: 'loading' });
  const [feedback, setFeedback] = useState<Loaded<Feedback>>({ status: 'loading' });
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    setSignups({ status: 'loading' });
    setFeedback({ status: 'loading' });
    const [s, f] = await Promise.all([
      supabase.from('signups').select('email, created_at').order('created_at', { ascending: false }),
      supabase.from('feedback').select('email, texto, created_at').order('created_at', { ascending: false }),
    ]);
    setSignups(s.error ? { status: 'error' } : { status: 'ok', rows: (s.data ?? []) as Signup[] });
    setFeedback(f.error ? { status: 'error' } : { status: 'ok', rows: (f.data ?? []) as Feedback[] });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      if (session) void loadData();
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError('');
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    setBusy(true);
    const { error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setLoginError(translateAuthError(error.message));
  }

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
    URL.revokeObjectURL(url);
  }

  if (loggedIn === null) return <div className="wrap" />;

  if (!loggedIn) {
    return (
      <div className="wrap">
        <div id="login-view" className="panel">
          <h1>Admin</h1>
          <form id="login-form" onSubmit={onLogin}>
            <label htmlFor="login-email">Email</label>
            <input type="email" id="login-email" name="email" required autoComplete="username" />
            <label htmlFor="login-password">Contraseña</label>
            <input type="password" id="login-password" name="password" required autoComplete="current-password" />
            <button type="submit" disabled={busy}>Ingresar</button>
            <div className="error" id="login-error">{loginError}</div>
          </form>
        </div>
      </div>
    );
  }

  const count = (l: Loaded<unknown>) => (l.status === 'ok' ? `(${l.rows.length})` : '');

  return (
    <div className="wrap">
      <div id="dashboard-view">
        <div className="topbar">
          <h1>Admin</h1>
          <button className="secondary" onClick={() => void getSupabaseBrowser().auth.signOut()}>Cerrar sesión</button>
        </div>

        <div className="sections">
          <div className="panel">
            <div className="section-header">
              <h2>Signups <span className="count">{count(signups)}</span></h2>
              <button className="secondary" onClick={downloadCsv}>Descargar CSV</button>
            </div>
            {signups.status === 'loading' && <div className="loading">Cargando…</div>}
            {signups.status === 'error' && <div className="loading">No se pudieron cargar los signups. Probá recargar la página.</div>}
            {signups.status === 'ok' && signups.rows.length === 0 && <div className="loading">Todavía no hay signups.</div>}
            {signups.status === 'ok' && signups.rows.length > 0 && (
              <table>
                <thead><tr><th>Email</th><th>Fecha</th></tr></thead>
                <tbody>
                  {signups.rows.map((r, i) => (
                    <tr key={i}><td>{r.email}</td><td>{formatDate(r.created_at)}</td></tr>
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
                    <tr key={i}><td>{r.email || '—'}</td><td>{r.texto}</td><td>{formatDate(r.created_at)}</td></tr>
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
