import { notFound } from 'next/navigation';
import AdminTipForm from '@/components/AdminTipForm';
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
      <div className="topbar"><h1>Tips</h1></div>
      <AdminTipForm tips={(data ?? []) as Tip[]} loadError={!!error} />
    </div>
  );
}
