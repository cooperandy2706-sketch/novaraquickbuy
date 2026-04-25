'use server'
// FILE: src/lib/actions/feed.js

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Toggle like ──────────────────────────────────────────────────────────────
export async function toggleLike(videoId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('video_likes')
    .select('id')
    .eq('video_id', videoId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('video_likes').delete().eq('id', existing.id)
    return { liked: false }
  }

  await supabase.from('video_likes').insert({ video_id: videoId, user_id: user.id })
  return { liked: true }
}

// ─── Toggle save ──────────────────────────────────────────────────────────────
export async function toggleSave(videoId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('video_saves')
    .select('id')
    .eq('video_id', videoId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('video_saves').delete().eq('id', existing.id)
    return { saved: false }
  }

  await supabase.from('video_saves').insert({ video_id: videoId, user_id: user.id })
  return { saved: true }
}

// ─── Toggle follow ────────────────────────────────────────────────────────────
export async function toggleFollow(vendorId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('vendor_follows')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('follower_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('vendor_follows').delete().eq('id', existing.id)
    return { following: false }
  }

  await supabase.from('vendor_follows').insert({ vendor_id: vendorId, follower_id: user.id })
  return { following: true }
}

// ─── Post comment ─────────────────────────────────────────────────────────────
export async function postComment(videoId, content, replyToId = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!content?.trim()) return { error: 'Comment cannot be empty' }
  if (content.length > 500) return { error: 'Comment too long (max 500 characters)' }

  const { data: newComment, error } = await supabase
    .from('video_comments')
    .insert({
      video_id:    videoId,
      user_id:     user.id,
      content:     content.trim(),
      reply_to_id: replyToId ?? null,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  
  // Get user info
  const { data: userData } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('id', user.id)
    .single()
  
  return { 
    comment: {
      ...newComment,
      user: userData ?? { id: user.id, full_name: user.user_metadata?.full_name ?? 'Anonymous', avatar_url: null }
    } 
  }
}

// ─── Delete comment ───────────────────────────────────────────────────────────
export async function deleteComment(commentId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('video_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)  // Only own comments

  if (error) return { error: error.message }
  return { success: true }
}

// ─── Get comments (paginated, top-level only) ─────────────────────────────────
export async function getComments(videoId, page = 0) {
  const supabase = await createClient()
  const from = page * 20
  const to   = from + 19

  // Use RPC function or view to avoid schema cache relationship issue
  const { data: comments, error: commentsError } = await supabase
    .from('video_comments')
    .select('id, video_id, user_id, content, reply_to_id, likes, is_pinned, is_hidden, created_at, updated_at')
    .eq('video_id', videoId)
    .eq('is_hidden', false)
    .is('reply_to_id', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (commentsError) return { error: commentsError.message }
  
  // Fetch users separately
  const userIds = (comments ?? []).map(c => c.user_id).filter(Boolean)
  let users = []
  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds)
    users = usersData ?? []
  }
  
  // Merge user data with comments
  const commentsWithUser = (comments ?? []).map(c => ({
    ...c,
    user: users.find(u => u.id === c.user_id) ?? { id: c.user_id, full_name: 'Anonymous', avatar_url: null }
  }))
  
  return { comments: commentsWithUser }
}

// ─── Get replies for a comment ────────────────────────────────────────────────
export async function getReplies(commentId) {
  const supabase = await createClient()

  const { data: replies, error: repliesError } = await supabase
    .from('video_comments')
    .select('id, video_id, user_id, content, reply_to_id, likes, is_pinned, is_hidden, created_at, updated_at')
    .eq('reply_to_id', commentId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true })

  if (repliesError) return { error: repliesError.message }
  
  // Fetch users separately
  const userIds = (replies ?? []).map(r => r.user_id).filter(Boolean)
  let users = []
  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds)
    users = usersData ?? []
  }
  
  // Merge user data
  const repliesWithUser = (replies ?? []).map(r => ({
    ...r,
    user: users.find(u => u.id === r.user_id) ?? { id: r.user_id, full_name: 'Anonymous', avatar_url: null }
  }))
  
  return { replies: repliesWithUser }
}

// ─── Toggle comment like ──────────────────────────────────────────────────────
export async function toggleCommentLike(commentId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('comment_likes').delete().eq('id', existing.id)
    return { liked: false }
  }

  await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
  return { liked: true }
}

// ─── Get current user's feed state for a batch of videos ─────────────────────
// (which ones they've liked/saved, which vendors they follow)
export async function getFeedState(videoIds, vendorIds) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { likes: [], saves: [], follows: [] }

  const [likesRes, savesRes, followsRes] = await Promise.all([
    supabase
      .from('video_likes')
      .select('video_id')
      .eq('user_id', user.id)
      .in('video_id', videoIds),
    supabase
      .from('video_saves')
      .select('video_id')
      .eq('user_id', user.id)
      .in('video_id', videoIds),
    supabase
      .from('vendor_follows')
      .select('vendor_id')
      .eq('follower_id', user.id)
      .in('vendor_id', vendorIds),
  ])

  return {
    likes:   (likesRes.data   ?? []).map(r => r.video_id),
    saves:   (savesRes.data   ?? []).map(r => r.video_id),
    follows: (followsRes.data ?? []).map(r => r.vendor_id),
  }
}

// ─── Record a view (deduped per user per day in DB) ──────────────────────────
export async function incrementView(videoId, watchedPct = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.rpc('record_video_view', {
    p_video_id:    videoId,
    p_user_id:     user?.id ?? null,
    p_watched_pct: watchedPct,
  })
}

// ─── Record a share ───────────────────────────────────────────────────────────
export async function incrementShare(videoId) {
  const supabase = await createClient()
  await supabase.rpc('increment_video_shares', { p_video_id: videoId })
}

// ─── Get user notifications ───────────────────────────────────────────────────
export async function getNotifications(limit = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ─── Mark all notifications read ─────────────────────────────────────────────
export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.rpc('mark_notifications_read', { p_user_id: user.id })
}

// ─── Get saved videos for current user ───────────────────────────────────────
export async function getSavedVideos(page = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const from = page * 12
  const to   = from + 11

  const { data } = await supabase
    .from('video_saves')
    .select(`
      created_at,
      video:product_videos (
        id, title, thumbnail_url, views, likes,
        duration_seconds, created_at,
        vendor:vendors ( id, store_name, store_handle, store_logo_url )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  return (data ?? []).map(r => r.video).filter(Boolean)
}