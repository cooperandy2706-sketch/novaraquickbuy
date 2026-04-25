// FILE: src/components/layout/customer/CustomerBottomNav.jsx
'use client'

import { useState, useEffect } from 'react'
import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Compass,
  Heart, User, Package,
} from 'lucide-react'
import { cn }                   from '@/utils/cn'
import { useAuth }              from '@/hooks/useAuth'
import { useStatuses }          from '@/hooks/useStatuses'
import { useUiStore }           from '@/store/uiStore'
import StatusRingAvatar        from '@/components/chat/StatusRingAvatar'

const NAV = [
  { label: 'Home',    icon: Home,    href: '/feed'     },
  { label: 'Explore', icon: Compass, href: '/explore'  },
  { label: 'Orders',  icon: Package, href: '/orders'   },
  { label: 'Wishlist',icon: Heart,   href: '/wishlist' },
  { label: 'Me',      icon: User,    href: '/profile'  },
]

export default function CustomerBottomNav() {
  const pathname = usePathname()
  const { isLoggedIn, profile, isVendor } = useAuth()
  const { statuses } = useStatuses()
  const { openStatusViewer, openStatusUploader } = useUiStore()

  return (
    <nav className="
      md:hidden fixed bottom-0 left-0 right-0 z-overlay
      bg-surface/95 backdrop-blur-md
      border-t border-border
      h-[var(--bottom-nav-h)] safe-bottom
    ">
      <div className="flex h-full">

        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const isMe = href === '/profile'

          if (isMe && isLoggedIn) {
            return (
              <div key={href}
                className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150', active ? 'text-brand' : 'text-muted')}
                onClick={() => {
                  if (statuses.length > 0) openStatusViewer()
                  else if (isVendor) openStatusUploader()
                  else window.location.href = '/profile'
                }}
              >
                {active && <span className="absolute top-1.5 w-8 h-0.5 rounded-full bg-brand animate-scale-in" />}
                <StatusRingAvatar src={profile?.avatar_url} name={profile?.full_name} statuses={statuses} size={24} className="mb-0.5" />
                <span className={cn('text-[10px] font-medium', active ? 'text-brand font-bold' : 'text-muted')}>{label}</span>
              </div>
            )
          }

          return (
            <Link key={href} href={href}
              className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150', active ? 'text-brand' : 'text-muted hover:text-primary')}
              aria-label={label}
            >
              {active && <span className="absolute top-1.5 w-8 h-0.5 rounded-full bg-brand animate-scale-in" />}
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className={cn('transition-transform duration-200', active && 'scale-110')} />
              <span className={cn('text-[10px] font-medium transition-all duration-150', active ? 'text-brand font-bold' : 'text-muted')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}