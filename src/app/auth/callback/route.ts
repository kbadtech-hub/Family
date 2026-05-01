import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

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
            // In a Route Handler, we can't set cookies on the request.
            // We'll handle this by passing them to the final response.
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      const forwardedHost = request.headers.get('x-forwarded-host') // Hello, Vercel
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      const redirectUrl = isLocalEnv 
        ? `${origin}${next}` 
        : (forwardedHost ? `https://${forwardedHost}${next}` : `${origin}${next}`)
        
      const response = NextResponse.redirect(redirectUrl)
      
      // Manually set the cookies on the response from the session
      // This is more robust than relying on setAll inside exchangeCodeForSession
      // for some server environments.
      // However, exchangeCodeForSession usually calls setAll.
      // Let's use the standard pattern:
      
      const finalSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )
      
      // Re-exchange or just refresh to trigger setAll on the response
      await finalSupabase.auth.getUser() 
      
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
