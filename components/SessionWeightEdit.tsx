'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { formatPeso } from '@/lib/routines';

// Muestra el peso de una sesión y deja cargarlo o corregirlo (solo el peso es editable).
export default function SessionWeightEdit({ id, peso }: { id: string; peso: number | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get('peso') ?? '').trim();
    setError(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peso: value }),
      });
      if (res.status === 401) {
        window.location.assign('/login?next=/cuenta/rutinas');
        return;
      }
      if (res.ok || res.status === 404) {
        setEditing(false);
        router.refresh();
      } else setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  }

  if (!editing) {
    return (
      <div className="session-row session-weight">
        <span>{peso === null ? 'Sin peso' : `Peso: ${formatPeso(peso)}`}</span>
        <button type="button" className="secondary" onClick={() => setEditing(true)}>
          {peso === null ? 'Agregar peso' : 'Editar peso'}
        </button>
      </div>
    );
  }

  return (
    <form className="session-weight session-weight-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor={`peso-${id}`}>Peso en kg (vacío para quitarlo)</label>
        <input id={`peso-${id}`} name="peso" type="number" inputMode="decimal" min={20} max={300} step={0.1} defaultValue={peso ?? ''} autoFocus />
      </div>
      <div className="session-row">
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        <button type="button" className="secondary" onClick={() => { setEditing(false); setError(false); }} disabled={busy}>Cancelar</button>
      </div>
      {error && <p className="form-msg is-error" role="alert">No se pudo guardar. Revisa que sea entre 20 y 300 kg.</p>}
    </form>
  );
}
