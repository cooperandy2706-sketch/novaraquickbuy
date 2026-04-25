'use client'
// FILE: src/components/notifications/NotificationBell.jsx
// Drop-in bell icon with live unread badge + quick-view dropdown.
// Used in CustomerHeader on mobile. Desktop uses the sidebar badge.

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications }  from '@/hooks/useNotifications'
import { getNotifIcon, getNotifColor, timeAgo } from './notificationUtils'
import { Bell, BellDot, Check, X, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const PREVIEW_LIMIT = 5

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const {
    notifications, unreadCount, loading,
    markRead, markAllRead, deleteNotification,
  } = useNotifications()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Mark visible unread as read when dropdown opens
  useEffect(() => {
    if (!open) return
    const unreadIds = notifications
      .slice(0, PREVIEW_LIMIT)
      .filter(n => !n.is_read)
      .map(n => n.id)
    if (unreadIds.length > 0) {
      setTimeout(() => markRead(unreadIds), 800)
    }
  }, [open])

  const preview = notifications.slice(0, PREVIEW_LIMIT)

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          'relative w-9 h-9 rounded-xl flex items-center justify-center transition-all',
          open ? 'bg-brand-50 text-brand' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
        )}
      >
        {unreadCount > 0
          ? <BellDot size={20} className="text-brand" />
          : <Bell size={20} />
        }
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] rounded-full bg-brand text-white text-[9px] font-black flex items-center justify-center px-1 border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-neutral-500" />
                <span className="text-sm font-bold text-neutral-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-brand text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-600 transition-colors"
                >
                  <Check size={11} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {loading && preview.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-brand" />
                </div>
              ) : preview.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Bell size={32} className="text-neutral-200" />
                  <p className="text-sm text-neutral-400">All caught up!</p>
                </div>
              ) : (
                preview.map(notif => (
                  <NotificationRow
                    key={notif.id}
                    notif={notif}
                    onMarkRead={() => markRead([notif.id])}
                    onDelete={() => deleteNotification(notif.id)}
                    onClick={() => setOpen(false)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-100 px-4 py-3">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-brand hover:text-brand-600 transition-colors"
              >
                View all notifications <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Single row in the dropdown ───────────────────────────────
function NotificationRow({ notif, onMarkRead, onDelete, onClick }) {
  const [hovered, setHovered] = useState(false)
  const icon  = getNotifIcon(notif.type)
  const color = getNotifColor(notif.type)

  return (
    <Link
      href={notif.action_url ?? '/notifications'}
      onClick={() => { if (!notif.is_read) onMarkRead(); onClick() }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors relative group',
        !notif.is_read && 'bg-brand-50/40',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg',
        color.bg,
      )}>
        {notif.image_url ? (
          <img src={notif.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span>{icon}</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-snug',
          !notif.is_read ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700',
        )}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
            {notif.body}
          </p>
        )}
        <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(notif.created_at)}</p>
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />
      )}

      {/* Delete on hover */}
      {hovered && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete() }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-neutral-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
        >
          <X size={10} />
        </button>
      )}
    </Link>
  )
}