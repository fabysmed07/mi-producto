'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminFlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function toggle() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/flags/${flagKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.status === 401) {
        window.location.href = '/login?next=/admin/interruptores';
        return;
      }
      if (!res.ok) {
        setMsg(res.status === 403 ? 'No tienes permiso para cambiar interruptores.' : 'No se pudo cambiar el interruptor. Inténtalo de nuevo.');
        return;
      }
      router.refresh();
    } catch {
      setMsg('No se pudo cambiar el interruptor. Revisa tu conexión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={enabled ? 'secondary' : undefined} onClick={toggle} disabled={busy} aria-pressed={enabled}>
        {busy ? 'Guardando…' : enabled ? 'Apagar' : 'Encender'}
      </button>
      <p role="status" aria-live="polite" className="metric-hint">{msg}</p>
    </>
  );
}
