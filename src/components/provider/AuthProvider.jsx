'use client'
// FILE: src/components/providers/AuthProvider.jsx
//
// Mount once in the root layout. Listens to Supabase auth state changes,
// fetches the full user profile (including vendor row), and keeps
// authStore in sync throughout the session.

import { useEffect } from 'react'
import { createClient }    from '@/lib/supabase/client'
import { useAuthStore }    from '@/store/authStore'

async function fetchProfile(supabase, userId) {
  const { data } = await supabase
    .from('users')
    .select(`
      id, email, full_name, avatar_url, role,
      phone, locale, currency, country_code,
      created_at, last_seen_at,
      vendor:vendors (
        id, user_id,
        store_name, store_handle, store_tagline,
        store_logo_url, store_banner_url, store_category,
        store_status, store_description,
        verified, verification_status,
        onboarding_complete, onboarding_step,
        trust_score, follower_count,
        subscription_status, subscription_plan,
        subscription_expires_at,
        business_country
      )
    `)
    .eq('id', userId)
    .single()

  return data ?? null
}

export default function AuthProvider({ children }) {
  const { setAuth, clearAuth, setLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(supabase, session.user.id)
        setAuth(session.user, profile)
      } else {
        clearAuth()
      }
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const profile = await fetchProfile(supabase, session.user.id)
            setAuth(session.user, profile)
          }
        }
        if (event === 'SIGNED_OUT') {
          clearAuth()
        }
      }
    )

    return () => { subscription.unsubscribe() }
  }, [])

  return children
}