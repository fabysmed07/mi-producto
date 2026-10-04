'use client';

import { useCallback, useEffect, useReducer, useRef, type CSSProperties } from 'react';
import { useRoutineCtx } from './RoutineContext';

const DUR = 60;

type Mode = 'pie' | 'silla';

const STEPS: { pie: string; silla: string; cue: { pie: string; silla: string } }[] = [
  { pie: 'Cuello y hombros', silla: 'Cuello y hombros',
    cue: { pie: 'Lleva la oreja hacia el hombro, sin forzar.', silla: 'Lleva la oreja hacia el hombro, sin forzar.' } },
  { pie: 'Muñecas y antebrazos', silla: 'Muñecas y antebrazos',
    cue: { pie: 'Círculos lentos y abre y cierra las manos.', silla: 'Círculos lentos y abre y cierra las manos.' } },
  { pie: 'Rotación de tronco de pie', silla: 'Rotación de tronco sentado',
    cue: { pie: 'Gira desde la cintura, mira sobre el hombro.', silla: 'Gira desde la cintura, sin despegar la espalda del asiento.' } },
  { pie: 'Zancada estática', silla: 'Elevación de rodilla sentado',
    cue: { pie: 'Un pie adelante, baja la cadera con calma.', silla: 'Sube la rodilla hacia el pecho y alterna.' } },
  { pie: 'Elevación de talones', silla: 'Círculos de tobillo sentado',
    cue: { pie: 'Sube de puntitas y baja despacio.', silla: 'Dibuja círculos con la punta del pie.' } },
  { pie: 'Respiración y cierre', silla: 'Respiración y cierre',
    cue: { pie: 'Inhala por la nariz, suelta el aire largo.', silla: 'Inhala por la nariz, suelta el aire largo.' } },
];
const LAST = STEPS.length - 1;

const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICONS = {
  pie: svg('<circle cx="12" cy="4.6" r="1.9"/><path d="M12 8.4v6.4M12 14.8l-3 6M12 14.8l3 6M7.6 11.2l4.4-1.6 4.4 1.6"/>'),
  silla: svg('<circle cx="9.5" cy="4.6" r="1.9"/><path d="M9.5 8.4v5.6h6.5v6M9.5 10.4l4 1.2M5.5 8v12M5.5 14h4"/>'),
  play: svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>'),
  pause: svg('<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>'),
  next: svg('<path d="M7 6l8 6-8 6z" fill="currentColor"/><path d="M18 6v12"/>'),
  reset: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.5 4.5v4h4"/>'),
};

const fmt = (s: number) => {
  s = Math.max(0, Math.ceil(s - 0.0001));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

type State = { mode: Mode; idx: number; elapsed: number; running: boolean; done: boolean; swap: number };
type Action =
  | { type: 'setMode'; mode: Mode }
  | { type: 'goto'; i: number }
  | { type: 'next' }
  | { type: 'reset' }
  | { type: 'toggle' }
  | { type: 'tick'; dt: number };

const initial: State = { mode: 'pie', idx: 0, elapsed: 0, running: false, done: false, swap: 0 };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'setMode':
      // Cambiar de posición reinicia la rutina desde el primer movimiento.
      if (a.mode === s.mode) return s;
      return { ...s, mode: a.mode, idx: 0, elapsed: 0, done: false, running: false, swap: s.swap + 1 };
    case 'goto':
      return { ...s, idx: Math.min(Math.max(a.i, 0), LAST), elapsed: 0, done: false, swap: s.swap + 1 };
    case 'next':
      if (s.done) return s;
      if (s.idx >= LAST) return { ...s, done: true, running: false, elapsed: 0, swap: s.swap + 1 };
      return { ...s, idx: s.idx + 1, elapsed: 0, done: false, swap: s.swap + 1 };
    case 'reset':
      // Reinicia solo el movimiento actual; desde el final vuelve al inicio de la rutina.
      return { ...s, idx: s.done ? 0 : s.idx, running: s.done ? false : s.running, elapsed: 0, done: false, swap: s.swap + 1 };
    case 'toggle': {
      const restart = s.done;
      return {
        ...s,
        idx: restart ? 0 : s.idx,
        elapsed: restart ? 0 : s.elapsed,
        done: false,
        running: !s.running,
        swap: restart ? s.swap + 1 : s.swap,
      };
    }
    case 'tick': {
      if (!s.running) return s;
      const elapsed = s.elapsed + a.dt;
      if (elapsed < DUR) return { ...s, elapsed };
      if (s.idx >= LAST) return { ...s, done: true, running: false, elapsed: 0, swap: s.swap + 1 };
      return { ...s, idx: s.idx + 1, elapsed: elapsed - DUR, swap: s.swap + 1 };
    }
  }
}

const Icon = ({ name, className }: { name: keyof typeof ICONS; className?: string }) => (
  <i className={className} data-icon={name} dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
);

