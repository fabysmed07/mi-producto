import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import { fontVariables } from '@/lib/fonts';
import { getUser, isAdminEmail } from '@/lib/supabase-session';
import '../shell.css';
import './admin.css';

const TABS = [
  { href: '/admin', label: 'Resumen', exact: true },
  { href: '/admin/signups', label: 'Signups' },
  { href: '/admin/feedback', label: 'Feedback' },
  { href: '/admin/metricas', label: 'Métricas' },
  { href: '/admin/metas', label: 'Metas' },
  { href: '/admin/rutinas', label: 'Rutinas' },
  { href: '/admin/tips', label: 'Tips' },
];

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login?next=/admin');
  if (!isAdminEmail(user.email)) redirect('/cuenta/sin-acceso');

  return (
    <html lang="es" className={fontVariables}>
      <body>
        <SiteNav label="Secciones del panel admin" tabs={TABS} link={{ href: '/cuenta', label: 'Mi cuenta' }} />
        {children}
      </body>
    </html>
  );
}
