import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminEmail } from '@/lib/admin-emails';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const redirect = (path: string, search = '') => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = search;
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/cuenta'))) {
    return redirect('/login', `?next=${encodeURIComponent(pathname)}`);
  }
  // Con sesión pero sin permiso: se muestra el aviso en la misma URL (/admin) con estado 403.
  if (user && pathname.startsWith('/admin') && !isAdminEmail(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = '/cuenta/sin-acceso';
    url.search = '';
    const res = NextResponse.rewrite(url, { status: 403 });
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }
  if (user && (pathname === '/login' || pathname === '/registro')) {
    return redirect('/cuenta');
  }
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/cuenta/:path*', '/login', '/registro'],
};
