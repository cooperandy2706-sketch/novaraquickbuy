// FILE: src/components/Providers.jsx
'use client'

import { useState, useEffect }              from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools }               from '@tanstack/react-query-devtools'
import { useAuthStore }                     from '@/store/authStore'
import { useLocaleStore }                   from '@/store/localeStore'
import { createClient }                     from '@/lib/supabase/client'
import { detectCountryFromIp }              from '@/lib/geo/detectCountry'
import { getCurrencyByCountry, getLocaleByCountry } from '@/constants/global/countries'
import { getTimezoneForCountry }            from '@/constants/global/timezones'
import RtlProvider                          from '@/components/global/RtlProvider'
import ThemeProvider                        from '@/components/providers/ThemeProvider'
import GlobalPresenceProvider               from '@/components/providers/GlobalPresenceProvider'
import AuthModal                            from '@/components/auth/AuthModal'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            60 * 1000,
        gcTime:               5 * 60 * 1000,
        retry:                1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient = null

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

function AuthProvider({ children }) {
  const { setUser, setProfile, setLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('*, vendor:vendors(*)')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  return children
}

function GeoProvider({ children }) {
  const { country, setRegion } = useLocaleStore()

  useEffect(() => {
    if (country) return
    detectCountryFromIp().then((geo) => {
      setRegion({
        country:  geo.country,
        currency: getCurrencyByCountry(geo.country),
        locale:   getLocaleByCountry(geo.country),
        timezone: getTimezoneForCountry(geo.country),
      })
    })
  }, [])

  return children
}

export default function Providers({ children }) {
  const queryClient = getQueryClient()
  const locale = useLocaleStore((s) => s.locale)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <GeoProvider>
            <GlobalPresenceProvider>
              <RtlProvider locale={locale}>
                {children}
                <AuthModal />
              </RtlProvider>
            </GlobalPresenceProvider>
          </GeoProvider>
        </AuthProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}