'use client'
// FILE: src/components/layout/customer/CustomerSidebar.jsx

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Compass, ShoppingCart, Heart,
  MessageCircle, Package, User, Bell,
  ChevronLeft, ChevronRight, Store,
  BadgeCheck, LogOut, Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/hooks/useCart'
import { useNotificationStore } from '@/store/notificationStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { useStatuses } from '@/hooks/useStatuses'
import StatusRingAvatar from '@/components/chat/StatusRingAvatar'

const NAV = [
  { label: 'Feed', icon: Home, href: '/feed' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Cart', icon: ShoppingCart, href: '/cart' },
  { label: 'Wishlist', icon: Heart, href: '/wishlist' },
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'About', icon: BadgeCheck, href: '/about' },
  { label: 'Profile', icon: User, href: '/profile' },
]

function NavTooltip({ label }) {
  return (
    <div className="
      absolute left-full ml-3 top-1/2 -translate-y-1/2
      bg-surface-1  text-primary text-xs font-semibold
      px-3 py-1.5 rounded-xl whitespace-nowrap
      pointer-events-none z-50 shadow-2xl border border-border
      opacity-0 group-hover:opacity-100
      translate-x-1 group-hover:translate-x-0
      transition-all duration-150
    ">
      {label}
      <span className="
        absolute right-full top-1/2 -translate-y-1/2
        border-4 border-transparent border-r-border
      " />
    </div>
  )
}

// FIX: replaced 'conversations' + 'conversation_participants' with
// 'dm_threads' + 'dm_thread_reads' — the correct tables after cleanup
function useRecentConversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const supabase = createClient()

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }

    // FIX: removed FK hints (!dm_threads_participant_a_fkey) — caused 400s
    // Fetch threads first, then profiles separately
    const { data, error } = await supabase
      .from('dm_threads')
      .select(`
        id, last_message, last_message_at,
        participant_a, participant_b,
        reads:dm_thread_reads ( unread_count, user_id )
      `)
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(4)

    if (!error && data) {
      const otherIds = data.map(t =>
        t.participant_a === user.id ? t.participant_b : t.participant_a
      ).filter(Boolean)

      const { data: profiles } = otherIds.length > 0
        ? await supabase.from('users').select('id, full_name, avatar_url').in('id', [...new Set(otherIds)])
        : { data: [] }

      const profileMap = {}
      for (const p of profiles ?? []) profileMap[p.id] = p

      setConversations(
        data.map(thread => {
          const otherId = thread.participant_a === user.id ? thread.participant_b : thread.participant_a
          const other = profileMap[otherId] ?? null
          const myRead = thread.reads?.find(r => r.user_id === user.id)
          const name = other?.full_name ?? 'Unknown'
          return {
            id: thread.id,
            name,
            avatar_url: other?.avatar_url ?? null,
            initial: name.charAt(0).toUpperCase(),
            unread: myRead?.unread_count ?? 0,
            last_message: thread.last_message,
            last_at: thread.last_message_at,
          }
        })
      )
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetch()
    if (!user) return

    const channel = supabase
      .channel('sidebar-dms')
      // FIX: was 'messages' + 'conversations' — now correct tables
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'dm_messages',
      }, fetch)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'dm_threads',
      }, fetch)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'dm_thread_reads',
        filter: `user_id=eq.${user.id}`,
      }, fetch)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetch])

  return { conversations, loading }
}

