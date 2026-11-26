const DAY_MS = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

// Días seguidos (UTC) con al menos una rutina completada, contando hacia atrás desde hoy o,
// si hoy aún no hay, desde ayer (la racha sigue viva hasta que termina el día).
// `completedAt`: valores `created_at` de las sesiones con completado = true.
export function currentStreak(completedAt: string[], now: Date = new Date()): number {
  const days = new Set(completedAt.map((c) => c.slice(0, 10)));
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!days.has(iso(cursor))) cursor = new Date(cursor.getTime() - DAY_MS);
  let streak = 0;
  while (days.has(iso(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}
