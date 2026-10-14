import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminTipForm from '@/components/AdminTipForm';
import LogoutButton from '@/components/LogoutButton';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';
import { TIP_COLUMNS, type Tip } from '@/lib/tips';

export const dynamic = 'force-dynamic';

export default async function AdminTipsPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const { data, error } = await getSupabaseAdmin()
    .from('tips')
    .select(TIP_COLUMNS)
    .order('created_at', { ascending: false });

  return (
    <div className="wrap">
      <p className="back"><Link href="/admin">← Volver al panel admin</Link></p>
      <div className="topbar">
        <h1>Tips</h1>
        <LogoutButton className="secondary" />
      </div>
      <AdminTipForm tips={(data ?? []) as Tip[]} loadError={!!error} />
    </div>
  );
}
