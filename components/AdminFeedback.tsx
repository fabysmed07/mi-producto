import LocalDate from '@/components/LocalDate';

type Feedback = { email: string | null; texto: string; created_at: string };

export default function AdminFeedback({ feedback }: { feedback: Feedback[] | null }) {
  return (
    <div className="panel">
      <div className="section-header">
        <h2>Feedback <span className="count">{feedback ? `(${feedback.length})` : ''}</span></h2>
      </div>
      {!feedback && <div className="loading">No se pudo cargar el feedback. Probá recargar la página.</div>}
      {feedback && feedback.length === 0 && <div className="loading">Todavía no hay feedback.</div>}
      {feedback && feedback.length > 0 && (
        <table className="stack">
          <thead><tr><th>Email</th><th>Mensaje</th><th>Fecha</th></tr></thead>
          <tbody>
            {feedback.map((r, i) => (
              <tr key={i}><td data-label="Email">{r.email || '—'}</td><td data-label="Mensaje" className="cell-wide">{r.texto}</td><td data-label="Fecha"><LocalDate iso={r.created_at} /></td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
