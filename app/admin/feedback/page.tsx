import { notFound } from 'next/navigation';
import AdminFeedback from '@/components/AdminFeedback';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser, isAdminEmail } from '@/lib/supabase-session';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const { data, error } = await getSupabaseAdmin()
    .from('feedback')
    .select('email, texto, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="wrap">
      <div className="topbar"><h1>Feedback</h1></div>
      <AdminFeedback feedback={error ? null : data} />
    </div>
  );
}
