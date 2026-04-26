'use client'
// FILE: src/components/layout/admin/AdminSidebar.jsx

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ShoppingBag,
  CreditCard, BadgeCheck, BarChart3,
  MessageSquare, Flag, Settings,
  ChevronLeft, ChevronRight, LogOut,
  Crown, Shield, Package, Video,
  Image as ImageIcon, Megaphone,
  AlertTriangle, Activity, DollarSign,
  TrendingUp,
} from 'lucide-react'
import { useUiStore }    from '@/store/uiStore'
import { useAuth }       from '@/hooks/useAuth'
import { useAdminStore } from '@/store/adminStore'
import { cn }            from '@/utils/cn'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',  icon: LayoutDashboard, href: '/admin/dashboard' },
      { label: 'Analytics',  icon: BarChart3,        href: '/admin/analytics' },
      { label: 'Activity',   icon: Activity,         href: '/admin/activity'  },
    ],
  },
  {
    label: 'Vendors',
    items: [
      { label: 'All Vendors',   icon: Users,      href: '/admin/vendors',       badgeKey: 'newVendors'            },
      { label: 'Verifications', icon: BadgeCheck, href: '/admin/verifications', badgeKey: 'pendingVerifications'  },
      { label: 'Subscriptions', icon: Crown,      href: '/admin/subscriptions', badgeKey: 'pendingPayments'       },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Orders',   icon: ShoppingBag,  href: '/admin/orders',   badgeKey: 'openDisputes', danger: true },
      { label: 'Products', icon: Package,      href: '/admin/products'   },
      { label: 'Payouts',  icon: DollarSign,   href: '/admin/payouts',  badgeKey: 'pendingWithdrawals' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Videos',       icon: Video,      href: '/admin/videos'    },
      { label: 'Hero Banners', icon: ImageIcon,  href: '/admin/hero'      },
      { label: 'Campaigns',    icon: Megaphone,  href: '/admin/campaigns' },
      { label: 'Reports',      icon: Flag,       href: '/admin/reports',  badgeKey: 'flaggedContent', danger: true },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Messages',  icon: MessageSquare, href: '/admin/messages'  },
      { label: 'Disputes',  icon: AlertTriangle, href: '/admin/disputes', badgeKey: 'openDisputes', danger: true },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', icon: Settings, href: '/admin/settings' },
    ],
  },
]

function Badge({ count, danger = false }) {
  if (!count || count <= 0) return null
  return (
    <span className={`flex items-center justify-center rounded-full font-bold leading-none shrink-0 min-w-[20px] h-5 px-1.5 text-[10px] ${danger ? 'bg-danger text-white' : 'bg-amber-500 text-neutral-900'}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function VitalsStrip() {
  const { activeOrders, revenueToday, newOrdersToday } = useAdminStore()
  return (
    <div className="mx-2 mb-2 bg-white shadow-sm rounded-xl p-3 border border-neutral-200">
      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-2">Live</p>
      {[
        { icon: ShoppingBag, label: 'Active Orders',  val: activeOrders,                        color: 'text-amber-400'   },
        { icon: TrendingUp,  label: "Today's Orders", val: newOrdersToday,                      color: 'text-emerald-400' },
        { icon: DollarSign,  label: "Revenue Today",  val: `$${(revenueToday ?? 0).toFixed(0)}`,color: 'text-blue-400'    },
      ].map(v => (
        <div key={v.label} className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-1.5">
            <v.icon size={10} className={v.color + ' shrink-0'} />
            <span className="text-[10px] text-neutral-500">{v.label}</span>
          </div>
          <span className={`text-[11px] font-bold tabular-nums ${v.color}`}>{v.val}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminSidebar() {
  const pathname   = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { profile, handleSignOut } = useAuth()
  const store      = useAdminStore()
  const initial    = (profile?.full_name ?? profile?.email ?? 'A').charAt(0).toUpperCase()

  const totalUrgent = (store.pendingPayments ?? 0)
    + (store.pendingVerifications ?? 0)
    + (store.openDisputes ?? 0)
    + (store.flaggedContent ?? 0)
    + (store.pendingWithdrawals ?? 0)

  return (
    <aside className={cn(
      'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30',
      'bg-neutral-50/30 border-r border-neutral-200',
      'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
      sidebarCollapsed ? 'w-16' : 'w-64',
    )}>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-200 shrink-0">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-neutral-900" />
              </div>
              <div className="min-w-0">
                <p className="text-neutral-900 font-bold text-sm leading-none">Novara</p>
                <p className="text-neutral-500 text-[10px]">Admin Console</p>
              </div>
            </div>
            <button onClick={toggleSidebar}
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-800 transition-all">
              <ChevronLeft size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 w-full">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center mx-auto">
                <Shield size={16} className="text-neutral-900" />
              </div>
              {totalUrgent > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger border-2 border-neutral-950 flex items-center justify-center text-[8px] font-bold text-neutral-900 animate-pulse">
                  {totalUrgent > 9 ? '9+' : totalUrgent}
                </span>
              )}
            </div>
            <button onClick={toggleSidebar}
              className="text-neutral-600 hover:text-neutral-900 transition-colors mt-1">
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest text-neutral-700">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ label, icon: Icon, href, badgeKey, danger }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                const count  = badgeKey ? (store[badgeKey] ?? 0) : 0
                return (
                  <Link key={href} href={href}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group/item',
                      sidebarCollapsed && 'justify-center',
                      active
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'text-neutral-500 hover:bg-neutral-800/80 hover:text-neutral-900',
                    )}>
                    <Icon size={17} strokeWidth={active ? 2.5 : 1.8} className="shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate">{label}</span>
                        <Badge count={count} danger={danger} />
                      </>
                    )}
                    {sidebarCollapsed && count > 0 && (
                      <span className={cn(
                        'absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-neutral-900',
                        danger ? 'bg-danger' : 'bg-amber-500',
                      )}>
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                    {/* Collapsed tooltip */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-800 text-neutral-900 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/item:opacity-100 transition-opacity z-50 shadow-xl border border-neutral-300">
                        {label}{count > 0 && <span className={cn('ml-1.5 font-bold', danger ? 'text-red-400' : 'text-amber-400')}>({count})</span>}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Vitals + footer */}
      <div className="shrink-0 border-t border-neutral-200">
        {!sidebarCollapsed && <VitalsStrip />}
        <div className="p-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-900 font-bold text-sm shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-neutral-900 text-sm font-semibold truncate">{profile?.full_name ?? 'Admin'}</p>
                <p className="text-neutral-600 text-xs truncate">{profile?.email}</p>
              </div>
              <button onClick={handleSignOut} title="Sign out"
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-800 transition-all">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={handleSignOut} title="Sign out"
              className="w-full flex justify-center text-neutral-600 hover:text-neutral-900 transition-colors py-1">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}