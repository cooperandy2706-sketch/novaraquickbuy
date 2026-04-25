'use client'
// FILE: src/components/layout/vendor/VendorLayoutShell.jsx

import { useUiStore }               from '@/store/uiStore'
import { useAuth }                  from '@/hooks/useAuth'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { cn }                       from '@/utils/cn'

export default function VendorLayoutShell({ children }) {
  const collapsed   = useUiStore(s => s.sidebarCollapsed)
  const { profile } = useAuth()
  const vendorId    = profile?.vendor?.id ?? null

  // Boot realtime subscriptions for the entire vendor session
  useRealtimeNotifications(vendorId)

  return (
    <div className={cn(
      'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
      collapsed ? 'md:pl-20' : 'md:pl-64',
    )}>
      {children}
    </div>
  )
}