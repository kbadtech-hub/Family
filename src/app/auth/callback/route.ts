import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Get locale from cookie to preserve user language selection
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en'
  const next = searchParams.get('next') ?? '/dashboard'
  
  // Construct localized redirect path
  const targetPath = next.startsWith(`/${locale}`) ? next : `/${locale}${next}`

  const isLocalEnv = process.env.NODE_ENV === 'development'
  const forwardedHost = request.headers.get('x-forwarded-host')
  
  let redirectBase = origin
  if (!isLocalEnv && forwardedHost) {
    redirectBase = `https://${forwardedHost}`
  } else if (!isLocalEnv && origin.startsWith('http://')) {
    redirectBase = origin.replace('http://', 'https://')
  }

  const redirectUrl = `${redirectBase}${targetPath}`
  const response = NextResponse.redirect(redirectUrl)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      const userId = data.user.id;
      
      // Query profiles table to see if the user completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (profile && !profile.onboarding_completed) {
        const onboardingUrl = `${redirectBase}/${locale}/onboarding`;
        const onboardingResponse = NextResponse.redirect(onboardingUrl);

        // Copy cookies to the new onboarding response
        request.cookies.getAll().forEach(cookie => {
          onboardingResponse.cookies.set(cookie.name, cookie.value);
        });
        response.cookies.getAll().forEach(cookie => {
          onboardingResponse.cookies.set(cookie.name, cookie.value, {
            path: cookie.path,
            domain: cookie.domain,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite
          });
        });
        return onboardingResponse;
      }
      
      return response
    }
    
    // Redirect to login page with error query param instead of 404
    return NextResponse.redirect(`${redirectBase}/${locale}/login?error=auth-code-error`)
  }

  // Redirect to login page with error query param instead of 404
  return NextResponse.redirect(`${redirectBase}/${locale}/login?error=no-code`)
}
