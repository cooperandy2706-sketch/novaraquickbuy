'use client'
// FILE: src/hooks/useRealtimeDM.js

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient }          from '@/lib/supabase/client'
import { useNotificationStore }  from '@/store/notificationStore'

// ── Thread list — live unread badges + new threads ────────────────────────────
export function useRealtimeDMList(initialThreads, currentUserId) {
  const supabase   = createClient()
  const [threads, setThreads] = useState(initialThreads ?? [])
  const channelRef = useRef(null)
  const incrementUnread = useNotificationStore(s => s.incrementUnread)

  useEffect(() => {
    if (!currentUserId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`dm-list:${currentUserId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'dm_messages',
      }, async (payload) => {
        const msg = payload.new
        // Update thread's last_message + bump unread if not from self
        setThreads(prev => prev.map(t => {
          if (t.id !== msg.thread_id) return t
          const isOtherSender = msg.sender_id !== currentUserId
          if (isOtherSender) incrementUnread()
          return {
            ...t,
            last_message: msg.content?.slice(0, 80) ?? '',
            updated_at:   msg.created_at,
            unread:       isOtherSender ? (t.unread ?? 0) + 1 : (t.unread ?? 0),
          }
        }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
      })
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'dm_threads',
      }, async (payload) => {
        // New thread — fetch full thread with profiles
        const { data } = await supabase
          .from('dm_threads')
          .select(`
            id, thread_key, last_message, updated_at, created_at,
            participant_a, participant_b,
            participant_a_profile:users!dm_threads_participant_a_fkey (id, full_name, avatar_url, email),
            participant_b_profile:users!dm_threads_participant_b_fkey (id, full_name, avatar_url, email)
          `)
          .eq('id', payload.new.id)
          .single()

        if (data) {
          const enriched = {
            ...data,
            unread: 0,
            other: data.participant_a === currentUserId
              ? data.participant_b_profile
              : data.participant_a_profile,
          }
          setThreads(prev =>
            prev.some(t => t.id === enriched.id) ? prev : [enriched, ...prev]
          )
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  useEffect(() => { if (initialThreads) setThreads(initialThreads) }, [initialThreads])

  const clearUnread = useCallback((threadId) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unread: 0 } : t))
  }, [])

  return { threads, clearUnread }
}

// ── Single thread messages — live chat ────────────────────────────────────────
export function useRealtimeDM(initialMessages, threadId, currentUserId) {
  const supabase    = createClient()
  const [messages,  setMessages]  = useState(initialMessages ?? [])
  const [typing,    setTyping]    = useState(false)
  const channelRef  = useRef(null)
  const typingTimer = useRef(null)

  const append = useCallback((msg) => {
    setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
  }, [])

  const remove = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  useEffect(() => {
    if (!threadId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`dm:${threadId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'dm_messages',
        filter: `thread_id=eq.${threadId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('dm_messages')
          .select('*, sender:users!dm_messages_sender_id_fkey(id, full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          append(data)
          // Mark as read instantly if it's from the other person
          if (data.sender_id !== currentUserId) {
            await supabase
              .from('dm_messages')
              .update({ read: true })
              .eq('id', data.id)
          }
        }
      })
      .on('postgres_changes', {
        event:  'DELETE',
        schema: 'public',
        table:  'dm_messages',
        filter: `thread_id=eq.${threadId}`,
      }, (payload) => {
        remove(payload.old.id)
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === currentUserId) return
        setTyping(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTyping(false), 3000)
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      clearTimeout(typingTimer.current)
    }
  }, [threadId, currentUserId])

  useEffect(() => { if (initialMessages) setMessages(initialMessages) }, [initialMessages])

  const sendTyping = useCallback(() => {
    channelRef.current?.send({
      type:    'broadcast',
      event:   'typing',
      payload: { user_id: currentUserId },
    })
  }, [currentUserId])

  return { messages, typing, append, remove, sendTyping }
}