import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options))
              } catch {}
            }
          }
        }
      )
      await supabase.auth.exchangeCodeForSession(code)
    } catch (e) {
      console.error('Auth callback error:', e)
    }
  }

  return NextResponse.redirect('https://organic-journey-x5rqgww9j54vc57g-3000.app.github.dev/dashboard')
}
