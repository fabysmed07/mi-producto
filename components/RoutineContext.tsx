'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';

type StartFn = () => void;

type Ctx = {
  register: (fn: StartFn | null) => void;
  start: () => void;
};

const RoutineCtx = createContext<Ctx | null>(null);

// Permite que los CTA (menú, hero, cierre) arranquen el widget sin acoplarlos entre sí.
export function RoutineProvider({ children }: { children: ReactNode }) {
  const startRef = useRef<StartFn | null>(null);
  const register = useCallback((fn: StartFn | null) => { startRef.current = fn; }, []);
  const start = useCallback(() => { startRef.current?.(); }, []);
  const value = useMemo(() => ({ register, start }), [register, start]);
  return <RoutineCtx.Provider value={value}>{children}</RoutineCtx.Provider>;
}

export function useRoutineCtx() {
  const ctx = useContext(RoutineCtx);
  if (!ctx) throw new Error('useRoutineCtx debe usarse dentro de RoutineProvider');
  return ctx;
}
