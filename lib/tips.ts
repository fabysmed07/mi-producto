import { isRoutine, type RoutineValue } from '@/lib/routines';

// Niveles de complejidad. Los slugs deben coincidir con el check de la tabla tips.
export const COMPLEXITIES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
] as const;

export type ComplexityValue = (typeof COMPLEXITIES)[number]['value'];

export const complexityLabel = (value: string) =>
  COMPLEXITIES.find((c) => c.value === value)?.label ?? value;

export const isComplexity = (value: unknown): value is ComplexityValue =>
  COMPLEXITIES.some((c) => c.value === value);

export const TIP_MAX = 280;
export const TIP_COLUMNS = 'id,consejo_dia,consejo_zona,zona,complejidad,created_at';

export type Tip = {
  id: string;
  consejo_dia: string;
  consejo_zona: string;
  zona: string;
  complejidad: string;
  created_at: string;
};

export type TipInput = {
  consejo_dia: string;
  consejo_zona: string;
  zona: RoutineValue;
  complejidad: ComplexityValue;
};

// Valida y normaliza el cuerpo de una petición; devuelve null si algo no cuadra.
export function parseTipInput(body: unknown): TipInput | null {
  const b = body as Record<string, unknown> | null;
  const consejo_dia = typeof b?.consejo_dia === 'string' ? b.consejo_dia.trim() : '';
  const consejo_zona = typeof b?.consejo_zona === 'string' ? b.consejo_zona.trim() : '';
  if (!consejo_dia || consejo_dia.length > TIP_MAX) return null;
  if (!consejo_zona || consejo_zona.length > TIP_MAX) return null;
  if (!isRoutine(b?.zona) || !isComplexity(b?.complejidad)) return null;
  return { consejo_dia, consejo_zona, zona: b.zona, complejidad: b.complejidad };
}

export const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
