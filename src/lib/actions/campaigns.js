'use server'
// FILE: src/lib/actions/campaigns.js

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrencyForCountry } from '@/lib/config/currencies'

// ─── Get vendor subscription status ──────────────────────────────────────────
export async function getSubscriptionStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {
    vendorId:       null,
    country:        'United States',
    currency:       getCurrencyForCountry('United States'),
    status:         'none',
    plan:           null,
    expiresAt:      null,
    isActive:       false,
    daysLeft:       0,
    pendingPayment: null,
  }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name, business_country, subscription_status, subscription_plan, subscription_expires_at')
    .eq('user_id', user.id)
    .single()

  if (!vendor) return {
    vendorId:       null,
    country:        'United States',
    currency:       getCurrencyForCountry('United States'),
    status:         'none',
    plan:           null,
    expiresAt:      null,
    isActive:       false,
    daysLeft:       0,
    pendingPayment: null,
  }

  const now       = new Date()
  const expiresAt = vendor.subscription_expires_at ? new Date(vendor.subscription_expires_at) : null
  const isActive  = vendor.subscription_status === 'active' && expiresAt && expiresAt > now
  const daysLeft  = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 86400000)) : 0

  // Get pending payment if any
  const { data: pendingPayment } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    vendorId:    vendor.id,
    country:     vendor.business_country,
    currency:    getCurrencyForCountry(vendor.business_country),
    status:      vendor.subscription_status ?? 'none',
    plan:        vendor.subscription_plan,
    expiresAt:   vendor.subscription_expires_at,
    isActive,
    daysLeft,
    pendingPayment: pendingPayment ?? null,
  }
}

// ─── Submit subscription payment proof ────────────────────────────────────────
export async function submitSubscriptionPayment({
  plan,           // 'monthly' | 'six_month'
  paymentMethod,
  transactionRef,
  proofNote,
  proofImageUrl,
  amount,
  currency,
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id, store_name').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  // Check for existing pending payment
  const { data: existing } = await supabase
    .from('subscription_payments')
    .select('id')
    .eq('vendor_id', vendor.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return { error: 'You already have a payment under review. Please wait for admin verification.' }

  const { data, error } = await supabase
    .from('subscription_payments')
    .insert({
      vendor_id:      vendor.id,
      plan,
      payment_method: paymentMethod,
      transaction_ref: transactionRef?.trim() || null,
      proof_note:     proofNote?.trim() || null,
      proof_image_url: proofImageUrl || null,
      amount,
      currency,
      status:         'pending',
      submitted_at:   new Date().toISOString(),
    })
    .select().single()

  if (error) return { error: error.message }

  revalidatePath('/vendor/marketing/subscribe')
  revalidatePath('/vendor/marketing/campaigns')
  return { data, success: true }
}

// ─── Get all campaigns for vendor ─────────────────────────────────────────────
export async function getCampaigns() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return []

  const { data } = await supabase
    .from('campaigns')
    .select(`
      id, type, name, status, budget, spent,
      starts_at, ends_at, created_at,
      impressions, clicks, conversions, revenue,
      campaign_products ( product:products(id, name, thumbnail_url, price) )
    `)
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ─── Get single campaign ──────────────────────────────────────────────────────
export async function getCampaign(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {
    vendorId:       null,
    country:        'United States',
    currency:       getCurrencyForCountry('United States'),
    status:         'none',
    plan:           null,
    expiresAt:      null,
    isActive:       false,
    daysLeft:       0,
    pendingPayment: null,
  }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return null

  const { data } = await supabase
    .from('campaigns')
    .select(`
      *, campaign_products ( product:products(id, name, thumbnail_url, price, images) )
    `)
    .eq('id', id).eq('vendor_id', vendor.id).single()

  return data
}

import { NotificationService } from '@/lib/services/notifications'

// ─── Create campaign ──────────────────────────────────────────────────────────
export async function createCampaign({
  type, name, budget, startsAt, endsAt,
  productIds, discountType, discountValue,
  discountCode, minOrderValue, usageLimit,
  heroSlot, videoId, broadcastMessage, targetCircleIds,
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id, store_name, subscription_status, subscription_expires_at').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  // Must have active subscription
  const isActive = vendor.subscription_status === 'active'
    && vendor.subscription_expires_at
    && new Date(vendor.subscription_expires_at) > new Date()

  if (!isActive) return { error: 'Active subscription required to create campaigns.' }

  const campaignStatus = startsAt && new Date(startsAt) > new Date() ? 'scheduled' : 'active'

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      vendor_id:        vendor.id,
      type,
      name:             name?.trim(),
      budget:           budget ?? null,
      spent:            0,
      impressions:      0,
      clicks:           0,
      conversions:      0,
      revenue:          0,
      status:           campaignStatus,
      starts_at:        startsAt ?? new Date().toISOString(),
      ends_at:          endsAt   ?? null,
      // Promo fields
      discount_type:    discountType    ?? null,
      discount_value:   discountValue   ?? null,
      discount_code:    discountCode?.toUpperCase().trim() ?? null,
      min_order_value:  minOrderValue   ?? null,
      usage_limit:      usageLimit      ?? null,
      usage_count:      0,
      // Hero banner
      hero_slot:        heroSlot ?? false,
      // Sponsored video
      video_id:         videoId ?? null,
      // Broadcast
      broadcast_message: broadcastMessage ?? null,
      target_circle_ids: targetCircleIds ?? [],
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    })
    .select().single()

  if (error) return { error: error.message }

  // Link products
  if (productIds?.length > 0) {
    await supabase.from('campaign_products').insert(
      productIds.map(pid => ({ campaign_id: campaign.id, product_id: pid }))
    )
  }

  // If active broadcast — notify members
  if (campaignStatus === 'active' && broadcastMessage && targetCircleIds?.length > 0) {
    for (const circleId of targetCircleIds) {
      const { data: circle } = await supabase.from('circles').select('name').eq('id', circleId).single()
      if (circle) {
        NotificationService.notifyCircleAnnouncement(circleId, vendor.store_name, circle.name, broadcastMessage)
          .catch(err => console.error('Broadcast Error:', err))
      }
    }
  }

  revalidatePath('/vendor/marketing/campaigns')
  return { data: campaign }
}

// ─── Update campaign ──────────────────────────────────────────────────────────
export async function updateCampaign(id, patch) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id, store_name').eq('user_id', user.id).single()

  const { error } = await supabase
    .from('campaigns')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }

  // If publishing a broadcast
  if (patch.status === 'active') {
    const { data: camp } = await supabase.from('campaigns').select('*').eq('id', id).single()
    if (camp?.broadcast_message && camp.target_circle_ids?.length > 0) {
      for (const circleId of camp.target_circle_ids) {
        const { data: circle } = await supabase.from('circles').select('name').eq('id', circleId).single()
        if (circle) {
          NotificationService.notifyCircleAnnouncement(circleId, vendor.store_name, circle.name, camp.broadcast_message)
            .catch(err => console.error('Broadcast Update Error:', err))
        }
      }
    }
  }

  revalidatePath('/vendor/marketing/campaigns')
  revalidatePath(`/vendor/marketing/campaigns/${id}`)
  return { success: true }
}

