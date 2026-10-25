export type WeeklyGoal = {
  id: string;
  dias_por_semana: number;
  fecha_inicio: string;
  created_at: string;
};

export const GOAL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

// Tope de metas por usuario (también lo impone un trigger en la base).
export const MAX_GOALS = 50;

// La fecha de inicio puede ir hasta 30 días atrás y 365 adelante, contados desde "hoy".
export const MAX_PAST_DAYS = 30;
export const MAX_FUTURE_DAYS = 365;
// El navegador elige "hoy" con su zona y el servidor con UTC: la API da 2 días de margen.
const SERVER_SLACK_DAYS = 2;

export function isGoalDays(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 7;
}

// yyyy-mm-dd con fecha real del calendario.
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(day: string, n: number) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Rango permitido de fecha_inicio a partir de un "hoy" (yyyy-mm-dd).
export function goalDateRange(today: string, slack = 0) {
  return { min: addDays(today, -(MAX_PAST_DAYS + slack)), max: addDays(today, MAX_FUTURE_DAYS + slack) };
}

export function isGoalStart(value: unknown, todayUtc: string): value is string {
  if (!isIsoDate(value)) return false;
  const { min, max } = goalDateRange(todayUtc, SERVER_SLACK_DAYS);
  return value >= min && value <= max;
}

// Lunes (UTC) de la semana que contiene a `day`.
export function weekStartIso(day: string) {
  const d = new Date(day + 'T00:00:00Z');
  return addDays(day, -((d.getUTCDay() + 6) % 7));
}

// Las metas llegan de la más reciente a la más antigua; la vigente es la primera con inicio ≤ hoy (UTC).
export function currentGoal<T extends { fecha_inicio: string }>(goals: T[], today: string) {
  return goals.find((g) => g.fecha_inicio <= today);
}
