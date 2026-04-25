'use server'
// FILE: src/lib/actions/store.js

import { createClient } from '@/lib/supabase/server'

// ─── Get public store by handle ───────────────────────────────────────────────
export async function getStoreByHandle(handle) {
  const supabase = await createClient()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle)

  let query = supabase
    .from('vendors')
    .select(`
      id, store_name, store_handle, store_tagline, store_description,
      store_logo_url, store_banner_url, store_category, store_website,
      social_instagram, social_twitter, social_facebook, social_tiktok,
      verification_status, verified, created_at,
      follower_count, trust_score,
      business_city, business_country
    `)
    .in('store_status', ['active', 'pending'])

  if (isUUID) {
    query = query.eq('id', handle)
  } else {
    query = query.eq('store_handle', handle.toLowerCase())
  }

  const { data: vendor, error } = await query.single()

  if (error || !vendor) return null
  return vendor
}

// ─── Get store products ───────────────────────────────────────────────────────
export async function getStoreProducts(vendorId, { category, sort = 'newest', page = 1, limit = 20 } = {}) {
  const supabase = await createClient()
  const from     = (page - 1) * limit

  let query = supabase
    .from('products')
    .select('id, name, price, compare_at_price, thumbnail_url, images, category, stock_quantity, created_at', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .eq('status', 'active')

  if (category) query = query.eq('category', category)

  if (sort === 'newest')    query = query.order('created_at', { ascending: false })
  else if (sort === 'price_asc')  query = query.order('price', { ascending: true  })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else if (sort === 'popular')    query = query.order('created_at', { ascending: false }) // swap for views when available

  query = query.range(from, from + limit - 1)

  const { data, count } = await query
  return { products: data ?? [], total: count ?? 0 }
}

// ─── Get store videos ─────────────────────────────────────────────────────────
export async function getStoreVideos(vendorId, limit = 8) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('product_videos')
    .select(`
      id, title, video_url, thumbnail_url, views, likes, duration_seconds, created_at,
      video_tags (
        id,
        product:products ( id, name, slug, price, compare_at_price, thumbnail_url, images, description, stock_quantity, category, vendor_id, vendor:vendors (id, store_name, logo_url, verification_status) )
      )
    `)
    .eq('vendor_id', vendorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ─── Get store stats (public) ─────────────────────────────────────────────────
export async function getStoreStats(vendorId) {
  const supabase = await createClient()

  const [
    { count: productCount },
    { count: videoCount   },
    { count: followerCount},
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'active'),
    supabase.from('product_videos').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'published'),
    supabase.from('vendor_follows').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
  ])

  return {
    products:  productCount  ?? 0,
    videos:    videoCount    ?? 0,
    followers: followerCount ?? 0,
  }
}

// ─── Check if current user follows this store ─────────────────────────────────
export async function getFollowStatus(vendorId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('vendor_follows')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('follower_id', user.id)
    .maybeSingle()

  return !!data
}