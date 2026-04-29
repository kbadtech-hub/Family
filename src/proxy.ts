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

    // Check if email is confirmed (Bypass for OTP step 5)
    const isOTPStep = segments.includes('onboarding') && request.nextUrl.searchParams.get('step') === '5';

    if (!user.email_confirmed_at && !isOTPStep) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=unconfirmed`, request.url));
    }

    // Fetch profile and verification status
    const { data: profile } = await supabase.from('profiles').select('is_onboarded, is_verified, role').eq('id', user.id).single();
    
    // Check for staff status (Admin/Super Admin)
    const isStaff = profile?.role === 'admin' || profile?.role === 'super_admin';
    
    // Bypass onboarding/verification for staff
    if (isStaff) {
      return response;
    }

    // Onboarding gate for regular users
    if (!profile?.is_onboarded) {
      return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
    }

    // Verification gate for regular users
    if (!profile?.is_verified) {
      return NextResponse.redirect(new URL(`/${locale}/onboarding?step=5`, request.url));
    }
  }

  // If user is logged in and verified, don't let them go back to login/onboarding (except if they are modifying profile)
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
