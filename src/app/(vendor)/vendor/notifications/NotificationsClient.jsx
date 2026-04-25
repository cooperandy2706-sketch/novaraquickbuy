'use client'
// FILE: src/app/(vendor)/vendor/notifications/NotificationsClient.jsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'
import { getNotifIcon, getNotifColor, getNotifCategory, timeAgo } from '@/components/notifications/notificationUtils'
import { cn } from '@/utils/cn'
import {
  Bell, Check, CheckCheck, Trash2,
  Filter, Loader2, ArrowLeft,
  RefreshCw, BellOff, X,
  ShoppingBag, MessageSquare, Heart,
  CreditCard, Star, Megaphone,
  TrendingUp, Users, ChevronRight
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// FILTER TABS (Vendor Optimized)
// ─────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',      label: 'All Activity', icon: Bell         },
  { id: 'Orders',   label: 'New Orders',   icon: ShoppingBag  },
  { id: 'Payments', label: 'Payouts',      icon: CreditCard   },
  { id: 'Messages', label: 'Inquiries',    icon: MessageSquare},
  { id: 'Reviews',  label: 'Ratings',      icon: Star         },
  { id: 'Social',   label: 'Followers',    icon: Users        },
  { id: 'General',  label: 'System',       icon: Megaphone    },
]

// ─────────────────────────────────────────────────────────────
// NOTIFICATION CARD (Premium Vendor Style)
// ─────────────────────────────────────────────────────────────

