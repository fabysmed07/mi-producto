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
  created_at: string;
};
