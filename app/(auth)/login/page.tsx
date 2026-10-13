import AuthForm from '@/components/AuthForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Solo rutas internas, para evitar redirecciones abiertas.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  return <AuthForm mode="login" next={safeNext} />;
}
