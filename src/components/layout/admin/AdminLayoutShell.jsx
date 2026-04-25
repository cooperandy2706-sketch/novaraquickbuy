'use client'
// FILE: src/components/layout/admin/AdminLayoutShell.jsx

import { useUiStore }         from '@/store/uiStore'
import { useRealtimeAdmin }   from '@/hooks/useRealtimeAdmin'
import { cn }                 from '@/utils/cn'

export default function AdminLayoutShell({ children }) {
  const collapsed = useUiStore(s => s.sidebarCollapsed)

  // Boot all admin realtime subscriptions + bootstrap counts
  useRealtimeAdmin()

  return (
    <div className={cn(
      'flex flex-col min-h-dvh transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
      collapsed ? 'md:pl-16' : 'md:pl-64',
    )}>
      {children}
    </div>
  )
}