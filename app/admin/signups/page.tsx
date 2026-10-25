import { notFound } from 'next/navigation';
import AdminSignups from '@/components/AdminSignups';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

export default async function SignupsPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const { data, error } = await getSupabaseAdmin()
    .from('signups')
    .select('email, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="wrap">
      <div className="topbar"><h1>Signups</h1></div>
      <AdminSignups signups={error ? null : data} />
    </div>
  );
}
