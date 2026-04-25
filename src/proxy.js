// FILE: src/proxy.js
// Fixed version — resolves the /vendor/onboarding infinite reload loop.
//
// Root cause: when custom_access_token_hook is not yet enabled in the
// Supabase dashboard, app_metadata is empty. The old needsOnboarding
// check treated undefined as "needs onboarding" even when the vendor
// was already ON the onboarding page, causing endless reloads.
//
// Fix: only redirect to onboarding when we have a POSITIVE signal
// that onboarding is incomplete (onboarded === false). If the JWT
// is silent (undefined), we do a single lightweight DB check instead
// of assuming the worst.

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  )

  // Always call getUser() — rotates refresh tokens and validates JWT
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Redirect helper ──────────────────────────────────────────────────────
  const redirectTo = (path) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search   = ''
    const res = NextResponse.redirect(url)
    response.cookies.getAll().forEach(({ name, value, ...opts }) =>
      res.cookies.set(name, value, opts)
    )
    return res
  }

  // ── Read JWT claims ──────────────────────────────────────────────────────
  const appMeta     = user?.app_metadata ?? {}
  const userMeta    = user?.user_metadata ?? {}
  const role        = appMeta.role        ?? userMeta.role ?? 'buyer'
  const storeStatus = appMeta.store_status        // undefined if hook not enabled
  const onboarded   = appMeta.onboarding_complete // undefined if hook not enabled
  const isBanned    = appMeta.is_banned ?? false

  // ── Banned users ─────────────────────────────────────────────────────────
  if (user && isBanned && !pathname.startsWith('/login')) {
    await supabase.auth.signOut()
    return redirectTo('/login?error=account_suspended')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VENDOR ROUTES — /vendor/*
  // ══════════════════════════════════════════════════════════════════════════
  if (pathname.startsWith('/vendor')) {

    // 1. Not logged in → login
    if (!user || authError) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      const res = NextResponse.redirect(url)
      response.cookies.getAll().forEach(({ name, value, ...opts }) =>
        res.cookies.set(name, value, opts)
      )
      return res
    }

    // 2. Not a vendor → feed
    if (role !== 'vendor') return redirectTo('/feed')

    // 3. Deactivated → feed
    if (storeStatus === 'deactivated') return redirectTo('/feed')

    const isOnboarding = pathname.startsWith('/vendor/onboarding')

    // 4. Onboarding check
    //    FIX: Only redirect to onboarding on a POSITIVE false signal.
    //    If onboarded === undefined (JWT hook not enabled yet), fall back
    //    to a single DB read instead of assuming incomplete — this
    //    prevents the infinite reload loop when the hook is missing.
    if (!isOnboarding) {
      let needsOnboarding = false

      if (onboarded === false) {
        // JWT explicitly says not complete
        needsOnboarding = true

      } else if (onboarded === undefined) {
        // JWT hook not enabled or claims not yet populated —
        // do one DB check to get the real value
        const { data: vendor } = await supabase
          .from('vendors')
          .select('onboarding_complete, store_status')
          .eq('user_id', user.id)
          .single()

        if (!vendor) {
          // No vendor row at all → needs onboarding
          needsOnboarding = true
        } else if (vendor.onboarding_complete === false) {
          needsOnboarding = true
        }
        // vendor.onboarding_complete === true → let through
        // vendor.onboarding_complete === null → let through (edge case)
      }

      if (needsOnboarding) return redirectTo('/vendor/onboarding')
    }

    // 5. Already onboarded but going back to onboarding → dashboard
    //    Only redirect if we have a POSITIVE true signal — don't
    //    redirect if onboarded is undefined (hook not enabled)
    if (isOnboarding && onboarded === true) {
      return redirectTo('/vendor/dashboard')
    }

    // Same DB fallback for the onboarding → dashboard redirect
    if (isOnboarding && onboarded === undefined) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .single()

      if (vendor?.onboarding_complete === true) {
        return redirectTo('/vendor/dashboard')
      }
      // Not complete → let them stay on /vendor/onboarding
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN ROUTES — /admin/*
  // ══════════════════════════════════════════════════════════════════════════
  if (pathname.startsWith('/admin')) {
    if (!user || authError) return redirectTo('/login')
    if (!['admin', 'super_admin'].includes(role)) return redirectTo('/feed')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH PAGES — /login, /signup
  // ══════════════════════════════════════════════════════════════════════════
  if (pathname === '/login' || pathname === '/signup') {
    if (user && !authError) {
      if (['admin', 'super_admin'].includes(role)) return redirectTo('/admin/dashboard')
      if (role === 'vendor') {
        // Use DB fallback if JWT claims not populated yet
        if (onboarded === undefined) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('onboarding_complete')
            .eq('user_id', user.id)
            .single()
          return redirectTo(
            vendor?.onboarding_complete === true
              ? '/vendor/dashboard'
              : '/vendor/onboarding'
          )
        }
        return redirectTo(onboarded ? '/vendor/dashboard' : '/vendor/onboarding')
      }
      return redirectTo('/feed')
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECURITY HEADERS
  // ══════════════════════════════════════════════════════════════════════════
  response.headers.set('X-Frame-Options',        'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy',        'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy',     'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection',       '1; mode=block')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",
      "font-src 'self' data:",
      "frame-src 'self' https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
    ].join('; ')
  )

  return response
}

export default middleware

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|novara-icon.svg|icons|images).*)',
  ],
}