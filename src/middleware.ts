import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
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
  
  // Routes that require verification
  const isDashboardRoute = segments.includes('dashboard') || segments.includes('community') || segments.includes('chat') || segments.includes('admin');
  const isOnboardingRoute = segments.includes('onboarding');
  const isLoginRoute = segments.includes('login');
  const isAdminRoute = segments.includes('admin');

  // 3. Bypass for Admin Development
  if (isAdminRoute && user?.email === 'zuretalem@gmail.com') {
    return response;
  }

  if (isDashboardRoute) {
    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=unconfirmed`, request.url));
    }

    // Fetch profile and verification status
    const [{ data: profile }, { data: verification }] = await Promise.all([
      supabase.from('profiles').select('is_onboarded, is_verified').eq('id', user.id).single(),
      supabase.from('verifications').select('status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
    ]);

    if (!profile?.is_onboarded) {
      return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
    }

    const isVerified = profile?.is_verified || verification?.status === 'verified';
    if (!isVerified) {
      // If not verified, redirect to onboarding with step=verification or a dedicated page
      // Using onboarding step 5 as the verification step
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
