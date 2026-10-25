import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import { fontVariables } from '@/lib/fonts';
import { getUser, isAdminEmail } from '@/lib/supabase-session';
import { recordVisit } from '@/lib/visits';
import '../(site)/globals.css';
import '../shell.css';
import './cuenta.css';

const TABS = [
  { href: '/cuenta', label: 'Mi cuenta', exact: true },
  { href: '/cuenta/rutinas', label: 'Mis rutinas' },
  { href: '/cuenta/meta', label: 'Mi meta' },
  { href: '/cuenta/tips', label: 'Tips' },
];

export const metadata: Metadata = {
  title: 'Soltura · Mi cuenta',
  robots: { index: false, follow: false },
};

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  await recordVisit();
  const user = await getUser();
  return (
    <html lang="es" className={fontVariables}>
      <body>
        {user && (
          <SiteNav
            label="Secciones de mi cuenta"
            tabs={TABS}
            link={isAdminEmail(user.email) ? { href: '/admin', label: 'Panel admin' } : undefined}
          />
        )}
        {children}
      </body>
    </html>
  );
}
