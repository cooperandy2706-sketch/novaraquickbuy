'use client'
// FILE: src/components/vendor/videos/VideoBuyerComments.jsx
// Read-only view of buyer comments — vendor can see but not post
// (posting is buyer-side only)

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, RefreshCw, ChevronDown, Heart } from 'lucide-react'
import { createClient }  from '@/lib/supabase/client'
import { getComments, toggleCommentLike } from '@/lib/actions/feed'
import { cn }            from '@/utils/cn'

function CommentRow({ comment: initialComment }) {
  const [comment, setComment] = useState(initialComment)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  
  const user     = comment.user
  const name     = user?.full_name ?? 'Buyer'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const date     = new Date(comment.created_at).toLocaleDateString('en', {
    month: 'short', day: 'numeric',
  })

  const handleLike = async () => {
    setLikeLoading(true)
    const result = await toggleCommentLike(comment.id)
    if (!result.error) {
      setLiked(result.liked)
      // Update local like count
      setComment(prev => ({
        ...prev,
        likes: result.liked ? (prev.likes || 0) + 1 : Math.max(0, (prev.likes || 0) - 1)
      }))
    }
    setLikeLoading(false)
  }

  return (
    <div className="flex items-start gap-2 sm:gap-3 py-2.5 sm:py-3 border-b border-border last:border-0">
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt={name}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 border border-border" />
      ) : (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-xs font-bold text-primary">{name}</p>
          <p className="text-[10px] text-muted">{date}</p>
        </div>
        <p className="text-sm text-secondary mt-0.5 leading-relaxed">{comment.content}</p>
        
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={cn(
            "flex items-center gap-1 mt-2 text-xs transition-colors",
            liked ? "text-rose-500" : "text-neutral-400 hover:text-rose-500"
          )}
        >
          <Heart 
            size={14} 
            className={cn("transition-all", liked && "fill-rose-500")} 
          />
          <span>{comment.likes || 0}</span>
        </button>
      </div>
    </div>
  )
}

export default function VideoBuyerComments({ videoId, initialCount = 0 }) {
  const supabase   = createClient()
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [hasMore,  setHasMore]  = useState(false)
  const [page,     setPage]     = useState(0)
  const [expanded, setExpanded] = useState(false)
  const channelRef = useRef(null)

  const load = async (p = 0) => {
    setLoading(true)
    const { comments: data } = await getComments(videoId, p)
    if (p === 0) setComments(data ?? [])
    else setComments(prev => [...prev, ...(data ?? [])])
    setHasMore((data ?? []).length === 20)
    setLoading(false)
  }

  useEffect(() => {
    if (!expanded || !videoId) return
    load(0)

    // Live new comments
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const channel = supabase
      .channel(`vendor-comments:${videoId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'video_comments',
        filter: `video_id=eq.${videoId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('video_comments')
          .select('*, user:users(id, full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) setComments(prev => prev.some(c => c.id === data.id) ? prev : [data, ...prev])
      })
      .on('postgres_changes', {
        event:  'DELETE',
        schema: 'public',
        table:  'video_comments',
        filter: `video_id=eq.${videoId}`,
      }, (payload) => {
        setComments(prev => prev.filter(c => c.id !== payload.old.id))
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [expanded, videoId])

  return (
    <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <MessageCircle size={16} className="text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-primary">Buyer Comments</p>
            <p className="text-xs text-muted mt-0.5">
              {initialCount > 0 ? `${initialCount} comment${initialCount !== 1 ? 's' : ''}` : 'No comments yet'}
            </p>
          </div>
        </div>
        <ChevronDown size={16} className={cn('text-muted transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="border-t border-border">
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={18} className="text-muted animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-10 text-center">
              <MessageCircle size={28} className="text-neutral-200 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">No comments yet</p>
              <p className="text-xs text-neutral-300 mt-0.5">Comments from buyers will appear here live</p>
            </div>
          ) : (
            <div className="px-5 divide-y divide-neutral-100">
              {comments.map(c => <CommentRow key={c.id} comment={c} />)}
            </div>
          )}

          {hasMore && (
            <div className="px-5 pb-4 pt-2">
              <button
                onClick={() => { const next = page + 1; setPage(next); load(next) }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-bold text-secondary hover:bg-surface-3 disabled:opacity-50 transition-all font-bold"
              >
                {loading
                  ? <RefreshCw size={12} className="animate-spin" />
                  : <><ChevronDown size={13} /> Load more comments</>
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}