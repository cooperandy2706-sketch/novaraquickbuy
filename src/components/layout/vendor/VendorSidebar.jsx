'use client'
// FILE: src/components/layout/vendor/VendorSidebar.jsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, BarChart3,
  Settings, Video,
  Upload, Warehouse, Users, LogOut,
  ChevronLeft, ChevronRight, BadgeCheck,
  ShoppingBag, Monitor, Tag, Megaphone,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import ThemeToggle from '@/components/global/ThemeToggle'
import { cn } from '@/utils/cn'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a question about my Novara vendor account.')}`

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor">
      <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z" />
    </svg>
  )
}

function TikTokIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
  )
}

function InstagramIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/vendor/dashboard' },
      { label: 'Analytics', icon: BarChart3, href: '/vendor/analytics' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Products', icon: Package, href: '/vendor/products' },
      { label: 'Inventory', icon: Warehouse, href: '/vendor/inventory' },
      { label: 'Import', icon: Upload, href: '/vendor/import' },
      { label: 'Videos', icon: Video, href: '/vendor/videos' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Orders', icon: ShoppingBag, href: '/vendor/orders' },
      { label: 'Circles', icon: Users, href: '/vendor/circles' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Campaigns', icon: Tag, href: '/vendor/marketing/campaigns' },
      { label: 'Sponsored', icon: Megaphone, href: '/vendor/marketing/sponsored' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { label: 'TikTok', icon: TikTokIcon, href: '/vendor/social/tiktok' },
      { label: 'Instagram', icon: InstagramIcon, href: '/vendor/social/instagram' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', icon: Settings, href: '/vendor/settings' },
    ],
  },
]

export default function VendorSidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { profile, handleSignOut, isAdmin } = useAuth()

  const vendor = profile?.vendor
  const storeName = vendor?.store_name ?? (isAdmin ? 'Admin' : 'My Store')
  const initial = storeName.charAt(0).toUpperCase()
  const verified = vendor?.verified ?? false

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <aside className={cn(
      'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30',
      'bg-white/80 backdrop-blur-2xl border-r border-neutral-100 shadow-[8px_0_30_30px_rgb(0,0,0,0.02)]',
      'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
      sidebarCollapsed ? 'w-20' : 'w-64',
    )}>

      {/* ── Logo + collapse toggle ── */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-neutral-100/50 shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-black text-xs shrink-0 overflow-hidden border border-neutral-100/10 shadow-sm shadow-brand/10">
              {vendor?.store_logo_url ? (
                <img src={vendor.store_logo_url} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <p className="text-neutral-900 font-black text-xs truncate leading-tight uppercase tracking-wider">{storeName}</p>
              <p className="text-neutral-400 text-[10px] truncate font-bold uppercase tracking-widest mt-0.5">
                {greeting}
              </p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-black text-xs mx-auto overflow-hidden shadow-sm shadow-brand/10">
            {vendor?.store_logo_url ? (
              <img src={vendor.store_logo_url} alt={storeName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-300"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5 scrollbar-none">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ label, icon: Icon, href }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-black transition-all duration-300 relative group',
                      sidebarCollapsed && 'justify-center',
                      active ? 'text-brand' : 'text-neutral-500 hover:text-neutral-900',
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0',
                      active ? 'bg-brand/10 scale-110' : 'bg-transparent group-hover:bg-neutral-100'
                    )}>
                      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                    </div>
                    {!sidebarCollapsed && <span className="truncate uppercase tracking-widest text-[10px]">{label}</span>}
                    {active && !sidebarCollapsed && (
                      <div className="absolute left-0 w-1 h-4 rounded-r-full bg-brand animate-in fade-in slide-in-from-left-1 duration-300" />
                    )}
                  </Link>
                )
              })}

              {/* WhatsApp Chat link — shown in Commerce group */}
              {group.label === 'Commerce' && (
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="vendor-sidebar-whatsapp"
                  title={sidebarCollapsed ? 'WhatsApp' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-black transition-all duration-300 text-emerald-500/70 hover:text-emerald-600 group',
                    sidebarCollapsed && 'justify-center',
                  )}
                >
                  <div className="w-9 h-9 rounded-xl bg-transparent group-hover:bg-emerald-50 flex items-center justify-center transition-all duration-300">
                    <WhatsAppIcon size={18} />
                  </div>
                  {!sidebarCollapsed && <span className="truncate uppercase tracking-widest text-[10px]">WhatsApp</span>}
                </a>
              )}
            </div>
          </div>
        ))}

        {/* ── Admin-only section ── */}
        {isAdmin && (
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Admin
              </p>
            )}
            <div className="space-y-0.5">
              {[{ label: 'Hero Banners', icon: Monitor, href: '/admin/hero' }].map(({ label, icon: Icon, href }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-black transition-all duration-300 relative group',
                      sidebarCollapsed && 'justify-center',
                      active ? 'text-amber-500' : 'text-amber-500/60 hover:text-amber-600',
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0',
                      active ? 'bg-amber-500/10 scale-110' : 'bg-transparent group-hover:bg-amber-50'
                    )}>
                      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                    </div>
                    {!sidebarCollapsed && <span className="truncate uppercase tracking-widest text-[10px]">{label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── Theme Toggle Section ── */}
      <div className={cn(
        "px-3 py-3 border-t border-neutral-100/50",
        sidebarCollapsed ? "flex justify-center" : ""
      )}>
        <ThemeToggle variant={sidebarCollapsed ? "minimal" : "default"} />
      </div>

      {/* ── Footer: store info + sign out ── */}
      <div className="shrink-0 border-t border-neutral-100/50 p-3">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-primary text-sm font-semibold truncate leading-tight">{storeName}</p>
                {verified && <BadgeCheck size={12} className="text-brand shrink-0" />}
              </div>
              <p className="text-secondary text-xs truncate">
                {isAdmin ? '👑 Admin' : profile?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-all font-bold"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center text-muted hover:text-danger transition-colors py-1"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  )
}