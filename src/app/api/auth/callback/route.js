// FILE: src/app/api/auth/callback/route.js

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user to determine redirect
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, vendor:vendors(onboarding_complete)')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'vendor') {
          const completed = profile?.vendor?.onboarding_complete ?? false
          return NextResponse.redirect(
            new URL(completed ? '/vendor/dashboard' : '/vendor/onboarding', origin)
          )
        }

        return NextResponse.redirect(new URL('/feed', origin))
      }
    } else {
      console.error('[Auth Callback] exchangeCodeForSession error:', error.message)
    }
  }

  // Something went wrong — send to login
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))
}