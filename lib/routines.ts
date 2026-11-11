// Rutinas que se pueden registrar. Los slugs deben coincidir con el check de routine_sessions.
export const ROUTINES = [
  { value: 'cuello', label: 'Cuello' },
  { value: 'espalda_baja', label: 'Espalda baja' },
  { value: 'cadera', label: 'Cadera' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'munecas', label: 'Muñecas' },
  { value: 'cuerpo_completo', label: 'Cuerpo completo' },
] as const;

export type RoutineValue = (typeof ROUTINES)[number]['value'];

export const routineLabel = (value: string) =>
  ROUTINES.find((r) => r.value === value)?.label ?? value;

export const isRoutine = (value: unknown): value is RoutineValue =>
  ROUTINES.some((r) => r.value === value);

export type RoutineSession = {
  id: string;
  rutina: string;
  completado: boolean;
  nota: string | null;
  peso: number | null;
  created_at: string;
};

// Peso en kg, opcional: entre 20 y 300 con hasta un decimal (debe coincidir con el check de la tabla).
// Vacío o null → null (sin dato); algo que no cumple → 'invalid'.
export function parsePeso(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const text = value.trim().replace(',', '.');
    if (text === '') return null;
    if (!/^\d+(\.\d)?$/.test(text)) return 'invalid';
    value = Number(text);
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'invalid';
  if (value < 20 || value > 300 || Math.round(value * 10) / 10 !== value) return 'invalid';
  return value;
}

export const formatPeso = (peso: number) => `${peso.toLocaleString('es', { maximumFractionDigits: 1 })} kg`;
