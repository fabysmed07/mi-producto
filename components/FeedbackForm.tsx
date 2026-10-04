'use client';

import { useState, type FormEvent } from 'react';

export default function FeedbackForm() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get('email') ?? '').trim();
    const texto = String(fd.get('texto') ?? '').trim();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || null, texto }),
      });
      if (!res.ok) setMsg({ text: 'Algo salió mal. Intenta de nuevo.', kind: 'error' });
      else {
        form.reset();
        setMsg({ text: 'Gracias por tu opinión.', kind: 'success' });
      }
    } catch {
      setMsg({ text: 'Algo salió mal. Intenta de nuevo.', kind: 'error' });
    }
    setBusy(false);
  }

  return (
    <form id="feedback-form" className="form-stack" noValidate onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="feedback-email">Correo (opcional)</label>
        <input id="feedback-email" name="email" type="email" placeholder="tu@correo.com" autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="feedback-texto">Tu opinión</label>
        <textarea id="feedback-texto" name="texto" rows={4} required placeholder="¿Qué te gustó? ¿Qué cambiarías?"></textarea>
      </div>
      <button type="submit" className="btn" disabled={busy}>{busy ? 'Enviando…' : 'Enviar opinión'}</button>
      <p className={msg ? `form-msg is-${msg.kind}` : 'form-msg'} data-form-msg role="status" aria-live="polite">{msg?.text}</p>
    </form>
  );
}
