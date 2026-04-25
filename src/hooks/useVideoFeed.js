// FILE: src/hooks/useVideoFeed.js
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFeedState } from '@/lib/actions/feed'

const PAGE_SIZE = 8

const VIDEO_SELECT = `
  id, vendor_id, title, description, video_url, thumbnail_url,
  duration_seconds, category, hashtags, likes, views,
  comments_count, shares_count, saves_count, created_at,
  vendor:vendors!inner (
    id, store_name, logo_url, verified, trust_score, follower_count, badges
  ),
  video_tags (
    id, position_x, position_y, label,
    product:products (
      id, name, slug, description, price, discount_price, images, stock_quantity, sku, vendor_id
    )
  )
`

export function useVideoFeed(category = null, country = 'all') {
  const [videos,   setVideos]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [hasMore,  setHasMore]  = useState(true)
  const [page,     setPage]     = useState(0)
  const [error,    setError]    = useState(null)
  const [liked,    setLiked]    = useState({})
  const [saved,    setSaved]    = useState({})
  const [followed, setFollowed] = useState({})

  const supabase   = createClient()
  const channelRef = useRef(null)

  const buildQuery = useCallback((from, to) => {
    let q = supabase
      .from('product_videos')
      .select(VIDEO_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (category && category !== 'all') q = q.eq('category', category)
    if (country && country !== 'all')   q = q.eq('vendor.business_country', country)
    return q
  }, [category, country])

  const fetchVideos = useCallback(async (pageNum = 0) => {
    try {
      const from = pageNum * PAGE_SIZE
      const to   = from + PAGE_SIZE - 1

      const { data, error: fetchError } = await buildQuery(from, to)
      if (fetchError) throw fetchError

      const newVideos = data ?? []
      if (newVideos.length < PAGE_SIZE) setHasMore(false)

      setVideos(prev => pageNum === 0 ? newVideos : [...prev, ...newVideos])

      if (newVideos.length > 0) {
        const videoIds  = newVideos.map(v => v.id)
        const vendorIds = [...new Set(newVideos.map(v => v.vendor_id))]
        const state     = await getFeedState(videoIds, vendorIds)

        setLiked(prev => ({ ...prev, ...Object.fromEntries(state.likes.map(id => [id, true])) }))
        setSaved(prev => ({ ...prev, ...Object.fromEntries(state.saves.map(id => [id, true])) }))
        setFollowed(prev => ({ ...prev, ...Object.fromEntries(state.follows.map(id => [id, true])) }))
      }

      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('useVideoFeed error:', err)
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  // Initial load — reset on category change
  useEffect(() => {
    setLoading(true)
    setPage(0)
    setHasMore(true)
    setVideos([])
    fetchVideos(0)
  }, [category, country])

  // Realtime subscriptions
  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'product_videos' },
        async (payload) => {
          if (!payload.new.is_active) return
          if (category && category !== 'all' && payload.new.category !== category) return
          let query = supabase.from('product_videos').select(VIDEO_SELECT).eq('id', payload.new.id)
          if (country && country !== 'all') query = query.eq('vendor.business_country', country)
          const { data } = await query.single()
          if (data) setVideos(prev => [data, ...prev])
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'product_videos' },
        (payload) => {
          setVideos(prev => prev.map(v =>
            v.id === payload.new.id
              ? { ...v,
                  likes:          payload.new.likes,
                  views:          payload.new.views,
                  comments_count: payload.new.comments_count,
                  shares_count:   payload.new.shares_count,
                  saves_count:    payload.new.saves_count,
                }
              : v
          ))
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'product_videos' },
        (payload) => setVideos(prev => prev.filter(v => v.id !== payload.old.id))
      )
      .subscribe()

    channelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [category, country])

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return
    const next = page + 1
    setPage(next)
    fetchVideos(next)
  }, [page, hasMore, loading, fetchVideos])

  const refresh = useCallback(() => {
    setPage(0)
    setHasMore(true)
    setLoading(true)
    fetchVideos(0)
  }, [fetchVideos])

  const optimisticLike = useCallback((videoId) => {
    const wasLiked = liked[videoId]
    setLiked(prev => ({ ...prev, [videoId]: !wasLiked }))
    setVideos(prev => prev.map(v =>
      v.id === videoId
        ? { ...v, likes: wasLiked ? Math.max(0, v.likes - 1) : v.likes + 1 }
        : v
    ))
    return wasLiked
  }, [liked])

  const optimisticSave = useCallback((videoId) => {
    const wasSaved = saved[videoId]
    setSaved(prev => ({ ...prev, [videoId]: !wasSaved }))
    setVideos(prev => prev.map(v =>
      v.id === videoId
        ? { ...v, saves_count: wasSaved ? Math.max(0, v.saves_count - 1) : v.saves_count + 1 }
        : v
    ))
    return wasSaved
  }, [saved])

  const optimisticFollow = useCallback((vendorId) => {
    const wasFollowed = followed[vendorId]
    setFollowed(prev => ({ ...prev, [vendorId]: !wasFollowed }))
    return wasFollowed
  }, [followed])

  const incrementCommentCount = useCallback((videoId) => {
    setVideos(prev => prev.map(v =>
      v.id === videoId ? { ...v, comments_count: v.comments_count + 1 } : v
    ))
  }, [])

  return {
    videos, loading, hasMore, error,
    liked, saved, followed,
    loadMore, refresh,
    optimisticLike, optimisticSave, optimisticFollow, incrementCommentCount,
  }
}