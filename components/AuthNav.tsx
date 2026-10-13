import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function AuthNav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="auth-nav">
      {loggedIn ? (
        <>
          <Link href="/cuenta">Mi cuenta</Link>
          <LogoutButton className="auth-link" />
        </>
      ) : (
        <>
          <Link href="/login">Ingresar</Link>
          <Link href="/registro">Registrarme</Link>
        </>
      )}
    </div>
  );
}
