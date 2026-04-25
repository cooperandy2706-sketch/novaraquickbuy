'use client'
// FILE: src/components/vendor/videos/VideoCard.jsx

import { useState, useRef } from 'react'
import Link                 from 'next/link'
import { useRouter }        from 'next/navigation'
import {
  Eye, Heart, Play, MoreHorizontal,
  Edit2, Trash2, Eye as EyeIcon, EyeOff,
  Tag, Clock, Calendar,
} from 'lucide-react'
import { toggleVideoStatus, deleteVideo } from '@/lib/actions/videos'
import { cn }               from '@/utils/cn'

const STATUS_STYLES = {
  published: 'bg-emerald-500',
  draft:     'bg-muted',
  scheduled: 'bg-amber-500',
}

function fmt(n) {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n/1000).toFixed(1)}K`
  return String(n)
}

function fmtDuration(s) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function VideoCard({ video, onRefresh }) {
  const router              = useRouter()
  const [menuOpen, setMenu] = useState(false)
  const [loading,  setLoad] = useState(false)
  const [hover,    setHover] = useState(false)
  const videoRef            = useRef(null)

  const isPublished = video.status === 'published'

  const handleToggle = async () => {
    setLoad(true)
    await toggleVideoStatus(video.id, isPublished ? 'draft' : 'published')
    setLoad(false)
    setMenu(false)
    onRefresh?.()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return
    setLoad(true)
    await deleteVideo(video.id)
    setLoad(false)
    onRefresh?.()
  }

  const handleMouseEnter = () => {
    setHover(true)
    videoRef.current?.play().catch(() => {})
  }

  const handleMouseLeave = () => {
    setHover(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div className="group bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
      
      {/* Thumbnail area / Hover Player */}
      <Link href={`/vendor/videos/${video.id}`} className="block relative aspect-[9/16] bg-surface-3 overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Thumbnail Image */}
        {video.thumbnail_url && (
          <img 
            src={video.thumbnail_url} 
            alt={video.title} 
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-500",
              hover ? "opacity-0 scale-110" : "opacity-100 scale-100"
            )} 
          />
        )}

        {/* The Actual Video Preview (Plays on Hover, or acts as thumbnail if none) */}
        {video.video_url ? (
          <video
            ref={videoRef}
            src={`${video.video_url}#t=0.001`}
            preload="metadata"
            muted
            loop
            playsInline
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
              (hover || !video.thumbnail_url) ? "opacity-100" : "opacity-0"
            )}
          />
        ) : !video.thumbnail_url && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            <Play size={32} className="text-muted/30" />
          </div>
        )}

        {/* Status dot */}
        <div className={cn('absolute top-3 left-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xl z-10', STATUS_STYLES[video.status] ?? 'bg-neutral-400')} />

        {/* Duration */}
        {video.duration_seconds > 0 && !hover && (
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg font-mono z-10">
            {fmtDuration(video.duration_seconds)}
          </div>
        )}

        {/* Tags count */}
        {video.video_tags?.length > 0 && !hover && (
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 z-10">
            <Tag size={10} /> {video.video_tags.length}
          </div>
        )}

        {/* Play overlay (Visual hint) */}
        {!hover && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10">
            <div className="w-12 h-12 rounded-full bg-surface-1/90 backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 shadow-2xl">
              <Play size={20} className="text-brand ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        {/* More menu button (outside the hover area for precision) */}
        <div className="absolute top-2 right-2 z-20">
          <div className="relative">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setMenu(o => !o) }}
              className="w-9 h-9 rounded-xl bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all sm:opacity-0 sm:group-hover:opacity-100 border border-white/10"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-10 z-20 w-44 bg-surface-2 rounded-2xl shadow-2xl border border-border py-2 overflow-hidden animate-scale-in">
                  <Link href={`/vendor/videos/${video.id}`} onClick={() => setMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-primary hover:bg-surface-3 transition-colors">
                    <Edit2 size={13} className="text-muted" /> Edit Details
                  </Link>
                  <button onClick={(e) => { e.stopPropagation(); handleToggle() }} disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-primary hover:bg-surface-3 transition-colors text-left">
                    {isPublished ? <><EyeOff size={13} className="text-muted" /> Unpublish</> : <><EyeIcon size={13} className="text-muted" /> Publish Now</>}
                  </button>
                  <div className="border-t border-border my-1.5 mx-2" />
                  <button onClick={(e) => { e.stopPropagation(); handleDelete() }} disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-danger hover:bg-danger/10 transition-colors text-left">
                    <Trash2 size={13} /> Delete Video
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Link>


      {/* Card info */}
      <div className="p-3 space-y-2">
        <Link href={`/vendor/videos/${video.id}`}>
          <p className="text-sm font-bold text-primary truncate hover:text-brand transition-colors">
            {video.title || 'Untitled'}
          </p>
        </Link>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1"><Eye size={11} /> {fmt(video.views ?? 0)}</span>
          <span className="flex items-center gap-1"><Heart size={11} /> {fmt(video.likes ?? 0)}</span>
          {video.status === 'scheduled' && video.scheduled_at && (
            <span className="flex items-center gap-1 text-amber-600 ml-auto">
              <Calendar size={11} />
              {new Date(video.scheduled_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
            video.status === 'published' ? 'bg-emerald-500/10 text-emerald-600'
            : video.status === 'scheduled' ? 'bg-amber-500/10 text-amber-600'
            : 'bg-muted/10 text-muted',
          )}>
            {video.status}
          </span>
          {video.video_tags?.length > 0 && (
            <span className="text-[10px] text-brand font-semibold">
              {video.video_tags.length} product{video.video_tags.length !== 1 ? 's' : ''} tagged
            </span>
          )}
        </div>
      </div>
    </div>
  )
}