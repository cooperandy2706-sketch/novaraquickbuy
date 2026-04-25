'use client'
// FILE: src/app/(customer)/notifications/page.jsx

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
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',      label: 'All',      icon: Bell         },
  { id: 'unread',   label: 'Unread',   icon: BellOff      },
  { id: 'Orders',   label: 'Orders',   icon: ShoppingBag  },
  { id: 'Messages', label: 'Messages', icon: MessageSquare},
  { id: 'Payments', label: 'Payments', icon: CreditCard   },
  { id: 'Wishlist', label: 'Wishlist', icon: Heart        },
  { id: 'Reviews',  label: 'Reviews',  icon: Star         },
  { id: 'General',  label: 'Other',    icon: Megaphone    },
]

// ─────────────────────────────────────────────────────────────
// NOTIFICATION CARD
// ─────────────────────────────────────────────────────────────

function NotificationCard({ notif, onMarkRead, onDelete }) {
  const icon  = getNotifIcon(notif.type)
  const color = getNotifColor(notif.type)

  return (
    <div className={cn(
      'relative flex items-start gap-3 p-4 rounded-2xl border transition-all group',
      notif.is_read
        ? 'bg-white border-neutral-100 hover:border-neutral-200'
        : 'bg-brand-50/50 border-brand-100 hover:border-brand-200',
    )}>
      {/* Icon / image */}
      <div className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl overflow-hidden',
        color.bg,
      )}>
        {notif.image_url
          ? <img src={notif.image_url} alt="" className="w-full h-full object-cover" />
          : <span>{icon}</span>
        }
      </div>

      {/* Content */}
      <Link
        href={notif.action_url ?? '/notifications'}
        className="flex-1 min-w-0"
        onClick={() => { if (!notif.is_read) onMarkRead([notif.id]) }}
      >
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className={cn(
            'text-sm leading-snug flex-1',
            notif.is_read ? 'font-medium text-neutral-700' : 'font-bold text-neutral-900',
          )}>
            {notif.title}
          </p>
          <span className="text-[10px] text-neutral-400 shrink-0 mt-0.5 whitespace-nowrap">
            {timeAgo(notif.created_at)}
          </span>
        </div>
        {notif.body && (
          <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">
            {notif.body}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            color.bg, color.text,
          )}>
            {getNotifCategory(notif.type)}
          </span>
          {!notif.is_read && (
            <span className="text-[10px] font-bold text-brand bg-brand-100 px-2 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
      </Link>

      {/* Actions — show on hover */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.is_read && (
          <button
            onClick={() => onMarkRead([notif.id])}
            className="w-7 h-7 rounded-lg bg-brand-50 hover:bg-brand-100 flex items-center justify-center transition-colors"
            title="Mark as read"
          >
            <Check size={13} className="text-brand" />
          </button>
        )}
        <button
          onClick={() => onDelete(notif.id)}
          className="w-7 h-7 rounded-lg bg-neutral-50 hover:bg-red-50 flex items-center justify-center transition-colors"
          title="Delete"
        >
          <Trash2 size={13} className="text-neutral-400 hover:text-red-500" />
        </button>
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand group-hover:hidden" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState({ filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-3xl mb-4">
        {filter === 'unread' ? '✅' : '🔔'}
      </div>
      <h3 className="text-base font-bold text-neutral-700 mb-1">
        {filter === 'unread' ? "You're all caught up!" : 'No notifications here'}
      </h3>
      <p className="text-sm text-neutral-400 max-w-xs leading-relaxed">
        {filter === 'unread'
          ? "No unread notifications. We'll let you know when something happens."
          : "Notifications will appear here as you use Novara."}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DATE GROUP HEADER
// ─────────────────────────────────────────────────────────────

function DateGroupHeader({ label }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-neutral-200" />
      <span className="text-xs font-semibold text-neutral-400 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-neutral-200" />
    </div>
  )
}

function getDateGroup(iso) {
  const d    = new Date(iso)
  const diff = Math.floor((Date.now() - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)   return 'This week'
  if (diff < 30)  return 'This month'
  return 'Older'
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function NotificationsPage() {
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

  const groupOrder = ['Today', 'Yesterday', 'This week', 'This month', 'Older']

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
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-black text-neutral-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand bg-brand-50 hover:bg-brand-100 transition-colors border border-brand-100"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}

          {/* Select mode toggle */}
          <button
            onClick={() => { setSelecting(p => !p); setSelected(new Set()) }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border',
              selecting
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'text-neutral-600 bg-white hover:bg-neutral-50 border-neutral-200',
            )}
          >
            {selecting ? <X size={13} /> : <Filter size={13} />}
            {selecting ? 'Cancel' : 'Select'}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selecting && selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-900 rounded-2xl">
          <span className="text-sm font-semibold text-white flex-1">
            {selected.size} selected
          </span>
          <button
            onClick={handleBulkMarkRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand text-white hover:bg-brand-600 transition-colors"
          >
            <Check size={12} /> Mark read
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => {
          const Icon = f.icon
          const count = f.id === 'unread'
            ? unreadCount
            : f.id === 'all'
              ? notifications.length
              : notifications.filter(n => getNotifCategory(n.type) === f.id).length

          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all border',
                filter === f.id
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300',
              )}
            >
              <Icon size={12} />
              {f.label}
              {count > 0 && (
                <span className={cn(
                  'ml-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-black flex items-center justify-center px-1',
                  filter === f.id ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500',
                )}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading && notifications.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-1">
          {groupOrder.map(groupLabel => {
            const items = groups[groupLabel]
            if (!items?.length) return null
            return (
              <div key={groupLabel}>
                <DateGroupHeader label={groupLabel} />
                <div className="space-y-2">
                  {items.map(notif => (
                    <div
                      key={notif.id}
                      className="relative"
                      onClick={selecting ? () => toggleSelect(notif.id) : undefined}
                    >
                      {/* Select checkbox */}
                      {selecting && (
                        <div className={cn(
                          'absolute left-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                          selected.has(notif.id)
                            ? 'bg-brand border-brand'
                            : 'bg-white border-neutral-300',
                        )}>
                          {selected.has(notif.id) && <Check size={11} className="text-white" />}
                        </div>
                      )}
                      <div className={cn(selecting && 'pl-8 cursor-pointer')}>
                        <NotificationCard
                          notif={notif}
                          onMarkRead={markRead}
                          onDelete={deleteNotification}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Load more */}
          {hasMore && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}