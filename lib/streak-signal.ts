const DAY_MS = 86_400_000;
export const WINDOW_DAYS = 14;
export const MIN_ELIGIBLE = 10;

export type SignalSession = { user_id: string; completado: boolean; created_at: string };

export type StreakSignal = {
  eligible: number;
  improved: number;
  avgBefore: number;
  avgAfter: number;
  elapsedDays: number; // días transcurridos desde que se encendió (máx. WINDOW_DAYS)
  ongoing: boolean; // aún no pasan los 14 días de la ventana
  verdict: 'inconclusive' | 'advance' | 'iterate' | 'stop';
};

// Señal de la hipótesis de product/hypotheses/contador-dias-seguidos.md.
// - Elegibles: usuarios con ≥ 1 rutina completada en los 14 días previos a `enabledAt`.
// - Mejoran: más días distintos (UTC) con rutina completada desde `enabledAt` que en un tramo
//   previo de igual longitud (si la ventana va en curso, se compara contra el mismo número de días).
// - Solo cuenta lo ocurrido desde que se encendió el interruptor (la última vez que se encendió).
export function computeStreakSignal(sessions: SignalSession[], enabledAt: Date, now: Date = new Date()): StreakSignal {
  const t0 = enabledAt.getTime();
  const elapsedMs = Math.max(0, now.getTime() - t0);
  const elapsedDays = Math.min(WINDOW_DAYS, Math.max(1, Math.ceil(elapsedMs / DAY_MS)));
  const ongoing = elapsedMs < WINDOW_DAYS * DAY_MS;
  const afterEnd = t0 + WINDOW_DAYS * DAY_MS;

  const eligibleSet = new Set<string>();
  const before = new Map<string, Set<string>>();
  const after = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, u: string, day: string) => {
    const s = m.get(u) ?? new Set<string>();
    s.add(day);
    m.set(u, s);
  };

  for (const s of sessions) {
    if (!s.completado) continue;
    const t = new Date(s.created_at).getTime();
    const day = s.created_at.slice(0, 10);
    if (t >= t0 - WINDOW_DAYS * DAY_MS && t < t0) eligibleSet.add(s.user_id);
    if (t >= t0 - elapsedDays * DAY_MS && t < t0) add(before, s.user_id, day);
    if (t >= t0 && t < afterEnd) add(after, s.user_id, day);
  }

  const eligible = [...eligibleSet];
  let improved = 0, sumBefore = 0, sumAfter = 0;
  for (const u of eligible) {
    const b = before.get(u)?.size ?? 0;
    const a = after.get(u)?.size ?? 0;
    sumBefore += b;
    sumAfter += a;
    if (a >= b + 1) improved++;
  }
  const n = eligible.length;
  const avgBefore = n ? sumBefore / n : 0;
  const avgAfter = n ? sumAfter / n : 0;

  let verdict: StreakSignal['verdict'];
  if (n < MIN_ELIGIBLE) verdict = 'inconclusive';
  else if (improved / n < 0.3 || avgAfter <= avgBefore) verdict = 'stop';
  else if (improved / n >= 0.5) verdict = 'advance';
  else verdict = 'iterate';

  return { eligible: n, improved, avgBefore, avgAfter, elapsedDays, ongoing, verdict };
}