const AVATAR_COLORS = ['#16A34A', '#F59E0B', '#7C3AED', '#EF4444', '#0EA5E9', '#EC4899']
function getAvatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function LogoIcon() {
  return (
    <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0"
      style={{ boxShadow: '0 2px 8px rgba(22,163,74,0.30)' }}>
      <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
        <path d="M10 22 L18 22 Q21 22 22 25 L29 58 Q30 61 33 61 L76 61 Q79 61 80 58 L87 34 Q88 31 85 31 L26 31"
          stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="39" cy="73" r="6" stroke="#fff" strokeWidth="4" fill="none" />
        <circle cx="66" cy="73" r="6" stroke="#fff" strokeWidth="4" fill="none" />
        <ellipse cx="44" cy="46" rx="16" ry="11" fill="#052E16" />
        <circle cx="38" cy="46" r="2.2" fill="#fff" />
        <circle cx="44" cy="46" r="2.2" fill="#fff" />
        <circle cx="50" cy="46" r="2.2" fill="#fff" />
        <ellipse cx="61" cy="53" rx="12" ry="8.5" fill="#F59E0B" />
        <path d="M80 10 L82.5 17.5 L90.5 17.5 L84.2 22.2 L86.5 30 L80 25.3 L73.5 30 L75.8 22.2 L69.5 17.5 L77.5 17.5 Z"
          fill="#F59E0B" />
      </svg>
    </div>
  )
}

