'use client'
// FILE: src/hooks/useChat.js
// Rebuilt to use the REAL schema:
//   DMs    → dm_threads + dm_messages + dm_thread_reads
//   Circles → circles + circle_members + circle_messages + reactions + poll_votes
// No longer references the non-existent tables:
//   chat_messages, chat_polls, chat_poll_votes, chat_message_reactions
// No longer calls the non-existent RPCs:
//   get_or_create_dm, mark_chat_read, toggle_message_reaction, vote_poll

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore }  from '@/store/authStore'
import { useChatStore }  from '@/store/chatStore'

function channelKey(type, id) { return `${type}:${id}` }

async function uploadChatMedia(supabase, file, folder = 'images') {
  const ext  = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from('chat-media')
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path)
  return publicUrl
}

// ─────────────────────────────────────────────────────────────
// NORMALIZERS — map real DB columns → MessageBubble shape
// ─────────────────────────────────────────────────────────────

function normalizeDmMessage(msg) {
  let messageType = 'text'
  let metadata    = null
  if (msg.media_url) {
    if      (msg.media_type?.startsWith('video/')) { messageType = 'video'; metadata = { url: msg.media_url } }
    else if (msg.media_type?.startsWith('audio/')) { messageType = 'audio'; metadata = { url: msg.media_url, duration_secs: 0, waveform: [] } }
    else                                           { messageType = 'image'; metadata = { url: msg.media_url, caption: null } }
  }
  return {
    ...msg,
    message_type:    messageType,
    metadata,
    is_pinned:       false,
    reaction_counts: {},
    reactions:       [],
    reply_to:        msg.reply_to
      ? { ...msg.reply_to, message_type: 'text' }
      : null,
  }
}

function normalizeCircleMessage(msg) {
  // Compute reaction_counts from reactions[]
  const reaction_counts = {}
  for (const r of (msg.reactions ?? [])) {
    reaction_counts[r.emoji] = (reaction_counts[r.emoji] ?? 0) + 1
  }

  // Build metadata
  let metadata = null
  const t = msg.type ?? 'text'
  if ((t === 'image' || t === 'gif') && msg.media_url)  metadata = { url: msg.media_url, caption: null }
  else if (t === 'video' && msg.media_url)              metadata = { url: msg.media_url, thumb_url: null, duration_secs: msg.duration_secs ?? 0 }
  else if (t === 'audio' || t === 'voice')              metadata = { url: msg.voice_url ?? msg.media_url, duration_secs: msg.duration_secs ?? 0, waveform: [] }
  else if (t === 'file' && msg.media_url)               metadata = { url: msg.media_url }
  else if (t === 'product' && msg.product)              metadata = { product_id: msg.product_id, name: msg.product.name, price: msg.product.price, image_url: msg.product.thumbnail_url }

  return {
    ...msg,
    message_type:    t,
    metadata,
    is_pinned:       msg.pinned ?? false,
    reaction_counts,
    reactions:       msg.reactions ?? [],
    reply_to:        msg.reply_to
      ? { ...msg.reply_to, message_type: msg.reply_to.type ?? 'text' }
      : null,
    // poll_data stays as-is — PollContent reads it directly
  }
}

