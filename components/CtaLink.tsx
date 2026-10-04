'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRoutineCtx } from './RoutineContext';

type Props = {
  className?: string;
  children: ReactNode;
  // CTA del menú: se oculta mientras el del hero está a la vista, para no ver dos CTA iguales.
  hideWhileHeroVisible?: boolean;
};

export default function CtaLink({ className, children, hideWhileHeroVisible }: Props) {
  const { start } = useRoutineCtx();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hideWhileHeroVisible || !('IntersectionObserver' in window)) return;
    const heroCta = document.querySelector('.hero [data-cta-start]');
    const nav = document.querySelector<HTMLElement>('.nav');
    if (!heroCta || !nav) return;
    // El margen superior descuenta la altura del menú fijo, que tapa el borde de arriba.
    const io = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { rootMargin: `-${nav.offsetHeight}px 0px 0px 0px` },
    );
    io.observe(heroCta);
    return () => io.disconnect();
  }, [hideWhileHeroVisible]);

  return (
    <a
      className={hidden ? `${className} is-hidden` : className}
      href="#rutina"
      data-cta-start
      onClick={(e) => { e.preventDefault(); start(); }}
    >
      {children}
    </a>
  );
}
