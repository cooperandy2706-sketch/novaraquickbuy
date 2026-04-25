'use client'
// FILE: src/components/vendor/analytics/RatingsReviews.jsx

import { Star } from 'lucide-react'
import { cn }   from '@/utils/cn'

function StarRow({ star, count, pct }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5 w-16 shrink-0">
        {Array(5).fill(0).map((_, i) => (
          <Star
            key={i}
            size={11}
            className={i < star ? 'text-amber-400 fill-amber-400' : 'text-neutral-500/20 fill-neutral-500/20'}
          />
        ))}
      </div>
      <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden shadow-inner">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 shadow-sm',
            star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-danger/80',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-neutral-600 w-8 text-right tabular-nums">{count}</span>
      <span className="text-[10px] text-neutral-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

function ReviewCard({ review }) {
  const buyer    = review.buyer
  const name     = buyer?.full_name ?? 'Anonymous'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const date     = new Date(review.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-4 bg-surface-3/30 rounded-xl border border-border space-y-3 hover:bg-surface-3/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {buyer?.avatar_url ? (
            <img src={buyer.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-primary">{name}</p>
            <p className="text-[10px] text-muted font-medium mt-0.5">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {Array(5).fill(0).map((_, i) => (
            <Star key={i} size={12} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-500/20 fill-neutral-500/20'} />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-xs text-secondary leading-relaxed font-medium">{review.comment}</p>
      )}
    </div>
  )
}

export default function RatingsReviews({ avgRating, totalReviews, ratingDist = [], reviews = [], loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-neutral-50 rounded" />
        <div className="h-40 bg-neutral-50 rounded-xl" />
      </div>
    )
  }

  return (
    <div id="reviews" className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden transition-all">
      <div className="px-6 py-5 border-b border-neutral-50 bg-neutral-50/30">
        <h3 className="font-black text-brand-900 text-sm flex items-center gap-2 uppercase tracking-tight">
          <Star size={16} className="text-amber-400 fill-amber-400" /> Ratings & Reviews
        </h3>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left: summary + distribution */}
        <div className="lg:col-span-5 space-y-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-10">
            <div className="text-center sm:text-left">
              <p className="text-6xl sm:text-7xl font-black text-brand-900 tabular-nums tracking-tighter leading-none">
                {avgRating ?? '—'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-4">
                {Array(5).fill(0).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={avgRating && i < Math.round(avgRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-neutral-100 fill-neutral-100'
                    }
                  />
                ))}
              </div>
              <p className="text-[10px] font-black text-neutral-400 mt-4 uppercase tracking-[0.2em] opacity-60">
                Based on {totalReviews.toLocaleString()} reviews
              </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 w-full space-y-3">
              {ratingDist.map(r => (
                <StarRow key={r.star} {...r} />
              ))}
            </div>
          </div>

          {totalReviews === 0 && (
            <div className="text-center py-10 bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
              <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">No reviews yet</p>
            </div>
          )}
        </div>

        {/* Right: recent reviews */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.25em] opacity-50">Recent Activity</p>
             <button className="text-[10px] font-black text-brand uppercase tracking-widest hover:opacity-70 transition-opacity">Show All</button>
          </div>
          
          {reviews.length === 0 ? (
            <div className="py-20 text-center opacity-40">
              <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">No recent reviews</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}