// ─────────────────────────────────────────────────────────────
// useMyDms
// ─────────────────────────────────────────────────────────────
export function useMyDms() {
  const [dms,     setDms]     = useState([])
  const [loading, setLoading] = useState(true)
  const { user }  = useAuthStore()
  const supabase  = createClient()
  const store     = useChatStore()

  const fetchDms = useCallback(async () => {
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('dm_threads')
      .select(`
        id, thread_key, last_message, last_message_at,
        participant_a, participant_b,
        reads:dm_thread_reads ( unread_count, user_id )
      `)
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsLast: true })

    if (!error && data) {
      const otherIds = data.map(t =>
        t.participant_a === user.id ? t.participant_b : t.participant_a
      ).filter(Boolean)

      const { data: profiles } = otherIds.length > 0
        ? await supabase.from('users').select('id, full_name, avatar_url').in('id', [...new Set(otherIds)])
        : { data: [] }

      const profileMap = {}
      for (const p of profiles ?? []) profileMap[p.id] = p

      const shaped = data.map(thread => {
        const otherId = thread.participant_a === user.id ? thread.participant_b : thread.participant_a
        const other   = profileMap[otherId] ?? null
        const myRead  = thread.reads?.find(r => r.user_id === user.id)
        return {
          id:                   thread.id,
          conversation_id:      thread.id,        // backwards-compat alias
          my_id:                user.id,
          other_id:             otherId,
          other_name:           other?.full_name  ?? 'Unknown',
          other_avatar:         other?.avatar_url ?? null,
          last_message:         thread.last_message,
          last_message_preview: thread.last_message,  // alias ConversationItem needs
          last_message_at:      thread.last_message_at,
          unread_count:         myRead?.unread_count ?? 0,
        }
      })
      setDms(shaped)
      const total = shaped.reduce((s, d) => s + (d.unread_count ?? 0), 0)
      store.setUnreadTotals(total, useChatStore.getState().totalCircleUnread)
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchDms()
    if (!user) return
    const ch = supabase
      .channel(`my-dms:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, fetchDms)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'dm_thread_reads',
        filter: `user_id=eq.${user.id}`,
      }, fetchDms)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id, fetchDms])

  // startDm — inline thread_key logic (no RPC needed)
  const startDm = useCallback(async (otherUserId) => {
    if (!user) return null
    const threadKey = [user.id, otherUserId].sort().join(':')

    // Check if thread already exists
    const { data: existing } = await supabase
      .from('dm_threads')
      .select('id')
      .eq('thread_key', threadKey)
      .maybeSingle()

    if (existing) { await fetchDms(); return existing.id }

    // Create new thread
    const { data: thread, error } = await supabase
      .from('dm_threads')
      .insert({
        thread_key:    threadKey,
        participant_a: user.id,
        participant_b: otherUserId,
      })
      .select('id')
      .single()

    if (error) { console.error('[startDm]:', error); return null }
    await fetchDms()
    return thread.id
  }, [user?.id, fetchDms])

  return { dms, loading, startDm, refetch: fetchDms }
}

// ─────────────────────────────────────────────────────────────
// useMyCircles
// ─────────────────────────────────────────────────────────────
export function useMyCircles() {
  const [circles, setCircles] = useState([])
  const [loading, setLoading] = useState(true)
  const { user }  = useAuthStore()
  const supabase  = createClient()
  const store     = useChatStore()

  const fetchCircles = useCallback(async () => {
    if (!user) { setLoading(false); return }

    const { data: memberships, error: mErr } = await supabase
      .from('circle_members')
      .select('circle_id, role, last_read_at')
      .eq('user_id', user.id)

    if (mErr || !memberships?.length) {
      setCircles([])
      setLoading(false)
      return
    }

    const circleIds = memberships.map(m => m.circle_id)

    const { data: circleData, error: cErr } = await supabase
      .from('circles')
      .select(`
        id, name, description, cover_url, emoji,
        privacy, member_count, last_message_at,
        is_archived, vendor_id,
        vendor:vendors ( id, store_name, store_logo_url )
      `)
      .in('id', circleIds)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false, nullsLast: true })

    if (!cErr && circleData) {
      const memberMap = {}
      for (const m of memberships) memberMap[m.circle_id] = m

      const shaped = circleData.map(c => ({
        ...c,
        my_role:      memberMap[c.id]?.role ?? 'member',
        last_read_at: memberMap[c.id]?.last_read_at ?? null,
        unread_count: 0,
      }))
      setCircles(shaped)
      store.setUnreadTotals(useChatStore.getState().totalDmUnread, 0)
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchCircles()
    if (!user) return
    const ch = supabase
      .channel(`my-circles:${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'circle_members',
        filter: `user_id=eq.${user.id}`,
      }, fetchCircles)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circles' }, fetchCircles)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id, fetchCircles])

  const joinCircle = useCallback(async (circleId) => {
    if (!user) return false
    const { error } = await supabase
      .from('circle_members')
      .insert({ circle_id: circleId, user_id: user.id, role: 'member' })
    if (!error) fetchCircles()
    return !error
  }, [user?.id, fetchCircles])

  const leaveCircle = useCallback(async (circleId) => {
    if (!user) return
    await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', user.id)
    setCircles(p => p.filter(c => c.id !== circleId))
  }, [user?.id])

  const createCircle = useCallback(async (data) => {
    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authUser) return { error: 'Not authenticated' }

    const { data: vendor, error: vendorErr } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', authUser.id)
      .single()

    if (vendorErr || !vendor) return { error: 'Only vendors can create circles' }

    const { data: circle, error: circleErr } = await supabase
      .from('circles')
      .insert({ ...data, vendor_id: vendor.id, created_by: authUser.id })
      .select('id')
      .single()

    if (circleErr) return { error: circleErr.message }

    if (circle) {
      await supabase.from('circle_members').insert({
        circle_id: circle.id,
        user_id:   authUser.id,
        role:      'owner',
      })
      fetchCircles()
    }

    return { data: circle, error: null }
  }, [fetchCircles])

  return { circles, loading, joinCircle, leaveCircle, createCircle, refetch: fetchCircles }
}

