'use client'
// FILE: src/app/(vendor)/vendor/circles/[id]/CircleRoomClient.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter }      from 'next/navigation'
import { useAuth }        from '@/hooks/useAuth'
import { useRealtimeCircleChat } from '@/hooks/useRealtimeCircle'
import Link               from 'next/link'
import {
  ChevronLeft, Users, Settings, Pin,
  MoreHorizontal, Trash2, Edit2, Bell, BellOff,
  Crown, Zap, ShoppingBag, Megaphone, RefreshCw,
} from 'lucide-react'
import CircleMessageBubble from '@/components/vendor/circles/CircleMessageBubble'
import CircleComposer      from '@/components/vendor/circles/CircleComposer'
import CircleMembersPanel  from '@/components/vendor/circles/CircleMembersPanel'
import CircleCreateModal   from '@/components/vendor/circles/CircleCreateModal'
import PrivateDMDrawer     from '@/components/vendor/circles/PrivateDMDrawer'
import { deleteCircle, getCircleMessages } from '@/lib/actions/circles'
import { cn }              from '@/utils/cn'

const TYPE_CONFIG = {
  general:       { icon: Users,       color: 'text-brand',         bg: 'bg-brand/10'        },
  vip:           { icon: Crown,       color: 'text-amber-600',     bg: 'bg-amber-500/10'    },
  wholesale:     { icon: ShoppingBag, color: 'text-emerald-700',   bg: 'bg-emerald-500/10'  },
  flash_sale:    { icon: Zap,         color: 'text-orange-600',    bg: 'bg-orange-500/10'   },
  announcements: { icon: Megaphone,   color: 'text-violet-600',    bg: 'bg-violet-500/10'   },
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator({ users }) {
  if (!users.length) return null
  const names = users.slice(0, 2).map(u => u.name?.split(' ')[0]).join(', ')
  return (
    <div className="px-4 py-1.5 flex items-center gap-2">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
      <span className="text-xs text-muted">{names} {users.length === 1 ? 'is' : 'are'} typing…</span>
    </div>
  )
}

// ── Date separator ─────────────────────────────────────────────────────────────
function DateSeparator({ date }) {
  const label = (() => {
    const d     = new Date(date)
    const today = new Date()
    const yest  = new Date(today)
    yest.setDate(yest.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yest.toDateString())  return 'Yesterday'
    return d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
  })()
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-[10px] font-semibold text-muted bg-surface-2 px-2 rounded-full border border-border/50">{label}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  )
}

import ComingSoon from '@/components/vendor/ComingSoon'

export default function CircleRoomClient() {
  return (
    <ComingSoon 
      title="Circles" 
      desc="Direct interaction with community members and private room management is coming soon."
      icon={Users}
    />
  )
}