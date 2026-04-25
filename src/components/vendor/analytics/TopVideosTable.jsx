'use client'
// FILE: src/components/vendor/analytics/TopVideosTable.jsx

import Link              from 'next/link'
import { Video, Eye, Heart, ArrowRight, TrendingUp } from 'lucide-react'
import { cn }            from '@/utils/cn'

export default function TopVideosTable({ videos = [], loading }) {
  const maxViews = Math.max(...videos.map(v => v.views ?? 0), 1)

  return (
    <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden transition-all">
      <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-neutral-50 bg-neutral-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600">
            <Video size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-black text-brand-900 text-sm sm:text-base uppercase tracking-tight">Top Videos</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Most engaging content</p>
          </div>
        </div>
        <Link href="/vendor/videos" className="px-4 py-2 bg-white border border-neutral-100 rounded-xl text-[10px] font-black text-brand hover:border-brand transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest">
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-neutral-50">
        {loading
          ? Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 sm:px-8 py-5 animate-pulse">
              <div className="w-20 h-12 rounded-2xl bg-neutral-50 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-neutral-50 rounded" />
                <div className="h-3 w-24 bg-neutral-50 rounded" />
              </div>
            </div>
          ))
          : videos.length === 0
            ? (
              <div className="py-20 text-center px-6">
                <div className="w-20 h-20 rounded-[2.5rem] bg-neutral-50 flex items-center justify-center mx-auto mb-6 text-neutral-200">
                  <Video size={32} />
                </div>
                <p className="text-base font-black text-brand-900 uppercase tracking-tight">No videos yet</p>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2 max-w-[220px] mx-auto opacity-60">Upload shoppable videos to see performance here</p>
              </div>
            )
            : videos.map((v, i) => {
              const viewPct    = ((v.views ?? 0) / maxViews) * 100
              const likeRate   = v.views > 0 ? ((v.likes / v.views) * 100).toFixed(1) : '0'
              const conversion = v.conversion_rate ? `${v.conversion_rate}%` : '—'

              return (
                <Link
                  key={v.id}
                  href={`/vendor/videos/${v.id}`}
                  className="block sm:flex items-center gap-5 px-6 sm:px-8 py-5 sm:py-4 hover:bg-neutral-50/80 transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Rank & Thumbnail */}
                    <div className="relative shrink-0">
                       <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white text-[10px] font-black text-neutral-400 flex items-center justify-center z-10 shadow-lg border border-neutral-100">
                         {i + 1}
                       </span>
                       <div className="w-20 h-12 sm:w-24 sm:h-14 rounded-2xl bg-neutral-100 overflow-hidden border border-neutral-100 shadow-sm transition-transform group-hover:scale-105 duration-500 relative">
                        {v.thumbnail_url
                          ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-neutral-300"><Video size={18} /></div>
                        }
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-6 h-6 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-brand ml-0.5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-black text-brand-900 truncate group-hover:text-brand transition-colors tracking-tight">
                        {v.title ?? 'Untitled video'}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          <Eye size={12} className="text-violet-500" /> {(v.views ?? 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          <Heart size={12} className="text-rose-500" /> {(v.likes ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Bar (Mobile Optimized) */}
                  <div className="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-1.5 shrink-0">
                    <div className="flex-1 sm:w-32 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full shadow-sm shadow-violet-500/20 transition-all duration-1000" style={{ width: `${viewPct}%` }} />
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest">{likeRate}% Engagement</span>
                       <span className="sm:hidden w-1 h-1 rounded-full bg-neutral-200" />
                       <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60 sm:hidden">Conv: {conversion}</span>
                       <ArrowRight size={16} className="text-neutral-200 group-hover:text-brand transition-all translate-x-0 group-hover:translate-x-1 sm:hidden" />
                    </div>
                  </div>

                  <div className="hidden sm:block shrink-0 pl-4 border-l border-neutral-50 ml-4">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60 mb-0.5">Conversion</p>
                    <p className="text-sm font-black text-brand-900">{conversion}</p>
                  </div>
                </Link>
              )
            })
        }
      </div>
    </div>
  )
}