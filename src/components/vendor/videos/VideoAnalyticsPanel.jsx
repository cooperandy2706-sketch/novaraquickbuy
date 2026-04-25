'use client'
// FILE: src/components/vendor/videos/VideoAnalyticsPanel.jsx

import { Eye, Heart, MessageCircle, Share2, Bookmark, ShoppingBag, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className={cn('flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-4 rounded-xl sm:rounded-2xl border', color)}>
      <Icon size={18} strokeWidth={1.8} className="sm:w-[18px] sm:h-[18px] w-4 h-4" />
      <p className="text-base sm:text-xl font-bold tabular-nums leading-tight">
        {Number(value ?? 0).toLocaleString()}
      </p>
      <p className="text-[9px] sm:text-[11px] font-medium text-center leading-tight uppercase tracking-wider sm:normal-case sm:tracking-normal">{label}</p>
    </div>
  )
}

export default function VideoAnalyticsPanel({ video, loading }) {
  if (loading) {
    return (
      <div className="bg-surface-2 rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="h-4 w-28 bg-surface-3 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-surface-3 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const views    = video?.views          ?? 0
  const likes    = video?.likes          ?? 0
  const comments = video?.comments_count ?? 0
  const shares   = video?.shares_count   ?? 0
  const saves    = video?.saves_count    ?? 0
  const tags     = video?.video_tags?.length ?? 0

  // Engagement rate = (likes + comments + shares + saves) / views * 100
  const engagementRate = views > 0
    ? (((likes + comments + shares + saves) / views) * 100).toFixed(1)
    : '0.0'

  // Like rate
  const likeRate = views > 0 ? ((likes / views) * 100).toFixed(1) : '0.0'

  const stats = [
    { icon: Eye,            label: 'Views',       value: views,    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
    { icon: Heart,          label: 'Likes',       value: likes,    color: 'bg-pink-500/10 text-pink-600 border-pink-500/20'       },
    { icon: MessageCircle,  label: 'Comments',    value: comments, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'       },
    { icon: Share2,         label: 'Shares',      value: shares,   color: 'bg-sky-500/10 text-sky-600 border-sky-500/20'         },
    { icon: Bookmark,       label: 'Saves',       value: saves,    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'   },
    { icon: ShoppingBag,    label: 'Products',    value: tags,     color: 'bg-brand/10 text-brand border-brand/20'       },
  ]

  return (
    <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-surface-3/30 flex items-center justify-between">
        <h3 className="font-bold text-primary text-sm flex items-center gap-2">
          <TrendingUp size={14} className="text-brand" /> Video Performance
        </h3>
        {/* Live indicator */}
        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-2.5">
          {stats.map(s => <StatPill key={s.label} {...s} />)}
        </div>

        {/* Engagement summary */}
        {views > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-3/50 border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-primary tabular-nums">{engagementRate}%</p>
              <p className="text-[11px] text-muted mt-0.5">Engagement Rate</p>
            </div>
            <div className="bg-surface-3/50 border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-primary tabular-nums">{likeRate}%</p>
              <p className="text-[11px] text-muted mt-0.5">Like Rate</p>
            </div>
          </div>
        )}

        {views === 0 && (
          <div className="text-center py-3">
            <p className="text-xs text-muted">
              {video?.status === 'published'
                ? 'Stats will update as buyers watch your video'
                : 'Publish your video to start tracking performance'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}