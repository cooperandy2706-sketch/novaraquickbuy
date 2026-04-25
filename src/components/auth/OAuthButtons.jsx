// FILE: src/components/auth/OAuthButtons.jsx
'use client'

import { useState }     from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn }           from '@/utils/cn'

const PROVIDERS = [
  {
    id:    'google',
    label: 'Google',
    bg:    'hover:bg-white/5 border-border hover:border-white/20',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.075 17.64 11.767 17.64 9.2z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
      </svg>
    ),
  },
]

export default function OAuthButtons({ redirectTo, label = 'Continue' }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(null) // which provider is loading

  const handleOAuth = async (provider) => {
    setLoading(provider)
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo ?? `${location.origin}/api/auth/callback?next=/feed`,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : {},
      },
    })
    // page will redirect — no need to reset loading
  }

  return (
    <div className="space-y-3">
      {PROVIDERS.map(({ id, label: name, bg, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuth(id)}
          disabled={!!loading}
          className={cn(
            'w-full flex items-center justify-center gap-3',
            'border rounded-xl py-3 px-4',
            'text-sm font-medium text-primary',
            'active:scale-[0.98] transition-all duration-150',
            bg,
            loading === id && 'opacity-60 cursor-not-allowed'
          )}
        >
          {loading === id ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : icon}
          {label} with {name}
        </button>
      ))}
    </div>
  )
}
