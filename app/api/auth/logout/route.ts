import { NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-session';

export async function POST() {
  const supabase = await getSupabaseSession();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