export default function CustomerSidebar() {
  const collapsed = useUiStore(s => s.customerSidebarCollapsed)
  const setCollapsed = useUiStore(s => s.setCustomerSidebarCollapsed)
  const pathname = usePathname()
  const { count: cartCount } = useCart()
  const unread = useNotificationStore(s => s.unreadCount)
  const wishCount = useWishlistStore(s => Object.keys(s.addedItems ?? {}).length)
  const { isLoggedIn, profile, isVendor, isAdmin, handleSignOut } = useAuth()
  const { conversations, loading } = useRecentConversations()
  const { statuses, refetch } = useStatuses()
  const { openStatusViewer, openStatusUploader } = useUiStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'
  const totalUnread = conversations.reduce((s, c) => s + (c.unread ?? 0), 0)

  const getBadge = (href) => {
    if (href === '/cart') return cartCount > 0 ? cartCount : null
    if (href === '/notifications') return unread > 0 ? unread : null
    if (href === '/wishlist') return wishCount > 0 ? wishCount : null
    return null
  }

  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a question about an order on Novara QuickBuy.')}`

  return (
    <aside className={cn(
      'hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30',
      'bg-surface',
      'border-r border-border',
      'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
      collapsed ? 'w-[72px]' : 'w-60',
    )}>

      {/* Logo + collapse toggle */}
      <div className={cn(
        'flex items-center border-b border-border shrink-0 h-14',
        collapsed ? 'justify-center px-0' : 'justify-between px-4',
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <LogoIcon />
            <div className="flex flex-col justify-center gap-[2px]">
              <span className="font-extrabold text-primary text-[15px] leading-none"
                style={{ letterSpacing: '-0.03em' }}>novara</span>
              <span className="text-[8px] font-bold text-muted tracking-[0.2em] uppercase leading-none">quickbuy</span>
            </div>
          </div>
        )}
        {collapsed && <LogoIcon />}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)}
            className="w-6 h-6 rounded-lg flex items-center justify-center border border-border bg-surface-2 text-muted hover:text-primary hover:border-brand/40 hover:bg-surface-3 transition-all shrink-0">
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* Expand button (collapsed only) */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="mx-auto mt-3 w-8 h-8 rounded-xl flex items-center justify-center border border-border bg-surface-2 text-muted hover:text-primary hover:border-brand/40 hover:bg-surface-3 transition-all shrink-0">
          <ChevronRight size={13} />
        </button>
      )}

      {/* Section label */}
      {!collapsed && (
        <p className="px-5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
          Menu
        </p>
      )}

      {/* Nav links */}
      <nav className={cn('flex-1 overflow-y-auto py-2', collapsed ? 'px-2' : 'px-3')}>
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const badge = getBadge(href)
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-all duration-150 relative group mb-0.5',
                collapsed ? 'justify-center p-2' : 'px-3 py-2.5',
                active
                  ? 'bg-brand/10 text-brand'
                  : 'text-secondary hover:bg-surface-3 hover:text-primary',
              )}>
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 relative',
                active
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-surface-3 text-muted group-hover:bg-surface-2 group-hover:text-secondary',
              )}>
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                {collapsed && badge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand border-2 border-surface" />
                )}
              </div>
              {!collapsed && (
                <>
                  <span className={cn('flex-1 text-sm', active ? 'font-semibold' : 'font-medium')}>{label}</span>
                  {badge && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && <NavTooltip label={label} />}
            </Link>
          )
        })}

        {/* Vendor dashboard link */}
        {isVendor && (
          <>
            {!collapsed && <div className="h-px border-border my-2 mx-1" />}
            <Link href="/vendor/dashboard"
              className={cn(
                'flex items-center gap-3 rounded-xl transition-all duration-150 relative group mb-0.5',
                collapsed ? 'justify-center p-2' : 'px-3 py-2.5',
                'text-brand hover:bg-brand/10'
              )}>
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 text-brand relative">
                <Store size={15} strokeWidth={1.8} />
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">Vendor Dashboard</span>
                  <BadgeCheck size={13} className="text-brand shrink-0" />
                </>
              )}
              {collapsed && <NavTooltip label="Vendor Dashboard" />}
            </Link>
          </>
        )}

        {/* Admin Console link */}
        {isAdmin && (
          <>
            {!collapsed && <div className="h-px border-border my-2 mx-1" />}
            <Link href="/admin/dashboard"
              className={cn(
                'flex items-center gap-3 rounded-xl transition-all duration-150 relative group mb-0.5',
                collapsed ? 'justify-center p-2' : 'px-3 py-2.5',
                'text-amber-500 hover:bg-amber-500/10'
              )}>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500 relative border border-amber-500/20">
                <Shield size={15} strokeWidth={1.8} />
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">Admin Console</span>
                  <BadgeCheck size={13} className="text-amber-500 shrink-0" />
                </>
              )}
              {collapsed && <NavTooltip label="Admin Console" />}
            </Link>
          </>
        )}
      </nav>

      {/* WhatsApp Messages section */}
      <div className={cn(
        'border-t border-border shrink-0',
        collapsed ? 'px-2 py-3' : 'px-3 py-3',
      )}>
        {!collapsed && (
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Messages</p>
          </div>
        )}

        <div className={cn('bg-surface-3 rounded-2xl overflow-hidden', collapsed ? 'p-1.5' : 'p-2')}>
          {collapsed ? (
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors mx-auto block"
              title="Chat on WhatsApp"
            >
              <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
                <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z" />
              </svg>
            </a>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 px-1 py-1">
                <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 32 32" width="16" height="16" fill="#25D366">
                    <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">WhatsApp Messaging</p>
                  <p className="text-[10px] text-muted">Chat with vendors &amp; support</p>
                </div>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                id="customer-sidebar-whatsapp"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
              >
                Open WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* User footer */}
      <div className={cn(
        'border-t border-border shrink-0',
        collapsed ? 'flex flex-col items-center justify-center py-3' : 'flex items-center gap-3 px-4 py-3',
      )}>
        {isLoggedIn ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <StatusRingAvatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                statuses={statuses}
                size={collapsed ? 32 : 36}
                onClick={() => {
                  if (statuses.length > 0) openStatusViewer()
                  else if (!isVendor) window.location.href = '/profile'
                }}
                onAdd={null}
              />

            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-primary truncate leading-tight">{profile?.full_name}</p>
                  </div>
                  <p className="text-[10px] text-muted truncate capitalize">{profile?.role ?? 'Buyer'}</p>
                </div>
                <button onClick={handleSignOut}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-danger hover:bg-danger/10 transition-all shrink-0"
                  title="Sign out">
                  <LogOut size={13} />
                </button>
              </>
            )}
          </>
        ) : (
          !collapsed && (
            <div className="flex flex-col gap-2 w-full">
              <Link href="/login" className="btn btn-primary btn-sm w-full text-center">Sign In</Link>
              <Link href="/register" className="btn btn-secondary btn-sm w-full text-center">Register</Link>
            </div>
          )
        )}
      </div>
    </aside>
  )
}