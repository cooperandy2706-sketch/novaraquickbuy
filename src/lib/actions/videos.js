'use server'

import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Get vendor videos list ────────────────────────────────────────────────────
export async function getVideos({ status, page = 1, limit = 20, search } = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return null

  let query = supabase
    .from('product_videos')
    .select(`
      id, title, description, status, thumbnail_url, video_url,
      views, likes, comments_count, shares,
      duration_seconds, scheduled_at, created_at, updated_at,
      video_tags (
        id, position_x, position_y,
        product:products ( id, name, price, thumbnail_url )
      )
    `, { count: 'exact' })
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('title', `%${search}%`)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query
  if (error) return null

  // Summary counts
  const [
    { count: totalPublished },
    { count: totalDrafts },
    { count: totalScheduled },
  ] = await Promise.all([
    supabase.from('product_videos').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('status', 'published'),
    supabase.from('product_videos').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('status', 'draft'),
    supabase.from('product_videos').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('status', 'scheduled'),
  ])

  return {
    videos: data ?? [],
    total:  count ?? 0,
    page, limit,
    summary: {
      published: totalPublished ?? 0,
      drafts:    totalDrafts    ?? 0,
      scheduled: totalScheduled ?? 0,
    },
  }
}

// ─── Get single video ─────────────────────────────────────────────────────────
export async function getVideo(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return null

  const { data, error } = await supabase
    .from('product_videos')
    .select(`
      *,
      video_tags (
        id, position_x, position_y,
        product:products ( id, name, price, thumbnail_url, compare_at_price, stock_quantity )
      )
    `)
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .single()

  if (error) return null
  return data
}

// ─── Create video (metadata only — file uploaded client-side to storage) ──────
export async function createVideo(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const { tags, ...videoData } = formData

  const { data: video, error } = await supabase
    .from('product_videos')
    .insert({
      ...videoData,
      scheduled_at: videoData.scheduled_at || null,
      vendor_id:    vendor.id,
      views:        0,
      likes:        0,
      comments_count: 0,
      shares_count: 0,
      saves_count:  0,
      // is_active drives the buyer feed — true when published
      is_active:    videoData.status === 'published',
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .select().single()

  if (error) return { error: error.message }

  // Insert product tags
  if (tags?.length > 0) {
    const tagRows = tags.map(t => ({
      video_id:   video.id,
      product_id: t.product_id,
      position_x: t.position_x,
      position_y: t.position_y,
      label:      t.product?.name ?? null,   // buyer feed reads label for display
    }))
    const { error: tErr } = await supabase.from('video_tags').insert(tagRows)
    if (tErr) return { error: tErr.message }
  }

  revalidatePath('/vendor/videos')
  return { data: video }
}

// ─── Update video ─────────────────────────────────────────────────────────────
export async function updateVideo(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const { tags, ...videoData } = formData

  const { data: video, error } = await supabase
    .from('product_videos')
    .update({
      ...videoData,
      scheduled_at: videoData.scheduled_at || null,
      // keep is_active in sync with status for buyer feed
      is_active:  videoData.status === 'published',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id).eq('vendor_id', vendor.id)
    .select().single()

  if (error) return { error: error.message }

  // Replace tags
  if (tags !== undefined) {
    await supabase.from('video_tags').delete().eq('video_id', id)
    if (tags.length > 0) {
      const tagRows = tags.map(t => ({
        video_id:   id,
        product_id: t.product_id,
        position_x: t.position_x,
        position_y: t.position_y,
        label:      t.product?.name ?? null,
      }))
      await supabase.from('video_tags').insert(tagRows)
    }
  }

  revalidatePath('/vendor/videos')
  revalidatePath(`/vendor/videos/${id}`)
  return { data: video }
}

// ─── Delete video ─────────────────────────────────────────────────────────────
export async function deleteVideo(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  await supabase.from('video_tags').delete().eq('video_id', id)

  const { error } = await supabase
    .from('product_videos')
    .delete()
    .eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/videos')
  return { success: true }
}

// ─── Publish / unpublish ──────────────────────────────────────────────────────
export async function toggleVideoStatus(id, status) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  const { error } = await supabase
    .from('product_videos')
    .update({
      status,
      is_active:  status === 'published',   // keeps buyer feed in sync
      updated_at: new Date().toISOString(),
    })
    .eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/videos')
  return { success: true }
}

// ─── Get vendor products (for tag picker) ─────────────────────────────────────
export async function getVendorProducts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return []

  const { data } = await supabase
    .from('products')
    .select('id, name, price, thumbnail_url, status, stock_quantity')
    .eq('vendor_id', vendor.id)
    .eq('status', 'active')
    .order('name')
    .limit(100)

  return data ?? []
}

// ─── Customer feed (public) ────────────────────────────────────────────────────
export async function getVideoFeed({ page = 1, limit = 10, vendorId } = {}) {
  const supabase = await createClient()

  let query = supabase
    .from('product_videos')
    .select(`
      id, title, description, video_url, thumbnail_url,
      views, likes, comments_count, shares, duration_seconds, created_at,
      vendor:vendors (
        id, store_name, store_handle, store_logo_url, verified
      ),
      video_tags (
        id, position_x, position_y,
        product:products ( id, name, price, compare_at_price, thumbnail_url, stock_quantity )
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (vendorId) query = query.eq('vendor_id', vendorId)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, error } = await query
  return data ?? []
}