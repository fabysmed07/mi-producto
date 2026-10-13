import AdminDashboard from '@/components/AdminDashboard';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';
import { notFound } from 'next/navigation';

// Los datos se leen en el servidor al renderizar: así llegan completos desde la primera carga.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const admin = getSupabaseAdmin();
  const [s, f] = await Promise.all([
    admin.from('signups').select('email, created_at').order('created_at', { ascending: false }),
    admin.from('feedback').select('email, texto, created_at').order('created_at', { ascending: false }),
  ]);

  return <AdminDashboard signups={s.error ? null : s.data} feedback={f.error ? null : f.data} />;
}