export default function RoutineWidget() {
  const [st, dispatch] = useReducer(reducer, initial);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { register } = useRoutineCtx();

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1);
      last = now;
      dispatch({ type: 'tick', dt });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // CTA "Empezar mi rutina": lleva al widget y arranca el cronómetro solo.
  const startFromCta = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    root.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
    if (root.dataset.running !== 'true') dispatch({ type: 'toggle' });
    toggleRef.current?.focus({ preventScroll: true });
    root.classList.remove('pulse'); void root.offsetWidth; root.classList.add('pulse');
  }, []);

  useEffect(() => {
    register(startFromCta);
    return () => register(null);
  }, [register, startFromCta]);

  const step = STEPS[st.idx];
  const name = st.done ? 'Rutina completa' : step[st.mode];
  const cue = st.done ? 'Vuelve cuando tu cuerpo lo pida.' : step.cue[st.mode];
  const kicker = st.done ? `${STEPS.length} de ${STEPS.length} movimientos` : `Movimiento ${st.idx + 1} de ${STEPS.length}`;
  const stepRemaining = st.done ? 0 : DUR - st.elapsed;
  const progress = st.done ? 1 : st.elapsed / DUR;
  const totalProgress = st.done ? 1 : (st.idx * DUR + st.elapsed) / (STEPS.length * DUR);
  const started = st.idx > 0 || st.elapsed > 0 || st.done;
  const playLabel = st.done ? 'Hacer otra ronda' : st.running ? 'Pausar' : started ? 'Continuar' : 'Empezar';

  const style = {
    '--i': st.mode === 'pie' ? 0 : 1,
    '--p': totalProgress.toFixed(4),
    '--sp': progress.toFixed(4),
  } as CSSProperties;

  const modeBtn = (mode: Mode, label: string) => (
    <button
      type="button"
      className={st.mode === mode ? 'active' : undefined}
      data-mode={mode}
      aria-pressed={st.mode === mode}
      onClick={() => dispatch({ type: 'setMode', mode })}
    >
      <Icon name={mode} />{label}
    </button>
  );

  return (
    <div
      ref={rootRef}
      className="phone vb"
      id="rutina"
      data-widget
      data-mode={st.mode}
      data-running={String(st.running)}
      data-done={String(st.done)}
      data-started={String(started)}
      style={style}
    >
      <div className="phone-head">
        <span>TU RUTINA <span className="tag-revisar" style={{ marginLeft: 4 }}>[REVISAR]</span></span>
        <span>6:00</span>
      </div>
      <div className="seg" role="group" aria-label="Posición de la rutina">
        <span className="seg-thumb" aria-hidden="true"></span>
        {modeBtn('pie', 'De pie')}
        {modeBtn('silla', 'En tu silla')}
      </div>
      <div className="vb-stage">
        <svg className="vb-arc" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="track" cx="100" cy="100" r="95" pathLength={100} />
          <circle
            className="prog" cx="100" cy="100" r="95" pathLength={100}
            strokeDasharray={`${progress * 100} 100`}
            style={{ strokeOpacity: progress < 0.006 ? 0 : 1 }}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="vb-orb">
          <span className="vb-halo"></span><span className="vb-halo h2"></span>
          <div className="vb-core">
            <div className="vb-figs"><Icon name="pie" className="f-pie" /><Icon name="silla" className="f-silla" /></div>
            <span className="vb-time mono" data-time>{fmt(st.done ? 0 : stepRemaining)}</span>
          </div>
        </div>
      </div>
      <div className="vb-breath" aria-hidden="true">
        <span className="idle">Respira a tu ritmo</span><span className="in">Inhala</span><span className="out">Exhala</span>
      </div>
      <div className={st.swap > 0 ? 'vb-now swap' : 'vb-now'} key={st.swap} aria-live="polite">
        <span className="vb-kicker" data-kicker>{kicker}</span>
        <h3 data-name>{name}</h3>
        <p data-cue>{cue}</p>
      </div>
      <div className="vb-controls">
        <button type="button" className="icon-btn vb-reset" data-act="reset" aria-label="Reiniciar este movimiento" title="Reiniciar este movimiento" onClick={() => dispatch({ type: 'reset' })}><Icon name="reset" /></button>
        <button ref={toggleRef} type="button" className="play-btn" data-act="toggle" aria-label={playLabel} onClick={() => dispatch({ type: 'toggle' })}>
          <Icon name="play" className="i-play" /><Icon name="pause" className="i-pause" /><span data-play-label>{playLabel}</span>
        </button>
        <button type="button" className="icon-btn" data-act="next" aria-label="Siguiente movimiento" disabled={st.done} onClick={() => dispatch({ type: 'next' })}><Icon name="next" /></button>
      </div>
      <div className="vb-dots" data-dots role="group" aria-label="Ir a un movimiento">
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            data-goto={i}
            aria-label={`Ir al movimiento ${i + 1}`}
            className={st.done || i < st.idx ? 'done' : i === st.idx ? 'current' : undefined}
            onClick={() => dispatch({ type: 'goto', i })}
          />
        ))}
      </div>
      <div className="routine-note">Misma rutina: los movimientos se adaptan a tu posición <span className="tag-revisar">[REVISAR]</span></div>
    </div>
  );
}
