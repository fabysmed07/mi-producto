'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

const ERRORS: Record<string, string> = {
  credentials: 'Email o contraseña incorrectos.',
  not_confirmed: 'Confirma tu email antes de entrar.',
  rate_limit: 'Demasiados intentos. Espera unos segundos e intenta de nuevo.',
  invalid_email: 'Escribe un email válido.',
  invalid_password: 'La contraseña debe tener entre 8 y 72 caracteres.',
};

export default function AuthForm({ mode, next }: { mode: 'login' | 'registro'; next: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const isLogin = mode === 'login';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const res = await fetch(isLogin ? '/api/auth/login' : '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(ERRORS[json.error] ?? 'Algo salió mal. Intenta de nuevo.');
      } else if (json.needsConfirmation) {
        setNotice('Listo. Revisa tu correo para confirmar tu cuenta y luego inicia sesión.');
      } else {
        // Sin destino explícito: el admin entra al panel y el resto a su cuenta.
        const home = json.admin ? '/admin' : '/cuenta';
        // Navegación completa: garantiza que la página ya vea las cookies de sesión recién creadas.
        window.location.assign(next === '/' ? home : next);
        return;
      }
    } catch {
      setError('No se pudo conectar. Revisa tu conexión.');
    }
    setBusy(false);
  }

  const query = next !== '/' ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <div className="wrap">
      <p id="login-back"><Link href="/">← Volver al inicio</Link></p>
      <div id="login-view" className="panel">
        <h1>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <form id="login-form" onSubmit={onSubmit}>
          <label htmlFor="auth-email">Email</label>
          <input type="email" id="auth-email" name="email" required autoComplete="username" />
          <label htmlFor="auth-password">Contraseña</label>
          <input
            type="password"
            id="auth-password"
            name="password"
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          <button type="submit" disabled={busy}>{isLogin ? 'Ingresar' : 'Registrarme'}</button>
          <div className="error" role="alert">{error}</div>
          {notice && <div className="loading" role="status">{notice}</div>}
        </form>
        <p className="loading">
          {isLogin ? (
            <>¿No tienes cuenta? <Link href={`/registro${query}`}>Regístrate</Link></>
          ) : (
            <>¿Ya tienes cuenta? <Link href={`/login${query}`}>Inicia sesión</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
