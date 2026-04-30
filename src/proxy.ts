import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1. Run next-intl middleware first to handle locales
  const response = intlMiddleware(request);

  // 2. Auth protection
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  // Get current pathname
  const { pathname } = request.nextUrl;
  
  // Extract locale from pathname (e.g., /en/dashboard -> en)
  const segments = pathname.split('/');
  const locale = routing.locales.includes(segments[1] as any) ? segments[1] : routing.defaultLocale;
  
  // Route definitions
  const isDashboardRoute = segments.includes('dashboard') || segments.includes('community') || segments.includes('chat');
  const isLoginRoute = segments.includes('login');
  const isAdminSecureRoute = segments.includes('secure-beteseb-admin');
  
  if (isAdminSecureRoute) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const authValue = authHeader.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // NEW SECRET CREDENTIALS
      if (user === 'Beteseb_Shield_Admin' && pwd === 'K0m-Secure-2026-!@#') {
        return response;
      }
    }

    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Secure Portal"',
      },
    });
  }

  // Redirect old secure path if someone tries it
  if (segments.includes('admin-secure-portal')) {
     return NextResponse.redirect(new URL(`/${locale}/secure-beteseb-admin`, request.url));
  }

  // 4. Regular Dashboard/Auth Protection
  if (isDashboardRoute) {
    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // REMOVED email confirmation check to allow direct access
    // REMOVED onboarding/verification gates to allow free viewing of dashboard
  }

  // If user is logged in, don't let them go back to login
  if (user && (isLoginRoute)) {
     return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - /api routes
  // - /_next (Next.js internals)
  // - /_static (inside /public)
  // - all root files inside /public (e.g. /favicon.ico)
  matcher: ['/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)']
};
