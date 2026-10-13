import AuthForm from '@/components/AuthForm';

export default async function RegistroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  return <AuthForm mode="registro" next={safeNext} />;
}
