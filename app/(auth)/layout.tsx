import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import '../shell.css';

export const metadata: Metadata = {
  title: 'Soltura · Cuenta',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
