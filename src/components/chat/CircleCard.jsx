'use client'
// FILE: src/components/chat/CircleCard.jsx

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

export default function CircleCard({ circle, active, onClick }) {
  const unread  = circle.unread_count ?? 0
  const preview = circle.last_message_preview

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all rounded-2xl mx-1',
        active
          ? 'bg-brand-50 border border-brand-200'
          : 'hover:bg-neutral-50 border border-transparent',
      )}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black relative overflow-hidden"
        style={{ background: circle.color ?? '#16A34A' }}
      >
        {circle.avatar_url ? (
          <img src={circle.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{circle.emoji ?? '💬'}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn('text-sm font-bold truncate', unread > 0 ? 'text-white' : 'text-neutral-700')}>
            {circle.name}
          </span>
          <span className="text-[10px] text-neutral-500 shrink-0 ml-2">
            {timeAgo(circle.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'text-xs truncate leading-tight',
            unread > 0 ? 'text-neutral-700 font-medium' : 'text-neutral-500',
          )}>
            {preview ?? `${circle.member_count ?? 0} members`}
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