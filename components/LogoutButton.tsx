'use client';

export default function LogoutButton({ className }: { className?: string }) {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/');
  }
  return <button type="button" className={className} onClick={() => void logout()}>Cerrar sesión</button>;
}
