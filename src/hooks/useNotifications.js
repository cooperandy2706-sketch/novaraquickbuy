'use client'
// FILE: src/hooks/useNotifications.js

import { useEffect, useCallback, useRef } from 'react'
import { createClient }           from '@/lib/supabase/client'
import { useAuthStore }           from '@/store/authStore'
import { useNotificationStore }   from '@/store/notificationStore'

const PAGE_SIZE = 20

export function useNotifications() {
  const { user }  = useAuthStore()
  const store     = useNotificationStore()
  const supabase  = createClient()
  const initiated = useRef(false)

  // ── Fetch page of notifications ──────────────────────────
  const fetchNotifications = useCallback(async (opts = {}) => {
    if (!user) return
    const { append = false, offset = 0 } = opts

    if (!append) store.setLoading(true)

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    store.setLoading(false)
    if (error || !data) return

    store.setHasMore(data.length === PAGE_SIZE)

    if (append) {
      store.setNotifications([...store.notifications, ...data])
    } else {
      store.setNotifications(data)
    }
  }, [user?.id])

  // ── Load more (pagination) ───────────────────────────────
  const loadMore = useCallback(() => {
    if (!store.hasMore || store.loading) return
    fetchNotifications({ append: true, offset: store.notifications.length })
  }, [store.hasMore, store.loading, store.notifications.length, fetchNotifications])

  // ── Mark specific notifications read ────────────────────
  const markRead = useCallback(async (ids) => {
    if (!user) return
    // Optimistic update
    store.markRead(ids)
    await supabase.rpc('mark_notifications_read', {
      p_user_id: user.id,
      p_ids:     ids,
    })
  }, [user?.id])

  // ── Mark all read ────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!user) return
    store.markAllRead()
    await supabase.rpc('mark_notifications_read', {
      p_user_id: user.id,
      p_ids:     null,
    })
  }, [user?.id])

  // ── Delete a notification ────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    store.removeNotification(id)
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id)
  }, [user?.id])

  // ── Realtime subscription ────────────────────────────────
  useEffect(() => {
    if (!user) return
    if (initiated.current) return
    initiated.current = true

    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          store.prependNotification(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.is_read) {
            store.markRead([payload.new.id])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'DELETE',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          store.removeNotification(payload.old.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      initiated.current = false
    }
  }, [user?.id])

  return {
    notifications:      store.notifications,
    unreadCount:        store.unreadCount,
    loading:            store.loading,
    hasMore:            store.hasMore,
    markRead,
    markAllRead,
    deleteNotification,
    loadMore,
    refetch:            fetchNotifications,
  }
}

// ── Lightweight hook for bell badge only ────────────────────
// Use in CustomerSidebar / CustomerHeader — no full fetch,
// just subscribes to count changes.
export function useUnreadCount() {
  const { user }  = useAuthStore()
  const store     = useNotificationStore()
  const supabase  = createClient()

  useEffect(() => {
    if (!user) return

    // Get initial count
    supabase
      .rpc('get_unread_notification_count', { p_user_id: user.id })
      .then(({ data }) => {
        if (data != null) store.setUnreadCount(data)
      })

    // Realtime: re-fetch count on any insert
    const channel = supabase
      .channel(`notif-count:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        store.setUnreadCount(store.unreadCount + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        supabase
          .rpc('get_unread_notification_count', { p_user_id: user.id })
          .then(({ data }) => { if (data != null) store.setUnreadCount(data) })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  return store.unreadCount
}