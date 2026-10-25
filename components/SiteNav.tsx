'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export type NavTab = { href: string; label: string; exact?: boolean };

type Props = {
  label: string;
  tabs: NavTab[];
  // Enlace secundario junto a "Cerrar sesión" (p. ej. "Mi cuenta" desde el admin).
  link?: { href: string; label: string };
};

// Barra de navegación compartida por /admin y /cuenta: marca, pestañas deslizables y sesión.
export default function SiteNav({ label, tabs, link }: Props) {
  const pathname = usePathname();
  const isActive = (t: NavTab) => (t.exact ? pathname === t.href : pathname.startsWith(t.href));
  const tabsRef = useRef<HTMLElement>(null);

  // En móvil la pestaña activa puede quedar fuera de vista: se centra al cambiar de sección.
  useEffect(() => {
    const box = tabsRef.current;
    const tab = box?.querySelector<HTMLElement>('.site-tab.active');
    if (box && tab) box.scrollTo({ left: tab.offsetLeft - (box.clientWidth - tab.offsetWidth) / 2 });
  }, [pathname]);

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="brand" aria-label="Soltura, ir al inicio">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--paper)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="16.5" cy="4.6" r="1.9" fill="var(--paper)" stroke="none" />
              <path d="M15 8.5C9 9 8 12 12 13.2C16 14.4 15 18 8.5 19.5" />
            </svg>
          </span>
          Soltura
        </Link>
        <nav ref={tabsRef} className="site-tabs" aria-label={label}>
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className={isActive(t) ? 'site-tab active' : 'site-tab'} aria-current={isActive(t) ? 'page' : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="site-nav-actions">
          {link && <Link href={link.href} className="site-nav-link">{link.label}</Link>}
          <LogoutButton className="secondary" />
        </div>
      </div>
    </header>
  );
}
