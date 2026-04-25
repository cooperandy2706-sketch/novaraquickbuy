'use client'
// FILE: src/components/vendor/circles/CircleCard.jsx

import Link   from 'next/link'
import { Users, Pin, Megaphone, Crown, Zap, ShoppingBag } from 'lucide-react'
import { cn } from '@/utils/cn'

const TYPE_CONFIG = {
  general:       { icon: Users,      color: 'bg-brand/10 text-brand',          label: 'General'       },
  vip:           { icon: Crown,      color: 'bg-amber-500/10 text-amber-600',       label: 'VIP'           },
  wholesale:     { icon: ShoppingBag,color: 'bg-emerald-500/10 text-emerald-700',   label: 'Wholesale'     },
  flash_sale:    { icon: Zap,        color: 'bg-orange-500/10 text-orange-600',     label: 'Flash Sale'    },
  announcements: { icon: Megaphone,  color: 'bg-violet-500/10 text-violet-600',     label: 'Announcements' },
}

function fmt(n) {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)  return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function CircleCard({ circle, active = false }) {
  const cfg      = TYPE_CONFIG[circle.type] ?? TYPE_CONFIG.general
  const Icon     = cfg.icon
  const hasUnread = (circle.unread_count ?? 0) > 0

  return (
    <Link
      href={`/vendor/circles/${circle.id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-4 transition-all duration-150 group active:bg-neutral-50',
        active
          ? 'bg-brand text-white'
          : 'bg-white text-brand-900',
      )}
    >
      {/* Circle avatar */}
      <div className={cn(
        'w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-xl shrink-0 relative shadow-sm border border-neutral-100',
        active ? 'bg-white/20 border-white/30' : 'bg-neutral-50',
      )}>
        {circle.cover_url ? (
          <img src={circle.cover_url} alt={circle.name}
            className="w-full h-full rounded-[1.25rem] object-cover" />
        ) : (
          <span className="text-2xl leading-none select-none drop-shadow-sm">{circle.emoji ?? '💬'}</span>
        )}
        {/* Unread dot */}
        {hasUnread && !active && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm px-1 animate-in zoom-in">
            {circle.unread_count > 9 ? '9+' : circle.unread_count}
          </span>
        )}
      </div>
 
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-[15px] font-black uppercase tracking-tight truncate', active ? 'text-white' : 'text-brand-900')}>
            {circle.name}
          </p>
          {circle.last_message_at && (
            <span className={cn('text-[10px] font-bold uppercase tracking-widest shrink-0', active ? 'text-white/70' : 'text-neutral-400')}>
              {timeAgo(circle.last_message_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1',
            active ? 'bg-white/15 text-white/80' : cfg.color)}>
            <Icon size={10} strokeWidth={2.5} /> {cfg.label}
          </span>
          <span className={cn('text-[10px] font-bold flex items-center gap-1', active ? 'text-white/70' : 'text-neutral-400')}>
            <Users size={12} className="opacity-60" /> {fmt(circle.member_count)}
          </span>
          {circle._lastMessage && (
            <p className={cn('text-[11px] font-medium truncate flex-1 ml-1', active ? 'text-white/70' : 'text-neutral-500')}>
              {circle._lastMessage}
            </p>
          )}
        </div>
      </div>
 
      {/* Unread badge on right for active */}
      {hasUnread && active && (
        <span className="w-6 h-6 rounded-full bg-white text-brand text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm">
          {circle.unread_count > 9 ? '9+' : circle.unread_count}
        </span>
      )}
      {!active && <ChevronRight size={18} className="text-neutral-200 shrink-0 group-hover:text-brand transition-colors" />}
    </Link>
  )
}