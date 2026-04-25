'use client'
// FILE: src/components/layout/customer/CustomerHeader.jsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Bell, Globe, ChevronDown, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useLocaleStore } from '@/store/localeStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuth } from '@/hooks/useAuth'
import ThemeToggle from '@/components/global/ThemeToggle'
import { cn } from '@/utils/cn'
import { useStatuses } from '@/hooks/useStatuses'
import { useUiStore } from '@/store/uiStore'
import StatusRingAvatar from '@/components/chat/StatusRingAvatar'

export default function CustomerHeader() {
  const [mounted, setMounted] = useState(false)
  const { count } = useCart()
  const cartCount = count
  const unread = useNotificationStore(s => s.unreadCount)
  const { isLoggedIn, profile, isVendor } = useAuth()
  const { statuses } = useStatuses()
  const { openStatusViewer, openStatusUploader } = useUiStore()
  const { country, setCountry } = useLocaleStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <header className="
      sticky top-0 z-overlay
      bg-surface/95 backdrop-blur-md
      border-b border-border
      h-[var(--header-h,56px)]
    ">
      <div className="page h-full flex items-center justify-between gap-3">

        {/* Logo */}
        <Link
          href="/feed"
          aria-label="Novara Quickbuy home"
          className="flex items-center gap-2.5 shrink-0"
        >
          {/* Icon mark */}
          <div
            className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0"
            style={{ boxShadow: 'var(--shadow-brand)' }}
          >
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
              <path
                d="M10 22 L18 22 Q21 22 22 25 L29 58 Q30 61 33 61 L76 61 Q79 61 80 58 L87 34 Q88 31 85 31 L26 31"
                stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"
              />
              <circle cx="39" cy="73" r="6" stroke="#fff" strokeWidth="4" fill="none" />
              <circle cx="66" cy="73" r="6" stroke="#fff" strokeWidth="4" fill="none" />
              <ellipse cx="44" cy="46" rx="16" ry="11" fill="#052E16" />
              <circle cx="38" cy="46" r="2.2" fill="#fff" />
              <circle cx="44" cy="46" r="2.2" fill="#fff" />
              <circle cx="50" cy="46" r="2.2" fill="#fff" />
              <ellipse cx="61" cy="53" rx="12" ry="8.5" fill="#F59E0B" />
              <path
                d="M80 10 L82.5 17.5 L90.5 17.5 L84.2 22.2 L86.5 30 L80 25.3 L73.5 30 L75.8 22.2 L69.5 17.5 L77.5 17.5 Z"
                fill="#F59E0B"
              />
            </svg>
          </div>

          {/* Wordmark */}
          <div className="flex flex-col justify-center gap-[2px]">
            <span
              className="font-extrabold text-primary text-[17px] leading-none"
              style={{ letterSpacing: '-0.03em' }}
            >
              novara
            </span>
            <span className="text-[8px] font-bold text-muted tracking-[0.2em] uppercase leading-none">
              quickbuy
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-sm relative group"
        >
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-muted group-focus-within:text-brand transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-surface-2 border border-border rounded-full pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all placeholder:text-muted/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1">

          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle variant="minimal" />
          </div>

          {/* Country Selector */}
          <div className="relative hidden sm:flex items-center mx-1 group">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
              <Globe size={14} className="text-secondary group-hover:text-brand transition-colors" />
            </div>
            <select
              value={mounted ? country : 'all'}
              onChange={(e) => setCountry(e.target.value)}
              className="appearance-none bg-surface-2 border border-border hover:border-brand/40 text-secondary text-xs font-semibold rounded-full pl-7 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
            >
              <option value="all">Global</option>
              <option value="Ghana">Ghana</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Kenya">Kenya</option>
              <option value="South Africa">South Africa</option>
              <option value="United States">USA</option>
              <option value="United Kingdom">UK</option>
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <ChevronDown size={12} className="text-muted" />
            </div>
          </div>

          <div className="w-px h-4 border-border mx-1 hidden sm:block" />

          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Cart"
            className={cn(
              'relative w-10 h-10 rounded-full flex items-center justify-center',
              'border-2 border-border hover:border-brand/40',
              'text-secondary hover:text-brand',
              'transition-all duration-150 bg-surface hover:bg-brand/10',
            )}
          >
            <ShoppingCart size={18} />
            {mounted && cartCount > 0 && (
              <span className="
                absolute -top-1 -right-1
                min-w-[18px] h-[18px] px-1
                rounded-full bg-brand text-white
                text-[9px] font-bold
                flex items-center justify-center
                border-2 border-surface
                animate-pop-in
              ">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            aria-label="Notifications"
            className={cn(
              'relative w-10 h-10 rounded-full flex items-center justify-center',
              'border-2 border-border hover:border-brand/40',
              'text-secondary hover:text-brand',
              'transition-all duration-150 bg-surface hover:bg-brand/10',
            )}
          >
            <Bell size={18} />
            {mounted && unread > 0 && (
              <span className="
                absolute top-0.5 right-0.5
                w-2.5 h-2.5 rounded-full
                bg-danger border-2 border-surface
              " />
            )}
          </Link>

          {mounted && (
            isLoggedIn ? (
              <div className="flex items-center gap-2">

                <StatusRingAvatar
                  src={profile?.avatar_url}
                  name={profile?.full_name}
                  statuses={statuses}
                  size={36}
                  onClick={() => {
                    if (statuses.length > 0) openStatusViewer()
                    else if (!isVendor) window.location.href = '/profile'
                  }}
                  onAdd={null}
                  className="ml-1"
                />
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-1 btn btn-primary btn-sm hidden sm:flex"
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  )
}