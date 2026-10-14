'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ROUTINES, routineLabel } from '@/lib/routines';
import { COMPLEXITIES, TIP_MAX, complexityLabel, type Tip } from '@/lib/tips';

// Panel admin de tips: formulario (crear/editar) + lista con Editar y Borrar.
export default function AdminTipForm({ tips, loadError }: { tips: Tip[]; loadError: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Tip | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/admin/tips/${editing.id}` : '/api/admin/tips', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consejo_dia: String(fd.get('consejo_dia') ?? '').trim(),
          consejo_zona: String(fd.get('consejo_zona') ?? '').trim(),
          zona: fd.get('zona'),
          complejidad: fd.get('complejidad'),
        }),
      });
      if (res.status === 401) {
        window.location.assign('/login?next=/admin/tips');
        return;
      }
      if (!res.ok) setMsg({ text: 'No se pudo guardar. Revisa los datos e intenta de nuevo.', kind: 'error' });
      else {
        form.reset();
        setEditing(null);
        setMsg({ text: editing ? 'Tip actualizado.' : 'Tip creado.', kind: 'ok' });
        router.refresh();
      }
    } catch {
      setMsg({ text: 'No se pudo guardar. Intenta de nuevo.', kind: 'error' });
    }
    setBusy(false);
  }

  async function onDelete(tip: Tip) {
    if (!window.confirm('¿Borrar este tip? No se puede deshacer.')) return;
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tips/${tip.id}`, { method: 'DELETE' });
      if (!res.ok) setMsg({ text: 'No se pudo borrar. Intenta de nuevo.', kind: 'error' });
      else {
        if (editing?.id === tip.id) setEditing(null);
        setMsg({ text: 'Tip borrado.', kind: 'ok' });
        router.refresh();
      }
    } catch {
      setMsg({ text: 'No se pudo borrar. Intenta de nuevo.', kind: 'error' });
    }
    setBusy(false);
  }

  return (
    <div className="sections">
      <div className="panel">
        <h2>{editing ? 'Editar tip' : 'Nuevo tip'}</h2>
        {/* key: al cambiar de tip en edición se recrea el formulario con sus valores */}
        <form key={editing?.id ?? 'nuevo'} className="tip-form" onSubmit={onSubmit}>
          <label htmlFor="tip-dia">Consejo del día</label>
          <textarea id="tip-dia" name="consejo_dia" rows={3} maxLength={TIP_MAX} required defaultValue={editing?.consejo_dia ?? ''} />
          <label htmlFor="tip-zona-texto">Consejo según la zona</label>
          <textarea id="tip-zona-texto" name="consejo_zona" rows={3} maxLength={TIP_MAX} required defaultValue={editing?.consejo_zona ?? ''} />
          <label htmlFor="tip-zona">Zona</label>
          <select id="tip-zona" name="zona" required defaultValue={editing?.zona ?? ''}>
            <option value="" disabled>Elige una zona</option>
            {ROUTINES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <label htmlFor="tip-complejidad">Complejidad</label>
          <select id="tip-complejidad" name="complejidad" required defaultValue={editing?.complejidad ?? ''}>
            <option value="" disabled>Elige un nivel</option>
            {COMPLEXITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div className="tip-actions">
            <button type="submit" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear tip'}</button>
            {editing && (
              <button type="button" className="secondary" disabled={busy} onClick={() => setEditing(null)}>Cancelar</button>
            )}
          </div>
          <p className={msg?.kind === 'error' ? 'error' : 'tip-ok'} role="status" aria-live="polite">{msg?.text}</p>
        </form>
      </div>

      <div className="panel">
        <h2>Tips <span className="count">({tips.length})</span></h2>
        {loadError && <div className="loading">No se pudieron cargar los tips. Recarga la página.</div>}
        {!loadError && tips.length === 0 && <div className="loading">Todavía no hay tips.</div>}
        <ul className="tip-list">
          {tips.map((t) => (
            <li key={t.id} className="tip-item">
              <strong>{routineLabel(t.zona)} · {complexityLabel(t.complejidad)}</strong>
              <p><em>Del día:</em> {t.consejo_dia}</p>
              <p><em>Zona:</em> {t.consejo_zona}</p>
              <div className="tip-actions">
                <button type="button" className="secondary" disabled={busy} onClick={() => { setMsg(null); setEditing(t); }}>Editar</button>
                <button type="button" className="secondary" disabled={busy} onClick={() => onDelete(t)}>Borrar</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
