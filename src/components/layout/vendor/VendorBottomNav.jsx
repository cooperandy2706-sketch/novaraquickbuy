'use client'
// FILE: src/components/layout/vendor/VendorBottomNav.jsx

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package,
  ShoppingBag, Video, Plus,
  Camera, Upload, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a question about my Novara vendor account.')}`

const ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/vendor/dashboard' },
  { label: 'Products',  icon: Package,         href: '/vendor/products'  },
  { label: 'Videos',    icon: Video,           href: '/vendor/videos'    },
  { label: 'Orders',    icon: ShoppingBag,     href: '/vendor/orders'    },
]

// WhatsApp icon for the chat button
function WhatsAppIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor">
      <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z"/>
    </svg>
  )
}

export default function VendorBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="
      md:hidden fixed bottom-0 left-0 right-0 z-overlay
      bg-white/80 backdrop-blur-xl
      border-t border-neutral-100
      h-[var(--bottom-nav-h)] safe-bottom
      shadow-[0_-8px_30px_rgb(0,0,0,0.04)]
    ">
      <div className="flex h-full px-2">
        {ITEMS.map(({ label, icon: Icon, href }) => {
          const isVideos = label === 'Videos'
          const active = pathname === href || (href !== '/vendor/dashboard' && pathname.startsWith(href + '/'))
          
          return (
            <div key={href} className="flex-1 relative flex flex-col items-center justify-center">
              {/* Quick Create Floating Button */}
              {isVideos && active && (
                <div className="absolute -top-[64px] left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-4 fade-in duration-300">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    {/* Animated circling lines */}
                    <div className="absolute inset-[-4px] rounded-full border-[2.5px] border-brand border-t-transparent animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-0 rounded-full border border-brand/30 border-dashed animate-[spin_6s_linear_infinite_reverse]" />
                    
                    <Link 
                      href="/vendor/videos/new"
                      className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-xl shadow-brand/40 active:scale-90 transition-all z-10"
                    >
                      <Plus size={28} strokeWidth={3} />
                    </Link>
                  </div>
                </div>
              )}

              <Link
                href={href}
                className={cn(
                  'w-full flex flex-col items-center justify-center gap-1 overflow-hidden',
                  'transition-all duration-300',
                  active ? 'text-brand' : 'text-neutral-400 hover:text-brand/60',
                )}
                aria-label={label}
              >
                {active && (
                  <div className="absolute top-0 w-8 h-1 rounded-b-full bg-brand animate-in fade-in slide-in-from-top-1 duration-300" />
                )}
                <div className={cn(
                  'p-1 rounded-xl transition-all duration-300',
                  active ? 'bg-brand/10 scale-110' : 'bg-transparent'
                )}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={cn('text-[9px] uppercase tracking-widest transition-all duration-300 font-black', active ? 'opacity-100' : 'opacity-60')}>
                  {label}
                </span>
              </Link>
            </div>
          )
        })}

        {/* WhatsApp Chat button */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          id="vendor-bottom-nav-whatsapp"
          className="flex-1 flex flex-col items-center justify-center gap-1 relative text-[#25D366] opacity-60 hover:opacity-100 transition-all duration-300"
          aria-label="Chat on WhatsApp"
        >
          <div className="p-1 bg-[#25D366]/10 rounded-xl">
             <WhatsAppIcon size={22} />
          </div>
          <span className="text-[9px] uppercase tracking-widest font-black">Support</span>
        </a>
      </div>
    </nav>
  )
}