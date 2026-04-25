'use client'
// FILE: src/components/chat/ConversationItem.jsx

import { cn } from '@/utils/cn'

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return 'now'
  if (s < 3600)  return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  const d = Math.floor(s / 86400)
  if (d < 7)     return `${d}d`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ConversationItem({ dm, active, onClick }) {
  const name    = dm.other_name ?? 'Unknown'
  const initial = name[0]?.toUpperCase() ?? '?'
  const unread  = dm.unread_count ?? 0
  const preview = dm.last_message_preview

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all rounded-2xl mx-1',
        active
          ? 'bg-brand/10 border border-brand/20'
          : 'hover:bg-surface-3 border border-transparent',
      )}
    >
      {/* Avatar + online dot */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-surface-3 flex items-center justify-center">
          {dm.other_avatar ? (
            <img src={dm.other_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-black text-muted">{initial}</span>
          )}
        </div>
        {dm.online && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-brand border-2 border-surface" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn('text-sm font-bold truncate', unread > 0 ? 'text-brand' : 'text-primary')}>
            {name}
          </span>
          <span className="text-[10px] text-muted shrink-0 ml-2">
            {timeAgo(dm.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'text-xs truncate leading-tight',
            unread > 0 ? 'text-primary font-medium' : 'text-muted',
          )}>
            {preview ?? 'No messages yet'}
          </p>
          {unread > 0 && (
            <div className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-brand flex items-center justify-center px-1">
              <span className="text-[9px] font-black text-white">{unread > 99 ? '99+' : unread}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}