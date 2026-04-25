'use client'
// FILE: src/components/vendor/chat/ChatThreadRow.jsx

import Link   from 'next/link'
import { cn } from '@/utils/cn'

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)  return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d`
  return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function ChatThreadRow({ thread, active = false }) {
  const other   = thread.other
  const name    = other?.full_name ?? 'User'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hasUnread = (thread.unread ?? 0) > 0
  const preview = thread.last_message

  return (
    <Link
      href={`/vendor/chat/${thread.id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 transition-all duration-100',
        active
          ? 'bg-brand/10 border-l-2 border-brand'
          : 'hover:bg-surface-3 border-l-2 border-transparent',
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={cn(
          'w-11 h-11 rounded-full overflow-hidden',
          active ? 'ring-2 ring-brand ring-offset-1' : '',
        )}>
          {other?.avatar_url
            ? <img src={other.avatar_url} alt={name} className="w-full h-full object-cover" />
            : <div className={cn(
                'w-full h-full flex items-center justify-center text-sm font-bold',
                active ? 'bg-brand text-white' : 'bg-surface-3 text-secondary',
              )}>
                {initials}
              </div>
          }
        </div>
        {/* Online dot placeholder — enhanced when presence wired */}
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'text-sm truncate',
            hasUnread || active ? 'font-bold text-primary' : 'font-medium text-secondary',
          )}>
            {name}
          </p>
          <span className={cn(
            'text-[10px] shrink-0',
            hasUnread ? 'text-brand font-bold' : 'text-muted',
          )}>
            {timeAgo(thread.updated_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={cn(
            'text-xs truncate flex-1',
            hasUnread ? 'font-semibold text-primary' : 'text-muted',
          )}>
            {preview || 'Start a conversation'}
          </p>
          {hasUnread && (
            <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center px-1">
              {thread.unread > 99 ? '99+' : thread.unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}