import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Determine the correct origin
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin
  
  // Extract locale from 'next' if possible
  const nextSegments = next.split('/')
  const locale = nextSegments[1] && nextSegments[1].length === 2 ? nextSegments[1] : 'en'

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)

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
              response.cookies.set(name, value, {
                ...options,
                path: '/', // Ensure cookies are accessible everywhere
              })
            )
          },
        },
      }
    )

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return response
      }
      console.error('Auth exchange error:', error.message)
    } catch (err) {
      console.error('Auth callback exception:', err)
    }
  }

  // Fallback to login with error
  return NextResponse.redirect(`${origin}/${locale}/login?error=auth_code_error`)
}
