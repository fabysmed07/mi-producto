import GoalDeleteButton from '@/components/GoalDeleteButton';
import { currentGoal, type WeeklyGoal } from '@/lib/goals';

export default function GoalList({ goals }: { goals: WeeklyGoal[] }) {
  if (goals.length === 0) {
    return <p className="session-empty">Aún no fijas ninguna meta. La primera aparecerá aquí.</p>;
  }
  const today = new Date().toISOString().slice(0, 10);
  const currentId = currentGoal(goals, today)?.id;
  const status = (g: WeeklyGoal) =>
    g.id === currentId ? 'Vigente' : g.fecha_inicio > today ? 'Aún no inicia' : 'Reemplazada';
  return (
    <ul className="session-list">
      {goals.map((g) => (
        <li key={g.id} className="session-item">
          <div className="session-row">
            <strong>{g.dias_por_semana} {g.dias_por_semana === 1 ? 'día' : 'días'} por semana</strong>
            <span className={g.id === currentId ? 'session-badge is-done' : 'session-badge'}>{status(g)}</span>
          </div>
          <div className="session-row">
            <GoalDeleteButton id={g.id} />
          </div>
          <time dateTime={g.fecha_inicio}>
            Desde el {new Date(g.fecha_inicio + 'T00:00:00Z').toLocaleDateString('es', { dateStyle: 'long', timeZone: 'UTC' })}
          </time>
        </li>
      ))}
    </ul>
  );
}
