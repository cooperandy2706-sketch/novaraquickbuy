'use client'
// FILE: src/app/(vendor)/vendor/videos/[id]/VideoEditClient.jsx

import { useRouter }            from 'next/navigation'
import { useAuth }              from '@/hooks/useAuth'
import { useRealtimeVideoDetail } from '@/hooks/useRealtimeVideos'
import { useState, useEffect }  from 'react'
import {
  ChevronLeft, Eye, EyeOff, Loader2,
  ExternalLink, Clock, CheckCircle2, MessageCircle,
  ChevronDown,
} from 'lucide-react'
import VideoForm            from '@/components/vendor/videos/VideoForm'
import VideoAnalyticsPanel  from '@/components/vendor/videos/VideoAnalyticsPanel'
import VideoBuyerComments   from '@/components/vendor/videos/VideoBuyerComments'
import { toggleVideoStatus } from '@/lib/actions/videos'
import { cn }               from '@/utils/cn'

const STATUS_STYLES = {
  published: { label: 'Published',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  draft:     { label: 'Draft',      color: 'bg-neutral-100 text-neutral-500 border-neutral-200', dot: 'bg-neutral-400' },
  scheduled: { label: 'Scheduled',  color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
}

export default function VideoEditClient({ video: initialVideo, products, vendorId }) {
  const router      = useRouter()
  const { profile } = useAuth()
  const vid         = profile?.vendor?.id ?? vendorId

  // Live stats via Realtime
  const { video } = useRealtimeVideoDetail(initialVideo, initialVideo?.id)

  const [toggling, setToggling] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    // Show hint after a short delay
    const timer = setTimeout(() => setShowHint(true), 1500)
    
    // Hide on scroll
    const handleScroll = () => setShowHint(false)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Auto-hide after 8 seconds
    const hideTimer = setTimeout(() => setShowHint(false), 8000)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(hideTimer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const status    = video?.status ?? 'draft'
  const statusCfg = STATUS_STYLES[status] ?? STATUS_STYLES.draft
  const isPublished = status === 'published'

  const handleTogglePublish = async () => {
    setToggling(true)
    await toggleVideoStatus(video.id, isPublished ? 'draft' : 'published')
    setToggling(false)
  }

  return (
    <div className="space-y-6 pb-10">

      {/* Header — mobile-first: 2 rows on small screens, single row on lg+ */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">

        {/* Row 1: Back + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/vendor/videos')}
            className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-brand hover:border-brand-200 transition-all shrink-0"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-brand-900 truncate leading-tight">
              {video?.title || 'Edit Video'}
            </h1>
            {/* Status badge — visible on mobile here, hidden on sm+ (shown in row 2 there) */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap sm:hidden">
              <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border', statusCfg.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                {statusCfg.label}
              </span>
              {video?.scheduled_at && status === 'scheduled' && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <Clock size={11} />
                  {new Date(video.scheduled_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Status (sm+ only) + Action buttons */}
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          {/* Status badge — only on sm+ */}
          <div className="hidden sm:flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border', statusCfg.color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
              {statusCfg.label}
            </span>
            {video?.scheduled_at && status === 'scheduled' && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Clock size={11} />
                {new Date(video.scheduled_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* View on Feed */}
          {isPublished && (
            <a
              href={`/feed?video=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:border-brand hover:text-brand hover:bg-brand-50 transition-all whitespace-nowrap"
            >
              <ExternalLink size={13} /> View on Feed
            </a>
          )}

          {/* Publish / Unpublish */}
          <button
            onClick={handleTogglePublish}
            disabled={toggling || status === 'scheduled'}
            className={cn(
              'flex items-center gap-2 h-9 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap',
              isPublished
                ? 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                : 'bg-brand text-white hover:bg-brand-700 shadow-brand',
            )}
          >
            {toggling
              ? <Loader2 size={14} className="animate-spin" />
              : isPublished
                ? <><EyeOff size={14} /> Unpublish</>
                : <><CheckCircle2 size={14} /> Publish Now</>
            }
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form (2/3) ────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <VideoForm video={video} products={products} vendorId={vid} />
        </div>

        {/* ── Right panel (1/3) ─────────────────────────────────── */}
        <div className="space-y-5">
          {/* Live analytics */}
          <VideoAnalyticsPanel video={video} />

          {/* Buyer comments (read-only, live) */}
          <div id="comments-section">
            <VideoBuyerComments
              videoId={video?.id}
              initialCount={video?.comments_count ?? 0}
            />
          </div>
        </div>
      </div>
      {/* Floating Scroll Hint for Comments */}
      <div className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
        showHint ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}>
        <button 
          onClick={() => {
            const el = document.getElementById('comments-section');
            el?.scrollIntoView({ behavior: 'smooth' });
            setShowHint(false);
          }}
          className="bg-brand text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 active:scale-95 transition-transform"
        >
          <div className="relative">
            <MessageCircle size={18} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand animate-pulse" />
          </div>
          <span className="text-sm font-bold">Scroll to see comments</span>
          <ChevronDown size={16} className="animate-bounce" />
        </button>
      </div>
    </div>
  )
}