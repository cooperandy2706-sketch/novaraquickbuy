'use client'
// FILE: src/components/layout/admin/AdminBottomNav.jsx

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ShoppingBag,
  Crown, Flag,
} from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import { cn }            from '@/utils/cn'

const ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard',     badgeKey: null,               danger: false },
  { label: 'Vendors',   icon: Users,            href: '/admin/vendors',       badgeKey: 'newVendors',        danger: false },
  { label: 'Orders',    icon: ShoppingBag,      href: '/admin/orders',        badgeKey: 'openDisputes',      danger: true  },
  { label: 'Payments',  icon: Crown,            href: '/admin/subscriptions', badgeKey: 'pendingPayments',   danger: false },
  { label: 'Reports',   icon: Flag,             href: '/admin/reports',       badgeKey: 'flaggedContent',    danger: true  },
]

export default function AdminBottomNav() {
  const pathname = usePathname()
  const store    = useAdminStore()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-overlay bg-neutral-950 border-t border-neutral-800 h-[var(--bottom-nav-h,60px)] safe-bottom">
      <div className="flex h-full">
        {ITEMS.map(({ label, icon: Icon, href, badgeKey, danger }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const count  = badgeKey ? (store[badgeKey] ?? 0) : 0

          return (
            <Link key={href} href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all',
                active ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400',
              )}>
              {active && <span className="absolute top-0 inset-x-3 h-0.5 rounded-b-full bg-amber-500" />}
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {count > 0 && (
                  <span className={cn(
                    'absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full border-2 border-neutral-950 flex items-center justify-center text-[8px] font-bold text-white',
                    danger ? 'bg-danger' : 'bg-amber-500',
                  )}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', active && 'font-bold')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}