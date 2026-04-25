'use client'

import { useState, useCallback }     from 'react'
import { useRouter }                  from 'next/navigation'
import { createClient }               from '@/lib/supabase/client'
import { completeOnboarding }         from '@/lib/actions/onboarding'
import {
  CheckCircle2, ArrowRight, Package, Video,
  BarChart3, Sparkles, ShieldCheck, Store,
  Loader2, Globe, ChevronDown,
} from 'lucide-react'

// ─── Supported currencies (matches DB supported_currencies table) ────────────
const CURRENCIES = [
  { code: 'GHS', symbol: '₵', name: 'Ghana Cedi',   flag: '🇬🇭' },
  { code: 'USD', symbol: '$', name: 'US Dollar',     flag: '🇺🇸' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan',  flag: '🇨🇳' },
]

// ─── Countries (Ghana first, then alphabetical) ──────────────────────────────
const COUNTRIES = [
  { code: 'GH', name: 'Ghana',          flag: '🇬🇭', currency: 'GHS' },
  { code: 'US', name: 'United States',  flag: '🇺🇸', currency: 'USD' },
  { code: 'CN', name: 'China',          flag: '🇨🇳', currency: 'CNY' },
  { code: 'NG', name: 'Nigeria',        flag: '🇳🇬', currency: 'USD' },
  { code: 'KE', name: 'Kenya',          flag: '🇰🇪', currency: 'USD' },
  { code: 'ZA', name: 'South Africa',   flag: '🇿🇦', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'USD' },
  { code: 'DE', name: 'Germany',        flag: '🇩🇪', currency: 'USD' },
  { code: 'FR', name: 'France',         flag: '🇫🇷', currency: 'USD' },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦', currency: 'USD' },
  { code: 'AU', name: 'Australia',      flag: '🇦🇺', currency: 'USD' },
  { code: 'IN', name: 'India',          flag: '🇮🇳', currency: 'USD' },
  { code: 'BR', name: 'Brazil',         flag: '🇧🇷', currency: 'USD' },
  { code: 'SG', name: 'Singapore',      flag: '🇸🇬', currency: 'USD' },
  { code: 'AE', name: 'UAE',            flag: '🇦🇪', currency: 'USD' },
  { code: 'OTHER', name: 'Other',       flag: '🌍', currency: 'USD' },
]

const NEXT_STEPS = [
  {
    icon:  Package,
    color: 'bg-blue-50 text-blue-600',
    title: 'Add your first product',
    desc:  'List products with photos, pricing, and stock levels',
    href:  '/vendor/products/new',
    cta:   'Add Product',
  },
  {
    icon:  Video,
    color: 'bg-pink-50 text-pink-600',
    title: 'Upload a product video',
    desc:  'Videos drive impulse purchases — show your product in action',
    href:  '/vendor/videos/new',
    cta:   'Upload Video',
  },
  {
    icon:  BarChart3,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Explore your dashboard',
    desc:  'Track sales, revenue, and top products in real time',
    href:  '/vendor/dashboard',
    cta:   'View Dashboard',
  },
]

export default function StepComplete({ vendor }) {
  const router   = useRouter()
  const supabase = createClient()

  // ── Country & currency state ────────────────────────────────────────────────
  const [country,     setCountry]     = useState('GH')
  const [currency,    setCurrency]    = useState('GHS')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  // ── Redirect state ──────────────────────────────────────────────────────────
  const [redirecting, setRedirecting] = useState(false)
  const [error,       setError]       = useState(null)

  // When country changes, auto-suggest matching currency
  const handleCountryChange = (code) => {
    setCountry(code)
    setSaved(false)
    const match = COUNTRIES.find(c => c.code === code)
    if (match) setCurrency(match.currency)
  }

  // Save country + currency to public.users
  const savePreferences = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: err } = await supabase
        .from('users')
        .update({
          country_code: country,
          currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (err) throw err
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [country, currency, supabase])

  // Go to dashboard — saves preferences then completes onboarding
  const goToDashboard = useCallback(async (destination = '/vendor/dashboard') => {
    if (redirecting) return
    setRedirecting(true)
    setError(null)

    try {
      // 1. Save country + currency if not already saved
      if (!saved) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('users')
            .update({ country_code: country, currency, updated_at: new Date().toISOString() })
            .eq('id', user.id)
        }
      }

      // 2. Mark onboarding complete
      const result = await completeOnboarding()
      if (result?.error) {
        setError(result.error)
        setRedirecting(false)
        return
      }

      // 3. Refresh JWT
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        await supabase.auth.signOut()
        router.push('/login?next=/vendor/dashboard')
        return
      }

      // 4. Navigate
      router.push(destination)
      router.refresh()

    } catch (err) {
      console.error('[StepComplete] goToDashboard error:', err)
      setError(err?.message ?? 'Something went wrong. Please try again.')
      setRedirecting(false)
    }
  }, [redirecting, saved, country, currency, supabase, router])

  const storeName  = vendor?.store_name ?? 'Your Store'
  const verPending = vendor?.verification_status === 'pending'
  const selectedCountry  = COUNTRIES.find(c => c.code === country)
  const selectedCurrency = CURRENCIES.find(c => c.code === currency)

  return (
    <div className="space-y-6">

      {/* Success hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-6 sm:p-8 text-white shadow-brand text-center relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4 ring-4 ring-white/10">
            <CheckCircle2 size={32} className="sm:hidden" strokeWidth={1.5} />
            <CheckCircle2 size={40} className="hidden sm:block" strokeWidth={1.5} />
          </div>
          <h2 className="font-bold text-xl sm:text-2xl leading-tight px-2">
            You're all set, {storeName.split(' ')[0]}! 🎉
          </h2>
          <p className="text-brand-200 text-xs sm:text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            Your store has been created. Start adding products and making sales on Novara Quickbuy.
          </p>
          <div className={`mt-5 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-semibold ${
            verPending ? 'bg-amber-400/20 text-amber-200' : 'bg-white/15 text-brand-200'
          }`}>
            <ShieldCheck size={13} />
            <span className="leading-tight">
              {verPending
                ? 'Identity verification pending · 24–48h review'
                : 'Store created · Verification pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Store summary */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-center gap-4">
          {vendor?.store_logo_url ? (
            <img
              src={vendor.store_logo_url}
              alt={storeName}
              className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-brand">
              {storeName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-brand-800 text-sm sm:text-base truncate">{storeName}</p>
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-brand-100 text-brand text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">
                New
              </span>
            </div>
            {vendor?.store_handle && (
              <p className="text-xs text-neutral-400 mt-0.5">@{vendor.store_handle}</p>
            )}
            {vendor?.store_tagline && (
              <p className="text-xs text-neutral-500 mt-1 truncate italic">"{vendor.store_tagline}"</p>
            )}
          </div>
          <Store size={18} className="text-neutral-300 shrink-0" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-neutral-100">
          {[
            { label: 'Products', value: '0' },
            { label: 'Orders',   value: '0' },
            { label: 'Revenue',  value: `${selectedCurrency?.symbol ?? '₵'}0` },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-bold text-brand-800 text-base sm:text-lg leading-tight">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Country & Currency selection ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={15} className="text-brand" />
          <p className="font-bold text-brand-800 text-sm">Your location & currency</p>
        </div>
        <p className="text-xs text-neutral-400 -mt-2">
          This sets the currency shown across your store, dashboard, and payouts.
        </p>

        {/* Country */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500">Country</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">
              {selectedCountry?.flag}
            </span>
            <select
              value={country}
              onChange={e => handleCountryChange(e.target.value)}
              className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-9 py-2.5 sm:py-3 text-sm text-neutral-800 font-medium focus:outline-none focus:border-brand-400 transition-colors"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500">Preferred currency</label>
          <div className="grid grid-cols-3 gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { setCurrency(c.code); setSaved(false) }}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-center transition-all ${
                  currency === c.code
                    ? 'border-brand bg-brand-50'
                    : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                }`}
              >
                <span className="text-xl">{c.flag}</span>
                <span className={`text-sm font-bold ${currency === c.code ? 'text-brand-800' : 'text-neutral-600'}`}>
                  {c.symbol} {c.code}
                </span>
                <span className="text-[9px] text-neutral-400">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save preferences button */}
        <button
          type="button"
          onClick={savePreferences}
          disabled={saving || saved}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100'
          } disabled:opacity-60`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Saving...
            </span>
          ) : saved ? (
            '✓ Preferences saved'
          ) : (
            'Save preferences'
          )}
        </button>
      </div>

      {/* Next steps */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-brand" />
          <p className="font-bold text-brand-800 text-sm">Recommended next steps</p>
        </div>
        {NEXT_STEPS.map(step => {
          const Icon = step.icon
          return (
            <button
              key={step.href}
              type="button"
              disabled={redirecting}
              onClick={() => goToDashboard(step.href)}
              className="w-full flex items-center gap-3 sm:gap-4 px-4 py-4 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:border-brand-200 hover:shadow-md transition-all duration-150 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${step.color}`}>
                <Icon size={18} className="sm:hidden" />
                <Icon size={20} className="hidden sm:block" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-brand-800">{step.title}</p>
                <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 leading-tight sm:leading-normal">{step.desc}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-brand group-hover:gap-2.5 transition-all">
                <span className="hidden xs:inline">{step.cta}</span>
                <ArrowRight size={14} />
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Main CTA */}
      <button
        onClick={() => goToDashboard('/vendor/dashboard')}
        disabled={redirecting}
        className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 text-white font-bold rounded-xl py-4 text-base transition-all shadow-brand active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {redirecting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Setting up your dashboard...
          </>
        ) : (
          <>
            Go to Dashboard
            <ArrowRight size={18} />
          </>
        )}
      </button>

    </div>
  )
}