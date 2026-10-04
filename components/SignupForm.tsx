'use client';

import { useState, type FormEvent } from 'react';

export default function SignupForm() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get('email') ?? '').trim();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 409) setMsg({ text: 'Ese correo ya estaba anotado.', kind: 'error' });
      else if (!res.ok) setMsg({ text: 'Algo salió mal. Intenta de nuevo.', kind: 'error' });
      else {
        form.reset();
        setMsg({ text: 'Listo, te avisamos en cuanto haya novedades.', kind: 'success' });
      }
    } catch {
      setMsg({ text: 'Algo salió mal. Intenta de nuevo.', kind: 'error' });
    }
    setBusy(false);
  }

  return (
    <form id="signups-form" className="form-row" noValidate onSubmit={onSubmit}>
      <label className="visually-hidden" htmlFor="signups-email">Correo electrónico</label>
      <input id="signups-email" name="email" type="email" required placeholder="tu@correo.com" autoComplete="email" />
      <button type="submit" className="btn btn-outline" disabled={busy}>{busy ? 'Enviando…' : 'Avisarme'}</button>
      <p className={msg ? `form-msg is-${msg.kind}` : 'form-msg'} data-form-msg role="status" aria-live="polite">{msg?.text}</p>
    </form>
  );
}
