import type { Metadata } from 'next';
import { Fraunces, Work_Sans } from 'next/font/google';
import { recordVisit } from '@/lib/visits';
import '../(site)/globals.css';
import './cuenta.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-fraunces',
});
const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-work-sans',
});

export const metadata: Metadata = {
  title: 'Soltura · Mi cuenta',
  robots: { index: false, follow: false },
};

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  await recordVisit();
  return (
    <html lang="es" className={`${fraunces.variable} ${workSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
