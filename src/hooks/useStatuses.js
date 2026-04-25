'use client'
// FILE: src/hooks/useStatuses.js

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

/**
 * useStatuses - Global hook for fetching active vendor statuses
 * for the current user (seen/unseen logic included).
 */
export function useStatuses() {
  const [statuses, setStatuses] = useState([])
  const [loading,  setLoading]  = useState(true)
  const { user }   = useAuthStore()
  const supabase   = createClient()

  const fetchStatuses = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    // 1. Get vendors the user follows
    const { data: follows } = await supabase
      .from('vendor_follows')
      .select('vendor_id')
      .eq('follower_id', user.id)

    const followedVendorIds = (follows ?? []).map(f => f.vendor_id)
    
    // 2. Fetch active statuses (not expired)
    // We fetch statuses from FOLLOWED vendors, or optionally a global pool if follows is empty?
    // User requested "view vendors statuses" plural. Let's fetch all active ones for now
    // but prioritize those from followed vendors if we want, or just all.
    // Given it's a social discovery app, seeing all active vendor statuses is good.
    const { data: statusData, error } = await supabase
      .from('vendor_statuses')
      .select(`
        *,
        vendor:vendors ( id, store_name, logo_url, store_handle ),
        views:status_views ( user_id ),
        likes:status_likes ( user_id )
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[useStatuses]:', error.message)
      setLoading(false)
      return
    }

    if (statusData) {
      const shaped = statusData.map(s => ({
        ...s,
        seen:  s.views?.some(v => v.user_id === user.id) ?? false,
        liked: s.likes?.some(l => l.user_id === user.id) ?? false,
        like_count: s.likes?.length ?? 0,
        view_count: s.views?.length ?? 0
      }))
      setStatuses(shaped)
    }
    setLoading(false)
  }, [user?.id, supabase])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  const viewStatus = async (statusId) => {
    if (!user) return
    try {
      await supabase
        .from('status_views')
        .upsert({ status_id: statusId, user_id: user.id }, { onConflict: 'status_id,user_id' })
      
      // Optimistic update local state
      setStatuses(prev => prev.map(s => s.id === statusId ? { ...s, seen: true } : s))
    } catch (e) {
      console.error('[viewStatus]:', e)
    }
  }

  const toggleLike = async (statusId) => {
    if (!user) return null
    const status = statuses.find(s => s.id === statusId)
    if (!status) return null

    const wasLiked = status.liked
    try {
      if (wasLiked) {
        await supabase.from('status_likes').delete().eq('status_id', statusId).eq('user_id', user.id)
      } else {
        await supabase.from('status_likes').insert({ status_id: statusId, user_id: user.id })
      }
      
      // Optimistic update
      setStatuses(prev => prev.map(s => 
        s.id === statusId 
          ? { ...s, liked: !wasLiked, like_count: s.like_count + (wasLiked ? -1 : 1) } 
          : s
      ))
      return !wasLiked
    } catch (e) {
      console.error('[toggleLike]:', e)
      return wasLiked
    }
  }

  const postComment = async (statusId, content) => {
    if (!user || !content.trim()) return { error: 'Empty content' }
    try {
      const { data, error } = await supabase
        .from('status_comments')
        .insert({ status_id: statusId, user_id: user.id, content: content.trim() })
        .select()
        .single()
      return { data, error }
    } catch (e) {
      return { error: e.message }
    }
  }

  const getStatusViewers = async (statusId) => {
    try {
      const { data, error } = await supabase
        .from('status_views')
        .select(`
          viewed_at,
          user:users ( id, full_name, avatar_url )
        `)
        .eq('status_id', statusId)
        .order('viewed_at', { ascending: false })
      
      return { data, error }
    } catch (e) {
      return { error: e.message }
    }
  }

  return { 
    statuses, 
    loading, 
    viewStatus, 
    toggleLike, 
    postComment, 
    getStatusViewers,
    refetch: fetchStatuses 
  }
}

/**
 * useMyStatuses - For vendors to manage their own statuses
 */
export function useMyStatuses() {
  const [myStatuses, setMyStatuses] = useState([])
  const [loading,    setLoading]    = useState(true)
  const { user }     = useAuthStore()
  const supabase     = createClient()

  const fetchMyStatuses = useCallback(async () => {
    if (!user) return
    
    // Get vendor ID first
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (!vendor) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('vendor_statuses')
      .select('*')
      .eq('vendor_id', vendor.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMyStatuses(data)
    }
    setLoading(false)
  }, [user?.id, supabase])

  useEffect(() => {
    fetchMyStatuses()
  }, [fetchMyStatuses])

  return { myStatuses, loading, refetch: fetchMyStatuses }
}
