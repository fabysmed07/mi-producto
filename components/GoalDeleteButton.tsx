'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GoalDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    if (!window.confirm('¿Eliminar esta meta?')) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.status === 401) {
        window.location.assign('/login?next=/cuenta/meta');
        return;
      }
      if (res.ok || res.status === 404) router.refresh();
      else setFailed(true);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  return (
    <>
      <button type="button" className="secondary" onClick={onClick} disabled={busy}>
        {busy ? 'Eliminando…' : 'Eliminar'}
      </button>
      {failed && <span className="form-msg is-error" role="alert">No se pudo eliminar. Intenta de nuevo.</span>}
    </>
  );
}
