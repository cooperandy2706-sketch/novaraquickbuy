'use client'
// FILE: src/components/layout/admin/AdminMobileDrawer.jsx

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Shield, LogOut } from 'lucide-react'
import { useUiStore }    from '@/store/uiStore'
import { useAuth }       from '@/hooks/useAuth'
import { useAdminStore } from '@/store/adminStore'
import { cn }            from '@/utils/cn'

const ALL_ITEMS = [
  { emoji: '🏠', label: 'Dashboard',      href: '/admin/dashboard'     },
  { emoji: '📊', label: 'Analytics',      href: '/admin/analytics'     },
  { emoji: '📋', label: 'Activity Log',   href: '/admin/activity'      },
  null,
  { emoji: '🏪', label: 'All Vendors',    href: '/admin/vendors',       badgeKey: 'newVendors'            },
  { emoji: '✅', label: 'Verifications',  href: '/admin/verifications', badgeKey: 'pendingVerifications'  },
  { emoji: '👑', label: 'Subscriptions',  href: '/admin/subscriptions', badgeKey: 'pendingPayments'       },
  null,
  { emoji: '🛍️', label: 'Orders',         href: '/admin/orders',        badgeKey: 'openDisputes',         danger: true },
  { emoji: '📦', label: 'Products',       href: '/admin/products'      },
  { emoji: '💰', label: 'Payouts',        href: '/admin/payouts',       badgeKey: 'pendingWithdrawals'    },
  null,
  { emoji: '🎬', label: 'Videos',         href: '/admin/videos'        },
  { emoji: '🖼️', label: 'Hero Banners',   href: '/admin/hero'          },
  { emoji: '📣', label: 'Campaigns',      href: '/admin/campaigns'     },
  { emoji: '🚩', label: 'Reports',        href: '/admin/reports',       badgeKey: 'flaggedContent', danger: true },
  null,
  { emoji: '💬', label: 'Messages',       href: '/admin/messages'      },
  { emoji: '⚠️', label: 'Disputes',       href: '/admin/disputes',      badgeKey: 'openDisputes',   danger: true },
  null,
  { emoji: '⚙️', label: 'Settings',       href: '/admin/settings'      },
]

export default function AdminMobileDrawer() {
  const pathname                    = usePathname()
  const { drawerOpen, closeDrawer } = useUiStore()
  const { profile, handleSignOut }  = useAuth()
  const store                       = useAdminStore()

  if (!drawerOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-overlay bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
      <div className="fixed top-0 left-0 bottom-0 z-overlay w-72 bg-neutral-50/30 border-r border-neutral-200 flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Shield size={16} className="text-neutral-900" />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-sm leading-none">Novara</p>
              <p className="text-neutral-500 text-[10px]">Admin Console</p>
            </div>
          </div>
          <button onClick={closeDrawer}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-800 transition-all">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-none">
          {ALL_ITEMS.map((item, i) => {
            if (item === null)
              return <div key={i} className="my-2 h-px bg-neutral-800 mx-2" />

            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const count  = item.badgeKey ? (store[item.badgeKey] ?? 0) : 0

            return (
              <Link key={item.href} href={item.href} onClick={closeDrawer}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-0.5',
                  active
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-900',
                )}>
                <span className="text-lg leading-none w-6 text-center shrink-0">{item.emoji}</span>
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className={cn(
                    'min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-neutral-900 flex items-center justify-center shrink-0',
                    item.danger ? 'bg-danger' : 'bg-amber-500',
                  )}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-neutral-200 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-900 font-bold shrink-0">
              {(profile?.full_name ?? 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-neutral-900 text-sm font-semibold truncate">{profile?.full_name ?? 'Admin'}</p>
              <p className="text-neutral-500 text-xs truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={() => { closeDrawer(); handleSignOut() }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-800 transition-all text-sm font-medium">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </>
  )
}