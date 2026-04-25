'use client'
// FILE: src/components/layout/customer/CustomerShell.jsx

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeProvider     from '@/components/providers/ThemeProvider'
import CustomerHeader    from './CustomerHeader'
import CustomerBottomNav from './CustomerBottomNav'
import CustomerSidebar   from './CustomerSidebar'
import { useUiStore }    from '@/store/uiStore'
import StatusViewer      from '@/components/status/StatusViewer'
import StatusUploader    from '@/components/status/StatusUploader'
import { useStatuses }   from '@/hooks/useStatuses'

const LG = 1024 // matches Tailwind's lg breakpoint

const NAV_TABS = ['/feed', '/explore', '/chat', '/wishlist', '/profile']

function applyPadding(el, collapsed) {
  if (!el) return
  if (window.innerWidth < LG) {
    el.style.paddingLeft = '0px'
  } else {
    el.style.paddingLeft = collapsed ? '72px' : '240px'
  }
}

export default function CustomerShell({ children }) {
  const router   = useRouter()
  const pathname = usePathname()
  const collapsed  = useUiStore(s => s.customerSidebarCollapsed)
  const { 
    statusViewerOpen, closeStatusViewer, 
    statusUploaderOpen, closeStatusUploader,
    activeStatusVendorId 
  } = useUiStore()
  const { refetch } = useStatuses()
  const contentRef = useRef(null)

  // Navigation swipe handling
  const handlePanEnd = (e, info) => {
    // Only on mobile
    if (window.innerWidth >= LG) return

    const threshold = 50
    const velocityThreshold = 0.5
    const { offset, velocity } = info

    // Check if it's a primary horizontal swipe
    if (Math.abs(offset.x) > threshold && Math.abs(velocity.x) > velocityThreshold) {
      // Find current tab by checking if the pathname starts with any of the NAV_TABS
      // We sort by length descending to match the most specific path first
      const sortedTabs = [...NAV_TABS].sort((a, b) => b.length - a.length)
      const matchedTab = sortedTabs.find(tab => pathname === tab || pathname.startsWith(tab + '/'))
      
      const currentIndex = NAV_TABS.indexOf(matchedTab)
      if (currentIndex === -1) return

      if (offset.x > 0 && currentIndex > 0) {
        // Swipe Right -> Previous Tab
        router.push(NAV_TABS[currentIndex - 1])
      } else if (offset.x < 0 && currentIndex < NAV_TABS.length - 1) {
        // Swipe Left -> Next Tab
        router.push(NAV_TABS[currentIndex + 1])
      }
    }
  }

  // Update on collapse toggle
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.style.transition = 'padding-left 300ms cubic-bezier(0.16,1,0.3,1)'
    applyPadding(el, collapsed)
  }, [collapsed])

  // Set on mount (no transition flash) + update on window resize
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    el.style.transition = 'none'
    applyPadding(el, collapsed)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (el) el.style.transition = 'padding-left 300ms cubic-bezier(0.16,1,0.3,1)'
      })
    })

    const onResize = () => applyPadding(el, collapsed)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, []) // eslint-disable-line

  return (
    <ThemeProvider>
      <div className="bg-surface transition-colors duration-200 min-h-dvh">
        <CustomerSidebar />

        <div ref={contentRef} className="flex flex-col h-dvh">
          {/* Mobile-only sticky header */}
          <div className="customer-mobile-header lg:hidden sticky top-0 z-20">
            <CustomerHeader />
          </div>

          {/* 
            Wrapping main content with motion.div for swipe gestures.
            touchAction: 'pan-y' allows native vertical scrolling while we handle horizontal pans.
          */}
          <motion.main 
            className="flex-1 overflow-y-auto overflow-x-hidden relative"
            style={{ touchAction: 'pan-y' }}
            onPanEnd={handlePanEnd}
          >
            {children}
          </motion.main>

          {/* Bottom nav in flex flow — always visible, never overlapped */}
          <div className="customer-mobile-nav lg:hidden">
            <CustomerBottomNav />
          </div>
        </div>
      </div>

      {/* Global Status Overlays (Highest Z-Index) */}
      <div className="relative z-[999]">
        <StatusViewer 
          isOpen={statusViewerOpen} 
          onClose={closeStatusViewer}
          initialVendorId={activeStatusVendorId}
        />
        
        {statusUploaderOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <StatusUploader 
              onClose={closeStatusUploader} 
              onComplete={refetch}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}