// ─────────────────────────────────────────────────────────────
// usePublicCircles
// ─────────────────────────────────────────────────────────────
export function usePublicCircles(search = '') {
  const [circles, setCircles] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setLoading(true)
    let q = supabase
      .from('circles')
      .select(`id, name, description, cover_url, emoji, member_count, last_message_at, vendor_id, vendor:vendors ( store_name )`)
      .eq('privacy', 'public')
      .eq('is_archived', false)
      .order('member_count', { ascending: false })
      .limit(40)
    if (search) q = q.ilike('name', `%${search}%`)
    q.then(({ data }) => { setCircles(data ?? []); setLoading(false) })
  }, [search])

  return { circles, loading }
}

// ─────────────────────────────────────────────────────────────
// useChatChannel — real tables: dm_messages / circle_messages
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 40

export function useChatChannel({ type, id }) {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)
  const [hasMore,  setHasMore]  = useState(true)
  const [error,    setError]    = useState(null)
  const { user }  = useAuthStore()
  const supabase  = createClient()
  const cKey      = channelKey(type, id)
  const oldestRef = useRef(null)

  const isCircle = type === 'circle'
  const table    = isCircle ? 'circle_messages' : 'dm_messages'
  const idCol    = isCircle ? 'circle_id'       : 'thread_id'
  const normalize = isCircle ? normalizeCircleMessage : normalizeDmMessage

  const DM_SELECT = `
    id, content, media_url, media_type, created_at,
    is_deleted, reply_to_id, sender_id, read, read_at,
    sender:users(id, full_name, avatar_url),
    reply_to:dm_messages(id, content, sender:users(full_name))
  `

  const CIRCLE_SELECT = `
    id, content, type, media_url, media_type, voice_url, duration_secs,
    product_id, poll_data, pinned, pinned_at, created_at, updated_at,
    is_edited, is_deleted, reply_to_id, sender_id,
    sender:users(id, full_name, avatar_url),
    reactions(id, emoji, user_id),
    reply_to:circle_messages(id, content, type, sender:users(full_name)),
    product:products(id, name, price, thumbnail_url)
  `

  const MSG_SELECT = isCircle ? CIRCLE_SELECT : DM_SELECT

  // ── Mark as read ────────────────────────────────────────────
  const markRead = useCallback(async () => {
    if (!user || !id) return
    if (isCircle) {
      await supabase
        .from('circle_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('circle_id', id)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('dm_thread_reads')
        .upsert({
          thread_id:    id,
          user_id:      user.id,
          unread_count: 0,
          last_read_at: new Date().toISOString(),
          updated_at:   new Date().toISOString(),
        }, { onConflict: 'thread_id,user_id' })
    }
  }, [id, type, user?.id])

  // ── Fetch messages ─────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from(table)
      .select(MSG_SELECT)
      .eq(idCol, id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (err) { setError(err.message); setLoading(false); return }
    const msgs = (data ?? []).reverse().map(normalize)
    setMessages(msgs)
    if (msgs.length > 0) oldestRef.current = msgs[0].created_at
    setHasMore((data ?? []).length === PAGE_SIZE)
    setLoading(false)
    markRead()
  }, [id, type, user?.id])

  // ── Load older messages (pagination) ───────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || !oldestRef.current) return
    const { data } = await supabase
      .from(table)
      .select(MSG_SELECT)
      .eq(idCol, id)
      .eq('is_deleted', false)
      .lt('created_at', oldestRef.current)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (data?.length) {
      const older = data.reverse().map(normalize)
      setMessages(p => [...older, ...p])
      oldestRef.current = older[0].created_at
      setHasMore(data.length === PAGE_SIZE)
    } else { setHasMore(false) }
  }, [id, type, hasMore])

  // ── Realtime subscriptions ─────────────────────────────────
  useEffect(() => {
    fetchMessages()
    if (!id) return

    const fetchById = async (msgId) => {
      const { data: fullMsg } = await supabase
        .from(table)
        .select(MSG_SELECT)
        .eq('id', msgId)
        .single()
      if (fullMsg) setMessages(p =>
        p.some(m => m.id === fullMsg.id) ? p : [...p, normalize(fullMsg)]
      )
    }

    const ch = supabase
      .channel(`chat-channel:${cKey}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table,
        filter: `${idCol}=eq.${id}`,
      }, (payload) => fetchById(payload.new.id))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table,
        filter: `${idCol}=eq.${id}`,
      }, (payload) => {
        setMessages(p => p.map(m =>
          m.id === payload.new.id ? normalize({ ...m, ...payload.new }) : m
        ))
      })

    // Reactions (circles only)
    if (isCircle) {
      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' },
        async (payload) => fetchById(payload.new.message_id)
      ).on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reactions' },
        async (payload) => fetchById(payload.old.message_id)
      )
    }

    ch.subscribe()
    return () => supabase.removeChannel(ch)
  }, [id, type])

  // ── Send message ─────────────────────────────────────────
  const sendMessage = useCallback(async ({
    content, messageType = 'text', metadata = null, replyToId = null, file = null,
  }) => {
    if (!user || (!content?.trim() && !file && !metadata)) return null
    setSending(true); setError(null)
    try {
      const finalContent = content?.trim() ?? null

      if (isCircle) {
        let msgType      = messageType
        let mediaUrl     = null
        let mediaType    = null
        let voiceUrl     = null
        let durationSecs = null
        if (file) {
          const isV = file.type.startsWith('video/')
          const isA = file.type.startsWith('audio/')
          mediaUrl  = await uploadChatMedia(supabase, file, isV ? 'videos' : isA ? 'audio' : 'images')
          mediaType = file.type
          if (isV)      msgType = 'video'
          else if (isA) { msgType = 'audio'; voiceUrl = mediaUrl; mediaUrl = null; durationSecs = 0 }
          else          msgType = 'image'
        }
        const { data: msg, error: err } = await supabase
          .from('circle_messages')
          .insert({
            circle_id:    id,
            sender_id:    user.id,
            content:      finalContent,
            type:         msgType,
            media_url:    mediaUrl,
            media_type:   mediaType,
            voice_url:    voiceUrl,
            duration_secs: durationSecs,
            reply_to_id:  replyToId ?? null,
          })
          .select('id').single()
        if (err) throw err
        // Update circle timestamps
        await supabase.from('circles')
          .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', id)
        
        // Instantly append to local UI
        const { data: fullMsg } = await supabase.from('circle_messages').select(MSG_SELECT).eq('id', msg.id).single()
        if (fullMsg) {
          setMessages(prev => prev.some(m => m.id === fullMsg.id) ? prev : [...prev, normalize(fullMsg)])
        }
        
        return msg

      } else {
        // DM
        let mediaUrl  = null
        let mediaType = null
        if (file) {
          const isV = file.type.startsWith('video/')
          const isA = file.type.startsWith('audio/')
          mediaUrl  = await uploadChatMedia(supabase, file, isV ? 'videos' : isA ? 'audio' : 'images')
          mediaType = file.type
        }
        const { data: msg, error: err } = await supabase
          .from('dm_messages')
          .insert({
            thread_id:   id,
            sender_id:   user.id,
            content:     finalContent,
            media_url:   mediaUrl,
            media_type:  mediaType,
            reply_to_id: replyToId ?? null,
            read:        false,
          })
          .select('id').single()
        if (err) throw err
        // Update thread preview
        const preview = finalContent?.slice(0, 80) ?? (mediaUrl ? 'Sent a file' : 'New message')
        await supabase.from('dm_threads')
          .update({ last_message: preview, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', id)
        
        // Instantly append to local UI
        const { data: fullMsg } = await supabase.from('dm_messages').select(MSG_SELECT).eq('id', msg.id).single()
        if (fullMsg) {
          setMessages(prev => prev.some(m => m.id === fullMsg.id) ? prev : [...prev, normalize(fullMsg)])
        }
        
        return msg
      }
    } catch (err) {
      console.error('[useChatChannel] sendMessage:', err)
      setError(err.message)
      return null
    } finally { setSending(false) }
  }, [user?.id, id, type])

  // ── Send poll (circle only — stored in poll_data jsonb) ────
  const sendPoll = useCallback(async ({ question, options, isAnonymous, isMultiple, expiresAt }) => {
    if (!user || !isCircle) return null
    setSending(true)
    try {
      const pollData = {
        question,
        options:      options.map((text, idx) => ({ id: `opt_${idx}_${Date.now()}`, text, vote_count: 0 })),
        is_anonymous: isAnonymous ?? false,
        is_multiple:  isMultiple  ?? false,
        expires_at:   expiresAt   ?? null,
      }
      const { data: msg, error: err } = await supabase
        .from('circle_messages')
        .insert({ circle_id: id, sender_id: user.id, content: question, type: 'poll', poll_data: pollData })
        .select('id').single()
      if (err) throw err
      await supabase.from('circles')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', id)
      return msg
    } catch (err) { setError(err.message); return null }
    finally { setSending(false) }
  }, [user?.id, id, type])

  // ── React to message (circles only — reactions table) ─────
  const reactToMessage = useCallback(async (messageId, emoji) => {
    if (!user || !isCircle) return
    // Toggle: remove if exists, add if not
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle()
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions')
        .insert({ message_id: messageId, user_id: user.id, emoji })
    }
  }, [user?.id])

  // ── Edit message ──────────────────────────────────────────
  const editMessage = useCallback(async (messageId, newContent) => {
    if (isCircle) {
      await supabase
        .from('circle_messages')
        .update({ content: newContent, is_edited: true, edited_at: new Date().toISOString() })
        .eq('id', messageId).eq('sender_id', user?.id)
    } else {
      await supabase
        .from('dm_messages')
        .update({ content: newContent })
        .eq('id', messageId).eq('sender_id', user?.id)
    }
  }, [user?.id])

  // ── Delete message ────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId) => {
    if (isCircle) {
      await supabase
        .from('circle_messages')
        .update({ is_deleted: true, content: null })
        .eq('id', messageId).eq('sender_id', user?.id)
    } else {
      await supabase
        .from('dm_messages')
        .update({ is_deleted: true })
        .eq('id', messageId).eq('sender_id', user?.id)
    }
    setMessages(p => p.map(m =>
      m.id === messageId ? { ...m, is_deleted: true, content: null } : m
    ))
  }, [user?.id])

  return {
    messages, loading, sending, hasMore, error,
    sendMessage, sendPoll, reactToMessage,
    editMessage, deleteMessage, loadMore,
    refetch: fetchMessages,
  }
}

// ─────────────────────────────────────────────────────────────
// useTypingIndicator — uses Supabase Presence (no DB table)
// ─────────────────────────────────────────────────────────────
export function useTypingIndicator({ type, id }) {
  const { user }   = useAuthStore()
  const supabase   = createClient()
  const store      = useChatStore()
  const cKey       = channelKey(type, id)
  const channelRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!id || !user) return
    const ch = supabase.channel(`typing:${cKey}`)
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      Object.keys(store.typingUsers[cKey] ?? {}).forEach(uid => {
        if (uid !== user.id) store.clearTyping(cKey, uid)
      })
      Object.values(state).flat().forEach(p => {
        if (p.user_id && p.user_id !== user.id && p.typing) {
          store.setTyping(cKey, p.user_id, p.name ?? 'Someone')
        }
      })
    })
    .subscribe(async status => { if (status === 'SUBSCRIBED') channelRef.current = ch })
    return () => { supabase.removeChannel(ch); channelRef.current = null }
  }, [id, type, user?.id])

  const startTyping = useCallback(() => {
    if (!channelRef.current || !user) return
    channelRef.current.track({
      user_id: user.id,
      name:    user.user_metadata?.full_name ?? 'Someone',
      typing:  true,
    })
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(stopTyping, 3000)
  }, [user?.id])

  const stopTyping = useCallback(() => {
    if (!channelRef.current) return
    channelRef.current.track({ user_id: user?.id, typing: false })
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [user?.id])

  const typingList = Object.values(store.typingUsers[cKey] ?? {})
    .filter(t => Date.now() - t.ts < 5000)
    .map(t => t.name)

  return { startTyping, stopTyping, typingList }
}

// ─────────────────────────────────────────────────────────────
// usePoll — reads poll_data from message, votes from poll_votes
// ─────────────────────────────────────────────────────────────
export function usePoll(messageId, pollData) {
  const [myVotes,  setMyVotes]  = useState([])
  const [allVotes, setAllVotes] = useState([])
  const [loading,  setLoading]  = useState(false)
  const { user }  = useAuthStore()
  const supabase  = createClient()

  useEffect(() => {
    if (!user || !messageId) return
    // Fetch user's own votes
    supabase
      .from('poll_votes')
      .select('option_ids')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setMyVotes(data.option_ids ?? []) })
    // Fetch all votes to compute counts
    supabase
      .from('poll_votes')
      .select('user_id, option_ids')
      .eq('message_id', messageId)
      .then(({ data }) => { setAllVotes(data ?? []) })
  }, [messageId, user?.id])

  const vote = useCallback(async (optionIds) => {
    if (!user) return null
    setLoading(true)
    const { error } = await supabase
      .from('poll_votes')
      .upsert({ message_id: messageId, user_id: user.id, option_ids: optionIds },
               { onConflict: 'message_id,user_id' })
    setLoading(false)
    if (!error) {
      setMyVotes(optionIds)
      setAllVotes(prev => {
        const without = prev.filter(v => v.user_id !== user.id)
        return [...without, { user_id: user.id, option_ids: optionIds }]
      })
    }
    return { success: !error }
  }, [user?.id, messageId])

  // Compute vote counts from allVotes
  const computedCounts = {}
  for (const v of allVotes) {
    for (const optId of (v.option_ids ?? [])) {
      computedCounts[optId] = (computedCounts[optId] ?? 0) + 1
    }
  }

  // Enrich options with live vote_count
  const enrichedPollData = pollData
    ? {
        ...pollData,
        options: (pollData.options ?? []).map(opt => ({
          ...opt,
          vote_count: computedCounts[opt.id] ?? opt.vote_count ?? 0,
        })),
      }
    : null

  return {
    myVotes,
    loading,
    vote,
    hasVoted:  myVotes.length > 0,
    pollData:  enrichedPollData,
    totalVotes: allVotes.length,
  }
}