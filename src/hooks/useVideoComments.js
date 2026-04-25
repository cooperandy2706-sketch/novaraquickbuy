// FILE: src/hooks/useVideoComments.js
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient }                      from '@/lib/supabase/client'
import { postComment, deleteComment, getComments } from '@/lib/actions/feed'

export function useVideoComments(videoId) {
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [posting,  setPosting]  = useState(false)
  const [hasMore,  setHasMore]  = useState(true)
  const [page,     setPage]     = useState(0)

  const supabase = createClient()

  useEffect(() => {
    if (!videoId) return
    setLoading(true)
    getComments(videoId, 0).then(({ comments: data }) => {
      setComments(data ?? [])
      if ((data ?? []).length < 20) setHasMore(false)
      setLoading(false)
    })
  }, [videoId])

  useEffect(() => {
    if (!videoId) return
    const channel = supabase
      .channel(`comments:${videoId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'video_comments', filter: `video_id=eq.${videoId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('video_comments')
          .select('*, user:users(id, full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setComments(prev => {
            if (prev.find(c => c.id === data.id)) return prev
            return [data, ...prev]
          })
        }
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public',
        table: 'video_comments', filter: `video_id=eq.${videoId}`,
      }, (payload) => {
        setComments(prev => prev.filter(c => c.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [videoId])

  const submit = useCallback(async (content, replyToId = null) => {
    if (!content?.trim()) return
    setPosting(true)

    const tempId = `temp-${Date.now()}`
    const { data: { user } } = await supabase.auth.getUser()

    const optimistic = {
      id:          tempId,
      video_id:    videoId,
      content:     content.trim(),
      reply_to_id: replyToId,
      likes:       0,
      created_at:  new Date().toISOString(),
      user: {
        id:         user?.id,
        full_name:  user?.user_metadata?.full_name ?? 'You',
        avatar_url: user?.user_metadata?.avatar_url ?? null,
      },
      _optimistic: true,
    }

    setComments(prev => [optimistic, ...prev])

    const result = await postComment(videoId, content, replyToId)

    if (result.error) {
      setComments(prev => prev.filter(c => c.id !== tempId))
      setPosting(false)
      return { error: result.error }
    }

    setComments(prev => prev.map(c => c.id === tempId ? result.comment : c))
    setPosting(false)
    return { success: true }
  }, [videoId])

  const remove = useCallback(async (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    await deleteComment(commentId)
  }, [])

  const loadMore = useCallback(async () => {
    if (!hasMore) return
    const next = page + 1
    const { comments: more } = await getComments(videoId, next)
    if ((more ?? []).length < 20) setHasMore(false)
    setComments(prev => [...prev, ...(more ?? [])])
    setPage(next)
  }, [videoId, page, hasMore])

  return { comments, loading, posting, hasMore, submit, remove, loadMore }
}