'use client'
// FILE: src/components/layout/vendor/VendorMobileDrawer.jsx

import { useEffect }   from 'react'
import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  X, BadgeCheck, LogOut,
  LayoutDashboard, Package, Warehouse,
  Upload, Video, ShoppingBag,
  Users, MessageSquare, Tag,
  Megaphone, BarChart3, Settings
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuth }    from '@/hooks/useAuth'
import { cn }         from '@/utils/cn'

const ALL_LINKS = [
  { label: 'Dashboard',  href: '/vendor/dashboard',           icon: LayoutDashboard },
  { label: 'Products',   href: '/vendor/products',            icon: Package },
  { label: 'Inventory',  href: '/vendor/inventory',           icon: Warehouse },
  { label: 'Import',     href: '/vendor/import',              icon: Upload },
  { label: 'Videos',     href: '/vendor/videos',              icon: Video },
  { label: 'Orders',     href: '/vendor/orders',              icon: ShoppingBag },
  { label: 'Circles',    href: '/vendor/circles',             icon: Users },
  { label: 'Messages',   href: '/vendor/chat',                icon: MessageSquare },
  { label: 'Campaigns',  href: '/vendor/marketing/campaigns', icon: Tag },
  { label: 'Sponsored',  href: '/vendor/marketing/sponsored', icon: Megaphone },
  { label: 'Analytics',  href: '/vendor/analytics',           icon: BarChart3 },
  { label: 'Settings',   href: '/vendor/settings',            icon: Settings },
]

export default function VendorMobileDrawer() {
  const pathname                    = usePathname()
  const { drawerOpen, closeDrawer } = useUiStore()
  const { profile, handleSignOut }  = useAuth()

  const vendor    = profile?.vendor
  const storeName = vendor?.store_name ?? 'My Store'
  const verified  = vendor?.verified   ?? false
  const initial   = storeName.charAt(0).toUpperCase()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  if (!drawerOpen) return null

  return (
    <div className="fixed inset-0 z-modal md:hidden">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={closeDrawer}
      />

      {/* Drawer panel */}
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-3xl animate-in slide-in-from-left duration-500 flex flex-col shadow-2xl border-r border-neutral-100/50">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-neutral-100/50">
          <div className="flex items-center gap-4">
            {/* Store avatar */}
            <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-white font-black shadow-lg shadow-brand/20 shrink-0 overflow-hidden border border-neutral-100/10">
              {vendor?.store_logo_url ? (
                <img src={vendor.store_logo_url} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-neutral-900 font-black text-sm truncate">{storeName}</p>
                {verified && <BadgeCheck size={14} className="text-brand shrink-0" />}
              </div>
              <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-all active:scale-90"
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-none">
          {ALL_LINKS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={closeDrawer}
                className={cn(
                  'flex items-center gap-4 px-4 py-2.5 rounded-2xl text-sm font-black transition-all duration-300 group',
                  active
                    ? 'text-brand'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/50',
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0',
                  active ? 'bg-brand/10 scale-110' : 'bg-transparent'
                )}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="truncate uppercase tracking-widest text-[10px]">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Switch to Customer */}
        <div className="px-6 pb-2">
          <Link
            href="/"
            onClick={closeDrawer}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest text-brand-700 bg-brand/5 border border-brand/10 hover:bg-brand/10 transition-all active:scale-95 shadow-sm shadow-brand/5"
          >
            <div className="w-10 h-10 rounded-2xl bg-white border border-brand/10 flex items-center justify-center text-brand shadow-sm">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </div>
            Customer Feed
          </Link>
        </div>

        {/* Sign out */}
        <div className="p-6 border-t border-neutral-100/50">
          <button
            onClick={() => { closeDrawer(); handleSignOut() }}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-danger hover:bg-danger/5 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center group-hover:bg-danger/10 group-hover:text-danger transition-colors">
              <LogOut size={18} strokeWidth={2.5} />
            </div>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}