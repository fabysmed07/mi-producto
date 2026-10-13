import { routineLabel, type RoutineSession } from '@/lib/routines';

export default function SessionList({ sessions }: { sessions: RoutineSession[] }) {
  if (sessions.length === 0) {
    return <p className="session-empty">Aún no registras ninguna sesión. Tu primera aparecerá aquí.</p>;
  }
  return (
    <ul className="session-list">
      {sessions.map((s) => (
        <li key={s.id} className="session-item">
          <div className="session-row">
            <strong>{routineLabel(s.rutina)}</strong>
            <span className={s.completado ? 'session-badge is-done' : 'session-badge'}>
              {s.completado ? 'Completada' : 'A medias'}
            </span>
          </div>
          <time dateTime={s.created_at}>
            {new Date(s.created_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
          </time>
          {s.nota && <p className="session-note">{s.nota}</p>}
        </li>
      ))}
    </ul>
  );
}
