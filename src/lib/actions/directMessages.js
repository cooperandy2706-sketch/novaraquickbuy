'use server'
// FILE: src/lib/actions/directMessages.js

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Get or create a DM thread between vendor and a user ─────────────────────
// thread_key = sorted pair of user IDs joined with ':' ensures uniqueness
export async function getOrCreateDMThread(otherUserId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const threadKey = [user.id, otherUserId].sort().join(':')

  // Check if thread exists
  const { data: existing } = await supabase
    .from('dm_threads')
    .select('id, participant_a, participant_b, created_at')
    .eq('thread_key', threadKey)
    .maybeSingle()

  if (existing) return { thread: existing }

  // Create new thread
  const { data: thread, error } = await supabase
    .from('dm_threads')
    .insert({
      thread_key:    threadKey,
      participant_a: user.id,
      participant_b: otherUserId,
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    })
    .select().single()

  if (error) return { error: error.message }
  return { thread, isNew: true }
}

// ─── Get DM messages for a thread ────────────────────────────────────────────
export async function getDMMessages(threadId, page = 0, limit = 50) {
  const supabase = await createClient()
  const from = page * limit
  const to   = from + limit - 1

  const { data, error } = await supabase
    .from('dm_messages')
    .select('*, sender:users!dm_messages_sender_id_fkey(id, full_name, avatar_url)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return []
  return (data ?? []).reverse()
}

import { NotificationService } from '@/lib/services/notifications'

// ─── Send a DM ────────────────────────────────────────────────────────────────
export async function sendDM(threadId, content, mediaUrl = null, mediaType = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!content?.trim() && !mediaUrl) return { error: 'Message cannot be empty' }

  // Get thread to find recipient
  const { data: thread } = await supabase
    .from('dm_threads')
    .select('participant_a, participant_b')
    .eq('id', threadId)
    .single()

  const { data, error } = await supabase
    .from('dm_messages')
    .insert({
      thread_id:  threadId,
      sender_id:  user.id,
      content:    content?.trim() || null,
      media_url:  mediaUrl  || null,
      media_type: mediaType || null,
      read:       false,
      created_at: new Date().toISOString(),
    })
    .select('*, sender:users!dm_messages_sender_id_fkey(id, full_name, avatar_url)')
    .single()

  if (error) return { error: error.message }

  // Update thread last_message_at
  await supabase
    .from('dm_threads')
    .update({ updated_at: new Date().toISOString(), last_message: content?.trim()?.slice(0, 80) })
    .eq('id', threadId)

  // Notify recipient
  if (thread) {
    const recipientId = thread.participant_a === user.id ? thread.participant_b : thread.participant_a
    const snippet = content?.trim() || (mediaUrl ? `Sent a ${mediaType || 'file'}` : 'New message')
    
    // Fire and forget notification
    NotificationService.notifyNewMessage(recipientId, data.sender.full_name, snippet, threadId)
      .catch(err => console.error('DM Notification Error:', err))
  }

  return { data }
}

// ─── Get unread DM count for vendor ──────────────────────────────────────────
export async function getDMUnreadCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('dm_messages')
    .select('id', { count: 'exact', head: true })
    .neq('sender_id', user.id)
    .eq('read', false)

  return count ?? 0
}

// ─── Mark thread messages as read ────────────────────────────────────────────
export async function markDMRead(threadId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('dm_messages')
    .update({ read: true })
    .eq('thread_id', threadId)
    .neq('sender_id', user.id)
    .eq('read', false)
}

// ─── Get other user's profile for DM header ──────────────────────────────────
export async function getUserProfile(userId) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, email')
    .eq('id', userId)
    .single()
  return data
}

// ─── Get all DM threads for vendor ────────────────────────────────────────────
export async function getDMThreads() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('dm_threads')
    .select(`
      id, thread_key, last_message, updated_at, created_at,
      participant_a, participant_b,
      participant_a_profile:users!dm_threads_participant_a_fkey (
        id, full_name, avatar_url, email
      ),
      participant_b_profile:users!dm_threads_participant_b_fkey (
        id, full_name, avatar_url, email
      )
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  if (error) return []

  // Attach unread count per thread
  const threadIds = (data ?? []).map(t => t.id)
  if (!threadIds.length) return []

  const { data: unreadRows } = await supabase
    .from('dm_messages')
    .select('thread_id')
    .in('thread_id', threadIds)
    .neq('sender_id', user.id)
    .eq('read', false)

  const unreadMap = (unreadRows ?? []).reduce((acc, r) => {
    acc[r.thread_id] = (acc[r.thread_id] ?? 0) + 1
    return acc
  }, {})

  return (data ?? []).map(t => ({
    ...t,
    unread: unreadMap[t.id] ?? 0,
    // Resolve "other" participant relative to current user
    other: t.participant_a === user.id
      ? t.participant_b_profile
      : t.participant_a_profile,
  }))
}

// ─── Delete / archive a thread ────────────────────────────────────────────────
export async function deleteDMThread(threadId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('dm_threads')
    .delete()
    .eq('id', threadId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)

  if (error) return { error: error.message }
  revalidatePath('/vendor/chat')
  return { success: true }
}

// ─── Search DM threads ────────────────────────────────────────────────────────
export async function searchDMThreads(query) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Search by participant name
  const { data } = await supabase
    .from('dm_threads')
    .select(`
      id, thread_key, last_message, updated_at,
      participant_a, participant_b,
      participant_a_profile:users!dm_threads_participant_a_fkey (id, full_name, avatar_url),
      participant_b_profile:users!dm_threads_participant_b_fkey (id, full_name, avatar_url)
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  return (data ?? [])
    .map(t => ({
      ...t,
      other: t.participant_a === user.id ? t.participant_b_profile : t.participant_a_profile,
    }))
    .filter(t =>
      t.other?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      t.last_message?.toLowerCase().includes(query.toLowerCase())
    )
}

// ─── Delete a single DM message ───────────────────────────────────────────────
export async function deleteDMMessage(messageId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('dm_messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}