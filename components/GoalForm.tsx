'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { GOAL_DAYS, MAX_GOALS, goalDateRange } from '@/lib/goals';

// Día de hoy según el reloj y la zona del navegador (yyyy-mm-dd), no UTC.
function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const fmt = (day: string) =>
  new Date(day + 'T00:00:00Z').toLocaleDateString('es', { dateStyle: 'medium', timeZone: 'UTC' });

export default function GoalForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  // Vacíos en el servidor y se llenan al montar, para no desajustar la hidratación.
  const [inicio, setInicio] = useState('');
  const [range, setRange] = useState<{ min: string; max: string } | null>(null);
  useEffect(() => {
    const today = localToday();
    setInicio(today);
    setRange(goalDateRange(today));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dias_por_semana: Number(fd.get('dias_por_semana')),
          fecha_inicio: fd.get('fecha_inicio'),
        }),
      });
      if (res.status === 401) {
        window.location.assign('/login?next=/cuenta/meta');
        return;
      }
      if (res.ok) {
        form.reset();
        setInicio(localToday());
        setMsg({ text: 'Meta guardada.', kind: 'success' });
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        let text = 'Hubo un problema al guardar. Intenta de nuevo en un momento.';
        if (res.status === 400 && data?.field === 'fecha_inicio') {
          text = range
            ? `La fecha de inicio debe estar entre el ${fmt(range.min)} y el ${fmt(range.max)}.`
            : 'La fecha de inicio no es válida. Elige otra.';
        } else if (res.status === 400) {
          text = 'Elige entre 1 y 7 días por semana.';
        } else if (res.status === 409) {
          text = `Llegaste al máximo de ${MAX_GOALS} metas guardadas. Elimina alguna de la lista para guardar otra.`;
        }
        setMsg({ text, kind: 'error' });
      }
    } catch {
      setMsg({ text: 'No hay conexión. Revisa tu internet e intenta de nuevo.', kind: 'error' });
    }
    setBusy(false);
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="goal-dias">Días por semana</label>
        <select id="goal-dias" name="dias_por_semana" required defaultValue="">
          <option value="" disabled>Elige cuántos días</option>
          {GOAL_DAYS.map((d) => (
            <option key={d} value={d}>{d} {d === 1 ? 'día' : 'días'}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="goal-inicio">Fecha de inicio</label>
        <input
          id="goal-inicio"
          name="fecha_inicio"
          type="date"
          required
          value={inicio}
          min={range?.min}
          max={range?.max}
          onChange={(e) => setInicio(e.target.value)}
        />
        <p className="metric-hint">
          Las semanas y las metas se cuentan en hora UTC (lunes a domingo). Si tu zona va adelantada, una meta que empieza hoy puede verse como «Aún no inicia» durante unas horas.
        </p>
      </div>
      <button type="submit" className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar meta'}</button>
      <p className={msg ? `form-msg is-${msg.kind}` : 'form-msg'} role="status" aria-live="polite">{msg?.text}</p>
    </form>
  );
}