function NotificationCard({ notif, onMarkRead, onDelete }) {
  const icon  = getNotifIcon(notif.type)
  const color = getNotifColor(notif.type)
  const category = getNotifCategory(notif.type)

  return (
    <div className={cn(
      'relative flex items-start gap-4 p-5 rounded-[2rem] border transition-all group',
      notif.is_read
        ? 'bg-white border-neutral-100 hover:border-brand/10 hover:shadow-xl hover:shadow-brand/5'
        : 'bg-brand/5 border-brand/20 shadow-lg shadow-brand/5',
    )}>
      {/* Icon / image */}
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl overflow-hidden shadow-sm',
        color.bg,
      )}>
        {notif.image_url
          ? <img src={notif.image_url} alt="" className="w-full h-full object-cover" />
          : <span>{icon}</span>
        }
      </div>

      {/* Content */}
      <Link
        href={notif.action_url ?? '/vendor/notifications'}
        className="flex-1 min-w-0 pt-1"
        onClick={() => { if (!notif.is_read) onMarkRead([notif.id]) }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={cn(
            'text-sm sm:text-base leading-tight flex-1',
            notif.is_read ? 'font-black text-brand-900 opacity-60' : 'font-black text-brand-900',
          )}>
            {notif.title}
          </p>
          <span className="text-[10px] font-black text-neutral-400 shrink-0 mt-1 uppercase tracking-widest">
            {timeAgo(notif.created_at)}
          </span>
        </div>
        {notif.body && (
          <p className="text-xs sm:text-sm text-neutral-500 font-bold leading-relaxed line-clamp-2 opacity-80">
            {notif.body}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <span className={cn(
            'text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full',
            color.bg, color.text,
          )}>
            {category}
          </span>
          {!notif.is_read && (
            <span className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
               <span className="text-[9px] font-black text-brand uppercase tracking-[0.15em]">Unread</span>
            </span>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.is_read && (
          <button
            onClick={(e) => { e.preventDefault(); onMarkRead([notif.id]) }}
            className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 transition-all hover:scale-110 active:scale-95"
            title="Mark read"
          >
            <Check size={16} strokeWidth={3} />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onDelete(notif.id) }}
          className="w-9 h-9 rounded-xl bg-white border border-neutral-100 text-neutral-400 hover:text-rose-500 hover:border-rose-100 flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95"
          title="Delete"
        >
          <Trash2 size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState({ filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-50 border border-neutral-100 flex items-center justify-center text-4xl mb-6 shadow-sm">
        {filter === 'unread' ? '✨' : '📭'}
      </div>
      <h3 className="text-xl font-black text-brand-900 uppercase tracking-tight mb-2">
        {filter === 'unread' ? "Inbox Zero Reached" : "Nothing to show"}
      </h3>
      <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest opacity-60 max-w-xs leading-relaxed">
        {filter === 'unread'
          ? "You've addressed all critical alerts for now."
          : "We'll notify you here about sales, payouts and followers."}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DATE GROUP HEADER
// ─────────────────────────────────────────────────────────────

function DateGroupHeader({ label }) {
  return (
    <div className="flex items-center gap-4 py-6">
      <div className="flex-1 h-px bg-neutral-100" />
      <span className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.25em] whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-neutral-100" />
    </div>
  )
}

function getDateGroup(iso) {
  const d    = new Date(iso)
  const diff = Math.floor((Date.now() - d) / 86400000)
  if (diff === 0) return 'Recent Activity'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)   return 'Last 7 Days'
  return 'Archived Activity'
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function NotificationsClient() {
  const [filter, setFilter]   = useState('all')
  const [selecting, setSelecting] = useState(false)
  const [selected,  setSelected]  = useState(new Set())

  const {
    notifications, unreadCount, loading, hasMore,
    markRead, markAllRead, deleteNotification, loadMore, refetch,
  } = useNotifications()

  // Filter notifications
  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'all')    return true
    return getNotifCategory(n.type) === filter
  })

  // Group by date
  const groups = filtered.reduce((acc, notif) => {
    const group = getDateGroup(notif.created_at)
    if (!acc[group]) acc[group] = []
    acc[group].push(notif)
    return acc
  }, {})

  const groupOrder = ['Recent Activity', 'Yesterday', 'Last 7 Days', 'Archived Activity']

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkMarkRead = async () => {
    await markRead([...selected])
    setSelected(new Set())
    setSelecting(false)
  }

  const handleBulkDelete = async () => {
    for (const id of selected) {
      await deleteNotification(id)
    }
    setSelected(new Set())
    setSelecting(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-black rounded-full uppercase tracking-widest">Alert System</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Live Engine</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-900 tracking-tighter uppercase">
            Notifications
          </h1>
          <p className="text-sm text-neutral-400 font-bold mt-2 uppercase tracking-widest opacity-80">
            {unreadCount > 0 ? `Attention required: ${unreadCount} new alerts` : 'Your operations are currently stable'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="w-12 h-12 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-brand hover:border-brand shadow-sm transition-all active:scale-95"
            title="Force Sync"
          >
            <RefreshCw size={20} className={cn(loading && 'animate-spin')} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-6 h-12 rounded-2xl bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all active:scale-95 flex items-center gap-2"
            >
              <CheckCheck size={16} strokeWidth={3} /> Clear All
            </button>
          )}

          <button
            onClick={() => { setSelecting(p => !p); setSelected(new Set()) }}
            className={cn(
              'h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-sm border',
              selecting
                ? 'bg-brand-900 text-white border-brand-900'
                : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-200',
            )}
          >
            {selecting ? <X size={16} strokeWidth={3} /> : <Filter size={16} strokeWidth={3} />}
            {selecting ? 'Exit' : 'Select'}
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Floating) */}
      {selecting && selected.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg">
          <div className="bg-brand-900 rounded-3xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-8">
            <div className="flex-1 pl-2">
              <p className="text-white text-[10px] font-black uppercase tracking-widest">{selected.size} items selected</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkRead}
                className="px-5 py-3 rounded-2xl bg-brand text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-400 transition-all active:scale-95"
              >
                Read
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-5 py-3 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-400 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {FILTERS.map(f => {
          const Icon = f.icon
          const count = f.id === 'all'
            ? unreadCount
            : notifications.filter(n => !n.is_read && getNotifCategory(n.type) === f.id).length

          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'flex items-center gap-3 px-6 py-4 rounded-full text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-[0.15em] border',
                filter === f.id
                  ? 'bg-brand text-white border-brand shadow-xl shadow-brand/20'
                  : 'bg-white text-neutral-400 border-neutral-100 hover:border-brand-900 hover:text-brand-900',
              )}
            >
              <Icon size={14} strokeWidth={3} />
              <span>{f.label}</span>
              {count > 0 && (
                <span className={cn(
                  'ml-1 min-w-[18px] h-4.5 rounded-full text-[9px] font-black flex items-center justify-center px-1.5',
                  filter === f.id ? 'bg-white text-brand' : 'bg-brand text-white',
                )}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="pb-20">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-12 h-12 rounded-2xl border-4 border-brand/10 border-t-brand animate-spin" />
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest animate-pulse">Syncing Alerts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-4">
            {groupOrder.map(groupLabel => {
              const items = groups[groupLabel]
              if (!items?.length) return null
              return (
                <div key={groupLabel}>
                  <DateGroupHeader label={groupLabel} />
                  <div className="space-y-4">
                    {items.map(notif => (
                      <div
                        key={notif.id}
                        className="relative"
                        onClick={selecting ? () => toggleSelect(notif.id) : undefined}
                      >
                        {/* Select checkbox overlay */}
                        {selecting && (
                          <div className={cn(
                            'absolute left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm',
                            selected.has(notif.id)
                              ? 'bg-brand border-brand'
                              : 'bg-white border-neutral-200',
                          )}>
                            {selected.has(notif.id) && <Check size={16} strokeWidth={4} className="text-white" />}
                          </div>
                        )}
                        <div className={cn(selecting && 'pl-14 scale-[0.98] blur-[1px] grayscale opacity-50 pointer-events-none transition-all')}>
                          {/* We allow clicking through selecting mode via the parent onClick */}
                          <NotificationCard
                            notif={notif}
                            onMarkRead={markRead}
                            onDelete={deleteNotification}
                          />
                        </div>
                        {/* When selecting, we need a transparent overlay to capture clicks but keep the look */}
                        {selecting && <div className="absolute inset-0 z-30 cursor-pointer" />}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            {hasMore && (
              <div className="pt-12 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white border border-neutral-100 text-[10px] font-black text-neutral-400 hover:text-brand-900 hover:border-brand-900 transition-all disabled:opacity-50 uppercase tracking-widest shadow-sm"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} className="group-hover:-translate-y-1 transition-transform" />}
                  Load Previous Alerts
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
