'use client'
// FILE: src/hooks/useRealtimeVideos.js
//
// Patches video stats (views, likes, comments_count, shares_count, saves_count)
// live on the vendor videos list as buyer interactions happen.

import { useState, useEffect, useRef } from 'react'
import { createClient }                from '@/lib/supabase/client'

export function useRealtimeVideos(initialData, vendorId) {
  const supabase   = createClient()
  const [data, setData] = useState(initialData)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!vendorId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`vendor-videos:${vendorId}`)

      // Video stats updated (views, likes, comments, shares, saves)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'product_videos',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        setData(prev => {
          if (!prev) return prev
          const videos = prev.videos.map(v =>
            v.id === payload.new.id
              ? {
                  ...v,
                  views:          payload.new.views,
                  likes:          payload.new.likes,
                  comments_count: payload.new.comments_count,
                  shares_count:   payload.new.shares_count,
                  saves_count:    payload.new.saves_count,
                  status:         payload.new.status,
                  is_active:      payload.new.is_active,
                }
              : v
          )
          return { ...prev, videos }
        })
      })

      // New video published by another session (e.g. scheduled)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'product_videos',
        filter: `vendor_id=eq.${vendorId}`,
      }, async (payload) => {
        // Fetch full video with tags
        const { data: newVideo } = await supabase
          .from('product_videos')
          .select(`
            id, title, description, status, thumbnail_url, video_url,
            views, likes, comments_count, shares_count, saves_count,
            duration_seconds, scheduled_at, created_at, updated_at,
            video_tags (
              id, position_x, position_y,
              product:products ( id, name, price, thumbnail_url )
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (newVideo) {
          setData(prev => {
            if (!prev) return prev
            // Avoid duplicates
            if (prev.videos.some(v => v.id === newVideo.id)) return prev
            return {
              ...prev,
              videos: [newVideo, ...prev.videos],
              total:  prev.total + 1,
            }
          })
        }
      })

      // Video deleted
      .on('postgres_changes', {
        event:  'DELETE',
        schema: 'public',
        table:  'product_videos',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        setData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            videos: prev.videos.filter(v => v.id !== payload.old.id),
            total:  Math.max(0, prev.total - 1),
          }
        })
      })

      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  // Sync when server data changes (filter/search)
  useEffect(() => {
    if (initialData) setData(initialData)
  }, [initialData])

  return data
}

// ── Single video detail — live stats + comments ────────────────────────────────
export function useRealtimeVideoDetail(initialVideo, videoId) {
  const supabase   = createClient()
  const [video, setVideo] = useState(initialVideo)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!videoId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`video-detail:${videoId}`)

      // Stats update
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'product_videos',
        filter: `id=eq.${videoId}`,
      }, (payload) => {
        setVideo(prev => prev ? {
          ...prev,
          views:          payload.new.views,
          likes:          payload.new.likes,
          comments_count: payload.new.comments_count,
          shares_count:   payload.new.shares_count,
          saves_count:    payload.new.saves_count,
          status:         payload.new.status,
          is_active:      payload.new.is_active,
        } : prev)
      })

      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [videoId])

  useEffect(() => {
    if (initialVideo) setVideo(initialVideo)
  }, [initialVideo])

  return { video, setVideo }
}