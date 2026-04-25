'use client'
// FILE: src/components/wishlist/WishlistPointsBadge.jsx
// Points card: level badge, XP progress bar, recent events,
// and a breakdown by category. Shown on the wishlist index page.

import { cn } from '@/utils/cn'
import { LEVEL_TITLES, POINT_VALUES } from '@/hooks/useWishlist'
import {
  Star, Share2, Heart, Gift, Users,
  TrendingUp, Zap, Trophy, Sparkles,
  Award, ChevronRight,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

const EVENT_ICONS = {
  list_shared:        { icon: Share2,   color: 'text-brand',    bg: 'bg-brand/10'    },
  item_voted:         { icon: Heart,    color: 'text-rose-500', bg: 'bg-rose-500/10'     },
  gift_received:      { icon: Gift,     color: 'text-purple-600',bg: 'bg-purple-500/10'  },
  friend_joined:      { icon: Users,    color: 'text-blue-600', bg: 'bg-blue-500/10'     },
  friend_purchased:   { icon: Star,     color: 'text-amber-600',bg: 'bg-amber-500/10'    },
  list_completed:     { icon: Trophy,   color: 'text-amber-600',bg: 'bg-amber-500/10'    },
  streak_bonus:       { icon: Zap,      color: 'text-orange-500',bg: 'bg-orange-500/10'  },
  milestone_10_votes: { icon: Award,    color: 'text-amber-500',bg: 'bg-amber-500/10'    },
  first_share:        { icon: Sparkles, color: 'text-brand',    bg: 'bg-brand/10'    },
  referral_purchase:  { icon: TrendingUp,color:'text-emerald-600',bg:'bg-emerald-500/10' },
  list_copied:        { icon: Users,    color: 'text-violet-600',bg: 'bg-violet-500/10'  },
}

const EVENT_LABELS = {
  list_shared:        'Shared a wishlist',
  item_voted:         'Friend voted on your item',
  gift_received:      'Someone bought you a gift',
  friend_joined:      'Friend joined via your link',
  friend_purchased:   'Friend made a purchase',
  list_completed:     'All items gifted!',
  streak_bonus:       '7-day sharing streak',
  milestone_10_votes: '10 votes milestone',
  first_share:        'First ever share',
  referral_purchase:  'Referral purchase',
  list_copied:        'Friend copied your list',
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function WishlistPointsBadge({ points, events = [], levelProgress }) {
  if (!points) return null

  const level = points.level ?? 1
  const title = LEVEL_TITLES[level] ?? 'Wishmaker'
  const { pct, current, next } = levelProgress ?? { pct: 0, current: 0, next: 50 }

  return (
    <div className="rounded-3xl overflow-hidden border border-border bg-surface-2 shadow-sm">

      {/* Level header */}
      <div
        className="px-5 pt-5 pb-4 text-white"
        style={{ background: 'linear-gradient(135deg, #052E16 0%, #16A34A 100%)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mb-1">
              Wishlist Points
            </p>
            <p className="text-4xl font-black tracking-tight leading-none">
              {points.total_points.toLocaleString()}
            </p>
            <p className="text-sm text-green-300 font-semibold mt-1">pts</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black bg-white/20"
              >
                {level}
              </div>
            </div>
            <p className="text-xs font-black text-white">{title}</p>
            {points.streak_days > 0 && (
              <p className="text-[10px] text-orange-300 font-bold mt-0.5">
                🔥 {points.streak_days}d streak
              </p>
            )}
          </div>
        </div>

        {/* XP progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-green-300 font-medium">
            <span>Level {level}</span>
            <span>{points.total_points - current} / {next - current} XP to Level {level + 1}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Category breakdown */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'From sharing',   value: points.share_points,   icon: Share2,    color: '#16A34A' },
            { label: 'From votes',     value: points.vote_points,    icon: Heart,     color: '#F43F5E' },
            { label: 'From gifts',     value: points.gift_points,    icon: Gift,      color: '#A855F7' },
            { label: 'From referrals', value: points.referral_points,icon: Users,     color: '#0EA5E9' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-2.5 bg-surface-3 rounded-2xl px-3.5 py-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}18` }}
              >
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-base font-black text-primary leading-none">{stat.value}</p>
                <p className="text-[9px] text-secondary font-medium mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How to earn more */}
        <div className="bg-brand/10 border border-brand/20 rounded-2xl p-3.5 space-y-2">
          <p className="text-[10px] font-black text-brand uppercase tracking-wider">
            How to earn points
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Share a list',      pts: '+10' },
              { label: 'Friend votes',      pts: '+5'  },
              { label: 'Someone gifts you', pts: '+50' },
              { label: 'Friend joins',      pts: '+20' },
              { label: '7-day streak',      pts: '+25' },
              { label: '10 votes on item',  pts: '+30' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[10px] text-brand/80">{item.label}</span>
                <span className="text-[10px] font-black text-brand">{item.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent events */}
        {events.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
              Recent activity
            </p>
            <div className="space-y-2">
              {events.slice(0, 5).map(ev => {
                const cfg = EVENT_ICONS[ev.event_type] ?? EVENT_ICONS.list_shared
                const Ic  = cfg.icon
                return (
                  <div key={ev.id} className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                      <Ic size={13} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">
                        {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">{timeAgo(ev.created_at)}</p>
                    </div>
                    <span className="text-sm font-black text-brand shrink-0">+{ev.points}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}