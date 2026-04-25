'use client'
// FILE: src/components/layout/admin/AdminHeader.jsx

import { useState }    from 'react'
import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, Bell, Shield, AlertTriangle,
  CheckCircle2, Crown, BadgeCheck,
  ChevronRight, DollarSign,
} from 'lucide-react'
import { useUiStore }    from '@/store/uiStore'
import { useAuth }       from '@/hooks/useAuth'
import { useAdminStore } from '@/store/adminStore'
import { cn }            from '@/utils/cn'

const PAGE_TITLES = {
  '/admin/dashboard':     { title: 'Dashboard',        sub: 'Platform overview'              },
  '/admin/analytics':     { title: 'Analytics',        sub: 'Revenue & growth data'          },
  '/admin/activity':      { title: 'Activity Log',     sub: 'All platform events'            },
  '/admin/vendors':       { title: 'Vendors',          sub: 'All registered stores'          },
  '/admin/verifications': { title: 'Verifications',    sub: 'ID documents awaiting review'   },
  '/admin/subscriptions': { title: 'Subscriptions',    sub: 'Pro plan payments & activation' },
  '/admin/orders':        { title: 'Orders',           sub: 'All customer orders'            },
  '/admin/products':      { title: 'Products',         sub: 'Catalogue management'           },
  '/admin/payouts':       { title: 'Payouts',          sub: 'Vendor payout requests'         },
  '/admin/videos':        { title: 'Videos',           sub: 'Published video content'        },
  '/admin/hero':          { title: 'Hero Banners',     sub: 'Explore page carousel'          },
  '/admin/campaigns':     { title: 'Campaigns',        sub: 'Vendor marketing campaigns'     },
  '/admin/reports':       { title: 'Reports',          sub: 'Flagged content'                },
  '/admin/messages':      { title: 'Messages',         sub: 'Support conversations'          },
  '/admin/disputes':      { title: 'Disputes',         sub: 'Order disputes & complaints'    },
  '/admin/settings':      { title: 'Settings',         sub: 'System configuration'           },
}

function UrgentDropdown({ onClose }) {
  const store = useAdminStore()
  const items = [
    { label: 'Pending Payments',      count: store.pendingPayments,      href: '/admin/subscriptions', color: 'text-amber-500',  Icon: Crown         },
    { label: 'Pending Verifications', count: store.pendingVerifications, href: '/admin/verifications', color: 'text-blue-400',   Icon: BadgeCheck    },
    { label: 'Open Disputes',         count: store.openDisputes,         href: '/admin/disputes',      color: 'text-danger',     Icon: AlertTriangle },
    { label: 'Flagged Content',       count: store.flaggedContent,       href: '/admin/reports',       color: 'text-danger',     Icon: Shield        },
    { label: 'Pending Payouts',       count: store.pendingWithdrawals,   href: '/admin/payouts',       color: 'text-violet-400', Icon: DollarSign    },
  ].filter(i => i.count > 0)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-50">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
          <p className="text-sm font-bold text-brand-800">Needs Attention</p>
          {items.length > 0 && (
            <span className="text-xs font-semibold text-danger bg-danger/10 px-2 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.count, 0)} items
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="text-sm font-bold text-brand-800">All clear!</p>
            <p className="text-xs text-neutral-400">No urgent items right now</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {items.map(item => (
              <Link key={item.href} href={item.href} onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                  <item.Icon size={16} className={item.color} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-800">{item.label}</p>
                </div>
                <span className={cn('text-sm font-bold tabular-nums shrink-0', item.color)}>{item.count}</span>
                <ChevronRight size={14} className="text-neutral-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function AdminHeader() {
  const pathname       = usePathname()
  const { openDrawer } = useUiStore()
  const { profile }    = useAuth()
  const store          = useAdminStore()
  const [showUrgent,   setShowUrgent] = useState(false)

  const totalUrgent = (store.pendingPayments ?? 0)
    + (store.pendingVerifications ?? 0)
    + (store.openDisputes ?? 0)
    + (store.flaggedContent ?? 0)
    + (store.pendingWithdrawals ?? 0)

  const pageInfo = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? { title: 'Admin', sub: 'Novara Console' }

  const initial = (profile?.full_name ?? profile?.email ?? 'A').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-raised bg-neutral-950 border-b border-neutral-800 h-[var(--header-h,3.5rem)] flex items-center px-4 sm:px-6 gap-4 shrink-0">

      {/* Mobile hamburger */}
      <button onClick={openDrawer}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-white text-base truncate leading-none">{pageInfo.title}</h1>
        <p className="text-xs text-neutral-600 mt-0.5 hidden sm:block truncate">{pageInfo.sub}</p>
      </div>

      {/* Live pulse */}
      <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Live
      </div>

      {/* Urgent bell */}
      <div className="relative">
        <button onClick={() => setShowUrgent(o => !o)}
          className={cn(
            'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all',
            totalUrgent > 0
              ? 'text-danger bg-danger/10 hover:bg-danger/20'
              : 'text-neutral-500 hover:bg-neutral-800 hover:text-white',
          )}>
          <Bell size={19} />
          {totalUrgent > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border border-neutral-950 animate-pulse" />
          )}
        </button>
        {showUrgent && <UrgentDropdown onClose={() => setShowUrgent(false)} />}
      </div>

      {/* Avatar */}
      <Link href="/admin/settings"
        className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity shrink-0">
        {initial}
      </Link>
    </header>
  )
}