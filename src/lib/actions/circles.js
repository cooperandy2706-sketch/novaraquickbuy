'use server'

import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Get all circles for vendor ───────────────────────────────────────────────
export async function getCircles() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return null

  const { data, error } = await supabase
    .from('circles')
    .select(`
      id, name, description, type, cover_url, emoji,
      member_count, message_count, created_at, updated_at,
      last_message_at, is_active,
      circle_members ( count )
    `)
    .eq('vendor_id', vendor.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) return null

  // Unread counts per circle
  const unreadResult = await Promise.all(
    (data ?? []).map(c =>
      supabase.from('circle_messages')
        .select('id', { count: 'exact', head: true })
        .eq('circle_id', c.id)
        .eq('read_by_vendor', false)
    )
  )

  return (data ?? []).map((c, i) => ({
    ...c,
    member_count:  c.circle_members?.[0]?.count ?? 0,
    unread_count:  unreadResult[i]?.count ?? 0,
  }))
}

// ─── Get single circle with full data ────────────────────────────────────────
export async function getCircle(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors').select('id, store_name, store_logo_url').eq('user_id', user.id).single()
  if (!vendor) return null

  const { data, error } = await supabase
    .from('circles')
    .select(`
      *,
      circle_members (
        id, role, joined_at, muted,
        member:users ( id, full_name, avatar_url, email )
      )
    `)
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .single()

  if (error) return null
  return { circle: data, vendor }
}

// ─── Get circle messages (paginated) ─────────────────────────────────────────
export async function getCircleMessages(circleId, page = 0, limit = 50) {
  const supabase = await createClient()
  const from = page * limit
  const to   = from + limit - 1

  const { data, error } = await supabase
    .from('circle_messages')
    .select(`
      id, content, type, media_url, media_type,
      created_at, edited_at, pinned, pinned_at,
      sender:users ( id, full_name, avatar_url ),
      reactions ( emoji, user_id )
    `)
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return []
  return (data ?? []).reverse() // oldest first for chat display
}

// ─── Create circle ────────────────────────────────────────────────────────────
export async function createCircle(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const { data, error } = await supabase
    .from('circles')
    .insert({
      vendor_id:    vendor.id,
      name:         formData.name,
      description:  formData.description || null,
      type:         formData.type || 'general',   // general | vip | wholesale | flash_sale | announcements
      cover_url:    formData.cover_url || null,
      emoji:        formData.emoji || '💬',
      is_active:    true,
      member_count: 0,
      message_count:0,
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .select().single()

  if (error) return { error: error.message }

  revalidatePath('/vendor/circles')
  return { data }
}

// ─── Update circle ────────────────────────────────────────────────────────────
export async function updateCircle(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  const { error } = await supabase
    .from('circles')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/circles')
  revalidatePath(`/vendor/circles/${id}`)
  return { success: true }
}

// ─── Delete circle ────────────────────────────────────────────────────────────
export async function deleteCircle(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  const { error } = await supabase
    .from('circles').delete().eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/circles')
  return { success: true }
}

import { NotificationService } from '@/lib/services/notifications'

// ─── Send message ─────────────────────────────────────────────────────────────
export async function sendCircleMessage(circleId, { content, type = 'text', media_url, media_type }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!content?.trim() && !media_url) return { error: 'Message cannot be empty' }

  const { data, error } = await supabase
    .from('circle_messages')
    .insert({
      circle_id:   circleId,
      sender_id:   user.id,
      content:     content?.trim() || null,
      type,
      media_url:   media_url  || null,
      media_type:  media_type || null,
      created_at:  new Date().toISOString(),
    })
    .select('*, sender:users(id, full_name, avatar_url), reactions(*)')
    .single()

  if (error) return { error: error.message }

  // Update circle last_message_at + message_count
  const { data: circle } = await supabase.from('circles')
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', circleId)
    .select('name')
    .single()

  // Notify if announcement
  if (type === 'announcement' && circle) {
    const snippet = content?.trim() || (media_url ? `Shared a ${media_type || 'file'}` : 'New announcement')
    NotificationService.notifyCircleAnnouncement(circleId, data.sender.full_name, circle.name, snippet)
      .catch(err => console.error('Circle Notification Error:', err))
  }

  return { data }
}

// ─── Send broadcast / announcement ────────────────────────────────────────────
export async function sendBroadcast(circleId, { content, media_url, media_type, pinned = false }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('circle_messages')
    .insert({
      circle_id:   circleId,
      sender_id:   user.id,
      content:     content?.trim(),
      type:        'announcement',
      media_url:   media_url  || null,
      media_type:  media_type || null,
      pinned,
      pinned_at:   pinned ? new Date().toISOString() : null,
      created_at:  new Date().toISOString(),
    })
    .select('*, sender:users(id, full_name, avatar_url)')
    .single()

  if (error) return { error: error.message }

  const { data: circle } = await supabase.from('circles')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', circleId)
    .select('name')
    .single()

  // Notify members
  if (circle) {
    NotificationService.notifyCircleAnnouncement(circleId, data.sender.full_name, circle.name, content?.trim())
      .catch(err => console.error('Broadcast Notification Error:', err))
  }

  revalidatePath(`/vendor/circles/${circleId}`)
  return { data }
}

// ─── Pin / unpin message ──────────────────────────────────────────────────────
export async function togglePinMessage(messageId, pin) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('circle_messages')
    .update({ pinned: pin, pinned_at: pin ? new Date().toISOString() : null })
    .eq('id', messageId)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── Delete message ───────────────────────────────────────────────────────────
export async function deleteCircleMessage(messageId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('circle_messages')
    .delete()
    .eq('id', messageId)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── Remove member ────────────────────────────────────────────────────────────
export async function removeMember(circleId, memberId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  // Verify ownership
  const { data: circle } = await supabase
    .from('circles').select('id').eq('id', circleId).eq('vendor_id', vendor.id).single()
  if (!circle) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('id', memberId)

  if (error) return { error: error.message }
  revalidatePath(`/vendor/circles/${circleId}`)
  return { success: true }
}

// ─── Generate invite link ─────────────────────────────────────────────────────
export async function generateInviteLink(circleId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const code = Math.random().toString(36).slice(2, 10).toUpperCase()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('circle_invites')
    .insert({
      circle_id:  circleId,
      code,
      created_by: user.id,
      expires_at: expiresAt,
      max_uses:   null, // unlimited
      uses:       0,
    })
    .select().single()

  if (error) return { error: error.message }
  return { code, expiresAt }
}

// ─── Get circle stats ─────────────────────────────────────────────────────────
export async function getCircleStats(circleId) {
  const supabase = await createClient()

  const [
    { count: members },
    { count: messages },
    { count: announcements },
  ] = await Promise.all([
    supabase.from('circle_members').select('id', { count: 'exact', head: true }).eq('circle_id', circleId),
    supabase.from('circle_messages').select('id', { count: 'exact', head: true }).eq('circle_id', circleId),
    supabase.from('circle_messages').select('id', { count: 'exact', head: true }).eq('circle_id', circleId).eq('type', 'announcement'),
  ])

  return { members: members ?? 0, messages: messages ?? 0, announcements: announcements ?? 0 }
}

// ─── Get vendor's active products (for product sharing in circles) ────────────
export async function getCircleProducts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return []

  const { data } = await supabase
    .from('products')
    .select('id, name, price, thumbnail_url, sku, stock_quantity, status')
    .eq('vendor_id', vendor.id)
    .eq('status', 'active')
    .order('name')
    .limit(100)

  return data ?? []
}