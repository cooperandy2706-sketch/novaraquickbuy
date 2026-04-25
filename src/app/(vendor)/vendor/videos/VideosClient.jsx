'use client'
// FILE: src/app/(vendor)/vendor/videos/VideosClient.jsx

import { useState, useTransition, useCallback } from 'react'
import { useRouter }    from 'next/navigation'
import Link             from 'next/link'
import { Plus, Search, RefreshCw, Video, Eye, Heart } from 'lucide-react'
import VideoCard        from '@/components/vendor/videos/VideoCard'
import { useAuth }      from '@/hooks/useAuth'
import { useRealtimeVideos } from '@/hooks/useRealtimeVideos'
import { cn }           from '@/utils/cn'

const TABS = [
  { value: '',          label: 'All'        },
  { value: 'published', label: 'Published'  },
  { value: 'draft',     label: 'Drafts'     },
  { value: 'scheduled', label: 'Scheduled'  },
]

export default function VideosClient({ data: initialData, filters }) {
  const router                       = useRouter()
  const { profile }                  = useAuth()
  const [isPending, startTransition] = useTransition()

  const vendorId = profile?.vendor?.id ?? null
  const data     = useRealtimeVideos(initialData, vendorId)

  const videos   = data?.videos  ?? []
  const total    = data?.total   ?? 0
  const summary  = data?.summary ?? {}
  const loading  = isPending || !data

  const push = useCallback((patch) => {
    const params = new URLSearchParams()
    const next   = { ...filters, ...patch }
    if (next.status) params.set('status', next.status)
    if (next.search) params.set('search', next.search)
    if (next.page > 1) params.set('page', next.page)
    startTransition(() => router.push(`/vendor/videos?${params.toString()}`))
  }, [filters])

  // Total stats
  const totalViews = videos.reduce((s, v) => s + (v.views ?? 0), 0)
  const totalLikes = videos.reduce((s, v) => s + (v.likes ?? 0), 0)

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Videos</h1>
          <p className="text-sm text-muted mt-0.5">
            {summary.published ?? 0} published · {(summary.drafts ?? 0)} drafts
            {totalViews > 0 && ` · ${totalViews.toLocaleString()} views`}
          </p>
        </div>
        <Link href="/vendor/videos/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all shadow-brand active:scale-[0.98]">
          <Plus size={16} /> New Video
        </Link>
      </div>

      {/* Stats row */}
      {(totalViews > 0 || totalLikes > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Views',     value: totalViews.toLocaleString(), icon: Eye,   color: 'text-violet-600 bg-violet-500/10' },
            { label: 'Likes',     value: totalLikes.toLocaleString(), icon: Heart, color: 'text-pink-600 bg-pink-500/10' },
            { label: 'Published', value: summary.published ?? 0,      icon: Video, color: 'text-emerald-600 bg-emerald-500/10' },
          ].map(s => (
            <div key={s.label} className="bg-surface-2 rounded-2xl border border-border p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 shadow-sm text-center sm:text-left overflow-hidden">
              <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0', s.color)}>
                <s.icon size={14} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-lg font-bold text-primary tabular-nums leading-tight truncate">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center bg-surface-2 border border-border rounded-xl p-1 gap-0.5 shadow-sm overflow-x-auto no-scrollbar max-w-full">
        {TABS.map(tab => (
          <button key={tab.value}
            onClick={() => push({ status: tab.value, page: 1 })}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              filters.status === tab.value
                ? 'bg-brand text-white shadow-sm'
                : 'text-muted hover:text-primary',
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input type="text" placeholder="Search videos…" defaultValue={filters.search}
            onChange={e => push({ search: e.target.value, page: 1 })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all" />
        </div>
        {isPending && <RefreshCw size={14} className="text-neutral-400 animate-spin" />}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-surface-2 rounded-2xl border border-border overflow-hidden">
              <div className="aspect-[9/16] bg-surface-3 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 w-24 bg-surface-3 rounded animate-pulse" />
                <div className="h-3 w-16 bg-surface-3 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 text-center">
          <Video size={48} className="text-muted/20 mx-auto mb-4" />
          <p className="text-sm font-semibold text-muted">
            {filters.search || filters.status ? 'No videos match your filter' : 'No videos yet'}
          </p>
          <p className="text-xs text-muted/60 mt-1 mb-5">
            {!filters.status && !filters.search && 'Upload your first shoppable video to appear on the feed'}
          </p>
          {!filters.search && !filters.status && (
            <Link href="/vendor/videos/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-white font-bold rounded-xl text-sm shadow-brand hover:bg-brand-700 transition-all">
              <Plus size={15} /> Upload First Video
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} onRefresh={() => startTransition(() => router.refresh())} />
          ))}
        </div>
      )}
    </div>
  )
}