// ─── Delete / cancel campaign ─────────────────────────────────────────────────
export async function deleteCampaign(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  await supabase.from('campaign_products').delete().eq('campaign_id', id)
  const { error } = await supabase
    .from('campaigns').delete().eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/marketing/campaigns')
  return { success: true }
}

// ─── Publish campaign (go live) ───────────────────────────────────────────────
export async function publishCampaign(id) {
  return updateCampaign(id, { status: 'active', starts_at: new Date().toISOString() })
}

// ─── Get hero banner products (for explore page) ──────────────────────────────
export async function getHeroBannerCampaigns() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('campaigns')
    .select(`
      id, name, type,
      vendor:vendors ( id, store_name, store_handle, store_logo_url ),
      campaign_products (
        product:products ( id, name, price, images, thumbnail_url )
      )
    `)
    .eq('status', 'active')
    .eq('hero_slot', true)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(8)

  return data ?? []
}

// ─── Get promo codes for checkout (buyer-side) ───────────────────────────────
export async function validatePromoCode(code, orderTotal) {
  const supabase = await createClient()
  const now      = new Date().toISOString()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('type', 'promo_code')
    .eq('status', 'active')
    .ilike('discount_code', code)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .maybeSingle()

  if (!campaign) return { valid: false, error: 'Invalid or expired promo code' }
  if (campaign.usage_limit && campaign.usage_count >= campaign.usage_limit)
    return { valid: false, error: 'This promo code has reached its usage limit' }
  if (campaign.min_order_value && orderTotal < campaign.min_order_value)
    return { valid: false, error: `Minimum order of ${campaign.min_order_value} required` }

  const discount = campaign.discount_type === 'percentage'
    ? (orderTotal * campaign.discount_value) / 100
    : campaign.discount_value

  return { valid: true, discount, campaign }
}

// ─── Get vendor's sponsored video campaigns ───────────────────────────────────
export async function getSponsoredVideos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return []

  const { data } = await supabase
    .from('campaigns')
    .select(`
      id, name, status, budget, spent,
      impressions, clicks, conversions, revenue,
      starts_at, ends_at, created_at, updated_at,
      video:product_videos!campaigns_video_id_fkey (
        id, title, thumbnail_url, views, likes,
        comments_count, duration_seconds
      )
    `)
    .eq('vendor_id', vendor.id)
    .eq('type', 'sponsored_video')
    .order('created_at', { ascending: false })

  return data ?? []
}

// ─── Get active sponsored videos for buyer feed injection ─────────────────────
export async function getActiveSponsoredFeed(limit = 3) {
  const supabase = await createClient()
  const now      = new Date().toISOString()

  const { data } = await supabase
    .from('campaigns')
    .select(`
      id,
      video:product_videos!campaigns_video_id_fkey (
        id, title, description, video_url, thumbnail_url,
        views, likes, comments_count, shares_count, duration_seconds,
        vendor:vendors (
          id, store_name, store_handle, store_logo_url, verified
        ),
        video_tags (
          id, position_x, position_y, label,
          product:products ( id, name, price, discount_price, images, stock_quantity )
        )
      )
    `)
    .eq('type', 'sponsored_video')
    .eq('status', 'active')
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('budget', { ascending: false })
    .limit(limit)

  return (data ?? []).map(d => ({ ...d.video, _sponsored: true })).filter(Boolean)
}

// ─── Track sponsored impression (called client-side on video view) ────────────
export async function trackSponsoredImpression(campaignId) {
  const supabase = await createClient()
  await supabase.rpc('increment_campaign_impression', { campaign_id: campaignId })
}

// ─── Track sponsored click ────────────────────────────────────────────────────
export async function trackSponsoredClick(campaignId) {
  const supabase = await createClient()
  await supabase.rpc('increment_campaign_click', { campaign_id: campaignId })
}

// ─── Pause / resume sponsored campaign ───────────────────────────────────────
export async function toggleSponsoredStatus(id, status) {
  return updateCampaign(id, { status })
}