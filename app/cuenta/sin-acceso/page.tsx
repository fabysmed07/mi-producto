import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function SinAccesoPage() {
  return (
    <main className="cuenta cuenta-narrow">
      <div className="cuenta-brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--paper)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="16.5" cy="4.6" r="1.9" fill="var(--paper)" stroke="none" />
            <path d="M15 8.5C9 9 8 12 12 13.2C16 14.4 15 18 8.5 19.5" />
          </svg>
        </span>
        <h1>Soltura · Admin</h1>
      </div>
      <div className="cuenta-card">
        <p>No tienes acceso a este panel.</p>
        <div className="cuenta-actions">
          <Link href="/cuenta">Volver a mi cuenta</Link>
          <LogoutButton className="cuenta-logout" />
        </div>
      </div>
    </main>
  );
}
