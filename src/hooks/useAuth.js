'use client'
// FILE: src/hooks/useAuth.js

import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter }    from 'next/navigation'
import toast            from 'react-hot-toast'

export function useAuth() {
  const { user, profile, loading } = useAuthStore()
  const router   = useRouter()
  const supabase = createClient()

  const isLoggedIn = !!user
  const isVendor   = profile?.role === 'vendor'
  const isAdmin    = profile?.role === 'admin'
  // Handle case where vendor might be returned as an array or object
  const vendor     = Array.isArray(profile?.vendor) 
    ? profile.vendor[0] 
    : (profile?.vendor ?? null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/feed')
    router.refresh()
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  return {
    user, profile, loading,
    isLoggedIn, isVendor, isAdmin,
    vendor, handleSignOut, signInWithGoogle,
  }
}