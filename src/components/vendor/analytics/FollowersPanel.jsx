'use client'
// FILE: src/components/vendor/analytics/FollowersPanel.jsx

import { UserPlus, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function FollowersPanel({ overview, followerSeries = [], loading }) {
  if (loading) {
    return (
      <div className="bg-surface-2 rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <div className="h-4 w-24 bg-surface-3 rounded animate-pulse" />
        <div className="h-20 bg-surface-3 rounded-xl animate-pulse" />
      </div>
    )
  }

  const total     = overview?.followers     ?? 0
  const newCount  = followerSeries.reduce((s, d) => s + d.value, 0)
  const growth    = overview?.followersGrowth
  const isPos     = growth > 0
  const isNeg     = growth < 0
  const maxVal    = Math.max(...followerSeries.map(d => d.value), 1)

  return (
    <div id="followers" className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden transition-all">
      <div className="px-6 py-4 border-b border-border bg-surface-3/30">
        <h3 className="font-bold text-primary text-sm flex items-center gap-2">
          <Users size={14} className="text-brand" /> Store Followers
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-4 bg-brand/5 rounded-2xl border border-brand/10">
            <p className="text-xl sm:text-2xl font-black text-brand-900 tabular-nums leading-none tracking-tight">{total.toLocaleString()}</p>
            <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-2 opacity-60">Total</p>
          </div>
          <div className="text-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
            <p className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums leading-none tracking-tight">+{newCount.toLocaleString()}</p>
            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-2 opacity-60">New</p>
          </div>
          <div className={cn(
            'text-center p-4 rounded-2xl border transition-all',
            isPos ? 'bg-emerald-500/5 border-emerald-500/10' : 
            isNeg ? 'bg-rose-500/5 border-rose-500/10' : 
                    'bg-neutral-50 border-neutral-100',
          )}>
            <div className="flex items-center justify-center gap-1">
              {isPos && <TrendingUp size={14} className="text-emerald-600" />}
              {isNeg && <TrendingDown size={14} className="text-rose-600" />}
              <p className={cn(
                'text-xl sm:text-2xl font-black tabular-nums leading-none tracking-tight',
                isPos ? 'text-emerald-600' : isNeg ? 'text-rose-600' : 'text-brand-900',
              )}>
                {growth !== null ? `${isPos ? '+' : ''}${growth}%` : '—'}
              </p>
            </div>
            <p className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-2 opacity-60">Period</p>
          </div>
        </div>

        {/* Mini bar chart */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 opacity-60">Daily New Followers</p>
          <div className="flex items-end gap-1 h-16">
            {followerSeries.map((d, i) => {
              const pct = (d.value / maxVal) * 100
              return (
                <div key={i} title={`${d.label}: +${d.value}`}
                  className="flex-1 bg-pink-500/30 hover:bg-pink-500/60 rounded-t-sm transition-all cursor-pointer"
                  style={{ height: `${Math.max(pct, 6)}%` }}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-2 px-1">
            {followerSeries.length > 0 && (
              <>
                <span className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-40">{followerSeries[0]?.label}</span>
                <span className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-40">{followerSeries[followerSeries.length - 1]?.label}</span>
              </>
            )}
          </div>
        </div>

        {newCount === 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-neutral-400">No new followers in this period</p>
            <p className="text-xs text-neutral-300 mt-0.5">Post videos and run campaigns to grow your audience</p>
          </div>
        )}
      </div>
    </div>
  )
}