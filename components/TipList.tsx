import { routineLabel } from '@/lib/routines';
import { complexityLabel, type Tip } from '@/lib/tips';

export default function TipList({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) {
    return <p className="session-empty">Aún no hay tips. Pronto habrá consejos aquí.</p>;
  }
  return (
    <ul className="session-list">
      {tips.map((t) => (
        <li key={t.id} className="session-item">
          <div className="session-row">
            <strong>{routineLabel(t.zona)}</strong>
            <span className="session-badge">Complejidad {complexityLabel(t.complejidad).toLowerCase()}</span>
          </div>
          <p className="session-note"><strong>Consejo del día:</strong> {t.consejo_dia}</p>
          <p className="session-note"><strong>Para esta zona:</strong> {t.consejo_zona}</p>
          <time dateTime={t.created_at}>
            {new Date(t.created_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
          </time>
        </li>
      ))}
    </ul>
  );
}
