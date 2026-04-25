'use client'
// FILE: src/components/layout/vendor/VendorHeader.jsx

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Menu, BadgeCheck, ExternalLink } from 'lucide-react'
import { useUiStore }           from '@/store/uiStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuth }              from '@/hooks/useAuth'
import { cn }                   from '@/utils/cn'

const PAGE_TITLES = {
  '/vendor/dashboard':              'Dashboard',
  '/vendor/products':               'Products',
  '/vendor/inventory':              'Inventory',
  '/vendor/import':                 'Import Products',
  '/vendor/videos':                 'Videos',
  '/vendor/circles':                'Circles',
  '/vendor/chat':                   'Messages',
  '/vendor/analytics':              'Analytics',
  '/vendor/orders':                 'Orders',
  '/vendor/settings':               'Settings',
  '/vendor/marketing/campaigns':    'Campaigns',
  '/vendor/marketing/sponsored':    'Sponsored',
}

export default function VendorHeader() {
  const pathname = usePathname()
  const unread   = useNotificationStore(s => s.unreadCount)
  const { openDrawer }  = useUiStore()
  const { profile }     = useAuth()

  const vendor    = profile?.vendor
  const storeName = vendor?.store_name        ?? 'My Store'
  const verified  = vendor?.verified          ?? false
  const verStatus = vendor?.verification_status ?? 'unverified'
  const initial   = storeName.charAt(0).toUpperCase()

  // Match the current pathname to a page title
  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? 'Vendor Portal'

  return (
    <header className="
      sticky top-0 z-raised bg-surface/95 backdrop-blur-md
      border-b border-border
      h-[var(--header-h,3.5rem)]
      flex items-center px-4 sm:px-6 gap-4 shrink-0
    ">
      {/* Mobile hamburger */}
      <button
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:bg-surface-3 transition-colors"
        onClick={openDrawer}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-primary text-lg truncate leading-none">{title}</h1>
        <p className="text-xs text-muted mt-0.5 hidden sm:block truncate">
          {storeName}
          {verified && ' · Verified seller ✓'}
          {!verified && verStatus === 'pending' && ' · Verification pending'}
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">

        {/* My Store */}
        <Link
          href={`/store/${vendor?.store_handle ?? profile?.id}`}
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-brand bg-brand/10 border border-brand/20 hover:bg-brand hover:text-white transition-all uppercase tracking-widest group shadow-sm active:scale-95"
          title="Open Public Storefront"
        >
          <ExternalLink size={14} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">My Store</span>
        </Link>

        {/* Notifications */}
        <Link
          href="/vendor/notifications"
          className="relative w-10 h-10 flex items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-50 hover:text-brand-900 transition-all active:scale-95"
          aria-label="Notifications"
        >
          <Bell size={20} strokeWidth={2.5} />
          {unread > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white animate-pulse" />
          )}
        </Link>

        {/* Avatar → settings */}
        <Link href="/vendor/settings" className="ml-1">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden',
            'bg-brand text-white font-black text-sm',
            'hover:opacity-90 transition-all cursor-pointer border-2 border-white shadow-xl shadow-brand/10 active:scale-95',
          )}>
            {vendor?.store_logo_url ? (
              <img src={vendor.store_logo_url} alt={storeName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
            {verified && (
              <div className="absolute -bottom-1 -right-1 bg-brand text-white rounded-full border-2 border-white p-0.5 shadow-sm">
                <BadgeCheck size={10} fill="currentColor" />
              </div>
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}