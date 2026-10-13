'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ROUTINES } from '@/lib/routines';

export default function SessionForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rutina: fd.get('rutina'),
          completado: fd.get('completado') === 'si',
          nota: String(fd.get('nota') ?? '').trim(),
        }),
      });
      if (res.status === 401) {
        window.location.assign('/login?next=/cuenta');
        return;
      }
      if (!res.ok) setMsg({ text: 'No se pudo guardar. Intenta de nuevo.', kind: 'error' });
      else {
        form.reset();
        setMsg({ text: 'Sesión registrada.', kind: 'success' });
        router.refresh();
      }
    } catch {
      setMsg({ text: 'No se pudo guardar. Intenta de nuevo.', kind: 'error' });
    }
    setBusy(false);
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="session-rutina">Rutina</label>
        <select id="session-rutina" name="rutina" required defaultValue="">
          <option value="" disabled>Elige una rutina</option>
          {ROUTINES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <fieldset className="field session-radios">
        <legend>¿La completaste?</legend>
        <label><input type="radio" name="completado" value="si" defaultChecked /> Completada</label>
        <label><input type="radio" name="completado" value="no" /> La dejé a medias</label>
      </fieldset>
      <div className="field">
        <label htmlFor="session-nota">Nota (opcional)</label>
        <textarea id="session-nota" name="nota" rows={3} maxLength={280} placeholder="Hoy me dolía la lumbar"></textarea>
      </div>
      <button type="submit" className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Registrar rutina'}</button>
      <p className={msg ? `form-msg is-${msg.kind}` : 'form-msg'} role="status" aria-live="polite">{msg?.text}</p>
    </form>
  );
}
