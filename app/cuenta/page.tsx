import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

export default async function CuentaPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/cuenta');

  return (
    <main className="cuenta">
      <div className="cuenta-top">
        <h1>Hola, {user.email}</h1>
        <LogoutButton className="cuenta-logout" />
      </div>
      <div className="cuenta-card">
        <p>Registra tus rutinas de seis minutos: cuáles hiciste, cuándo y si las completaste.</p>
        <p><Link href="/cuenta/rutinas">Administra mis rutinas</Link></p>
        <p><Link href="/cuenta/tips">Ver tips</Link></p>
        {isAdminEmail(user.email) && (
          <>
            <p><Link href="/admin">Ir al panel admin</Link></p>
            <p><Link href="/admin/tips">Gestionar tips</Link></p>
          </>
        )}
      </div>
    </main>
  );
}
