import type { Metadata } from 'next';
import '../admin/admin.css';

export const metadata: Metadata = {
  title: 'Soltura · Cuenta',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
