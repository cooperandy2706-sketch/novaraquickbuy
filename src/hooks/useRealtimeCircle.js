'use client'
// FILE: src/hooks/useRealtimeCircle.js

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Circle list — live unread counts + new circles ────────────────────────────
export function useRealtimeCircleList(initialCircles, vendorId) {
  const supabase   = createClient()
  const [circles, setCircles] = useState(initialCircles ?? [])
  const channelRef = useRef(null)

  useEffect(() => {
    if (!vendorId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`circles-list:${vendorId}`)

      // New message in any circle → bump unread + last_message_at
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'circle_messages',
      }, (payload) => {
        setCircles(prev => prev.map(c =>
          c.id === payload.new.circle_id
            ? {
                ...c,
                last_message_at: payload.new.created_at,
                unread_count:    (c.unread_count ?? 0) + 1,
                message_count:   (c.message_count ?? 0) + 1,
                _lastMessage:    payload.new.content,
              }
            : c
        ).sort((a, b) =>
          new Date(b.last_message_at ?? 0) - new Date(a.last_message_at ?? 0)
        ))
      })

      // Member joined
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'circle_members',
      }, (payload) => {
        setCircles(prev => prev.map(c =>
          c.id === payload.new.circle_id
            ? { ...c, member_count: (c.member_count ?? 0) + 1 }
            : c
        ))
      })

      // Member left
      .on('postgres_changes', {
        event:  'DELETE',
        schema: 'public',
        table:  'circle_members',
      }, (payload) => {
        setCircles(prev => prev.map(c =>
          c.id === payload.old.circle_id
            ? { ...c, member_count: Math.max(0, (c.member_count ?? 1) - 1) }
            : c
        ))
      })

      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  useEffect(() => { if (initialCircles) setCircles(initialCircles) }, [initialCircles])

  const markRead = useCallback((circleId) => {
    setCircles(prev => prev.map(c =>
      c.id === circleId ? { ...c, unread_count: 0 } : c
    ))
  }, [])

  return { circles, markRead }
}

// ── Circle chat room — messages, typing, reactions, pins ──────────────────────
export function useRealtimeCircleChat(initialMessages, circleId, currentUserId) {
  const supabase   = createClient()
  const [messages,    setMessages]    = useState(initialMessages ?? [])
  const [typingUsers, setTypingUsers] = useState([]) // [{ id, name }]
  const [members,     setMembers]     = useState([])
  const [onlineIds,   setOnlineIds]   = useState(new Set())
  const channelRef = useRef(null)
  const typingTimers = useRef({})

  const appendMessage = useCallback((msg) => {
    setMessages(prev =>
      prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
    )
  }, [])

  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  const updateMessage = useCallback((id, patch) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
  }, [])

  useEffect(() => {
    if (!circleId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`circle-chat:${circleId}`, {
        config: { presence: { key: currentUserId } }
      })

      // ── New message ────────────────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'circle_messages',
        filter: `circle_id=eq.${circleId}`,
      }, async (payload) => {
        // Fetch with sender join
        const { data } = await supabase
          .from('circle_messages')
          .select('*, sender:users(id, full_name, avatar_url), reactions(*)')
          .eq('id', payload.new.id)
          .single()
        if (data) appendMessage(data)
      })

      // ── Message deleted ────────────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'DELETE',
        schema: 'public',
        table:  'circle_messages',
        filter: `circle_id=eq.${circleId}`,
      }, (payload) => {
        removeMessage(payload.old.id)
      })

      // ── Message edited / pinned ────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'circle_messages',
        filter: `circle_id=eq.${circleId}`,
      }, (payload) => {
        updateMessage(payload.new.id, payload.new)
      })

      // ── Reaction added/removed ─────────────────────────────────────────────
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'reactions',
      }, async (payload) => {
        const msgId = payload.new?.message_id ?? payload.old?.message_id
        if (!msgId) return
        const { data: reactions } = await supabase
          .from('reactions').select('*').eq('message_id', msgId)
        updateMessage(msgId, { reactions: reactions ?? [] })
      })

      // ── Typing indicator (ephemeral broadcast) ─────────────────────────────
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === currentUserId) return
        setTypingUsers(prev => {
          if (prev.some(u => u.id === payload.user_id)) return prev
          return [...prev, { id: payload.user_id, name: payload.name }]
        })
        // Auto-clear after 3s
        clearTimeout(typingTimers.current[payload.user_id])
        typingTimers.current[payload.user_id] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.id !== payload.user_id))
        }, 3000)
      })

      // ── Presence — who's online ────────────────────────────────────────────
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineIds(new Set(Object.keys(state)))
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineIds(prev => new Set([...prev, key]))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineIds(prev => { const s = new Set(prev); s.delete(key); return s })
      })

      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, online_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel

    return () => {
      Object.values(typingTimers.current).forEach(clearTimeout)
      supabase.removeChannel(channel)
    }
  }, [circleId, currentUserId])

  useEffect(() => { setMessages(initialMessages ?? []) }, [initialMessages])

  const sendTyping = useCallback((name) => {
    channelRef.current?.send({
      type:    'broadcast',
      event:   'typing',
      payload: { user_id: currentUserId, name },
    })
  }, [currentUserId])

  return {
    messages, typingUsers, onlineIds,
    appendMessage, removeMessage, updateMessage,
    sendTyping,
  }
}