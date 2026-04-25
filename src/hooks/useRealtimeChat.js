'use client'
// FILE: src/hooks/useRealtimeChat.js
//
// FIX: 'messages' table does not exist.
// Order-linked chat uses:
//   order_chat_threads  → links order_id to a dm_thread_id
//   dm_messages         → actual messages in that thread
//   dm_thread_reads     → per-user unread count
//
// Usage: pass orderId — the hook resolves the thread automatically.

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient }         from '@/lib/supabase/client'
import { useNotificationStore } from '@/store/notificationStore'

export function useRealtimeChat(initialMessages = [], orderId, currentUserId) {
  const supabase        = createClient()
  const [messages,  setMessages]  = useState(initialMessages)
  const [typing,    setTyping]    = useState(false)
  const [threadId,  setThreadId]  = useState(null)
  const channelRef      = useRef(null)
  const typingTimer     = useRef(null)
  const decrementUnread = useNotificationStore(s => s.decrementUnread)

  const appendMessage = useCallback((msg) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  // ── Resolve thread_id from order_id ────────────────────────────────────────
  // order_chat_threads links an order to its dedicated DM thread
  useEffect(() => {
    if (!orderId) return

    supabase
      .from('order_chat_threads')
      .select('thread_id')
      .eq('order_id', orderId)
      .single()
      .then(({ data }) => {
        if (data?.thread_id) setThreadId(data.thread_id)
      })
  }, [orderId])

  // ── Subscribe once we have the thread_id ────────────────────────────────────
  useEffect(() => {
    if (!threadId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`order-chat:${orderId}`)

      // ── New message ───────────────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'dm_messages',
        filter: `thread_id=eq.${threadId}`,
      }, async (payload) => {
        const msg = payload.new

        // Fetch full message with sender profile
        const { data: fullMsg } = await supabase
          .from('dm_messages')
          .select(`
            id, content, media_url, media_type,
            created_at, read, sender_id,
            sender:users!dm_messages_sender_id_fkey ( id, full_name, avatar_url )
          `)
          .eq('id', msg.id)
          .single()

        if (fullMsg) appendMessage(fullMsg)

        // Message from other party — decrement unread and mark read
        if (msg.sender_id !== currentUserId) {
          decrementUnread()

          // Mark read since user is viewing this thread
          supabase
            .from('dm_messages')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', msg.id)
            .then(() => {})

          // Reset unread count in dm_thread_reads
          supabase
            .from('dm_thread_reads')
            .upsert({
              thread_id:    threadId,
              user_id:      currentUserId,
              unread_count: 0,
              last_read_at: new Date().toISOString(),
            }, { onConflict: 'thread_id,user_id' })
            .then(() => {})
        }
      })

      // ── Typing indicator via Broadcast (ephemeral, never stored) ──────────
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

  // Sync if server-fetched messages change
  useEffect(() => { setMessages(initialMessages) }, [initialMessages])

  // Send typing broadcast
  const sendTyping = useCallback(() => {
    if (!channelRef.current) return
    channelRef.current.send({
      type:    'broadcast',
      event:   'typing',
      payload: { user_id: currentUserId },
    })
  }, [currentUserId])

  // Send a message to this order's thread
  const sendMessage = useCallback(async (content, mediaUrl = null, mediaType = null) => {
    if (!threadId || !currentUserId || !content?.trim()) return null

    const { data, error } = await supabase
      .from('dm_messages')
      .insert({
        thread_id:  threadId,
        sender_id:  currentUserId,
        content:    content.trim(),
        media_url:  mediaUrl  ?? null,
        media_type: mediaType ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[useRealtimeChat] sendMessage:', error)
      return null
    }

    // Update thread's last_message preview
    supabase
      .from('dm_threads')
      .update({
        last_message:    content.trim().slice(0, 100),
        last_message_at: new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      })
      .eq('id', threadId)
      .then(() => {})

    return data
  }, [threadId, currentUserId])

  return { messages, typing, threadId, sendTyping, sendMessage, appendMessage }
}