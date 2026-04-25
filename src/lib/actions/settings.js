'use server'
// FILE: src/lib/actions/settings.js

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Get full vendor profile for settings ────────────────────────────────────
export async function getVendorSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !vendor) return null

  return {
    vendor,
    user: {
      id:         user.id,
      email:      user.email,
      created_at: user.created_at,
    },
  }
}

// ─── Update store profile ─────────────────────────────────────────────────────
export async function updateStoreProfile(data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendors')
    .update({
      store_name:       data.store_name?.trim(),
      store_handle:     data.store_handle?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      store_tagline:    data.store_tagline?.trim()    || null,
      store_category:   data.store_category           || null,
      store_description:data.store_description?.trim()|| null,
      store_logo_url:   data.store_logo_url           || null,
      store_banner_url: data.store_banner_url         || null,
      store_website:    data.store_website?.trim()    || null,
      social_instagram: data.social_instagram?.trim() || null,
      social_twitter:   data.social_twitter?.trim()   || null,
      social_facebook:  data.social_facebook?.trim()  || null,
      social_tiktok:    data.social_tiktok?.trim()    || null,
      updated_at:       new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/settings')
  revalidatePath('/vendor/dashboard')
  return { success: true }
}

export async function updatePreferences(data) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendors')
    .update({
      pref_country:       data.pref_country,
      pref_currency:      data.pref_currency,
      pref_language:      data.pref_language,
      pref_timezone:      data.pref_timezone,
      pref_date_format:   data.pref_date_format,
      pref_weight_unit:   data.pref_weight_unit,
      pref_distance_unit: data.pref_distance_unit,
    })
    .eq('user_id', user.id)

  return error ? { error: error.message } : { success: true }
}

// ─── Update business info ─────────────────────────────────────────────────────
export async function updateBusinessInfo(data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendors')
    .update({
      business_type:       data.business_type,
      business_reg_name:   data.business_reg_name?.trim()   || null,
      business_reg_number: data.business_reg_number?.trim() || null,
      business_email:      data.business_email?.trim(),
      business_phone:      data.business_phone?.trim(),
      business_address:    data.business_address?.trim(),
      business_city:       data.business_city?.trim(),
      business_country:    data.business_country,
      updated_at:          new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/settings')
  return { success: true }
}

// ─── Update payout / payment details ─────────────────────────────────────────
export async function updatePayoutDetails(data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendors')
    .update({
      payment_method:       data.payment_method,
      payment_account_name: data.payment_account_name?.trim(),
      payment_account_num:  data.payment_account_num?.trim(),
      payment_bank_name:    data.payment_bank_name?.trim()  || null,
      payment_mobile_num:   data.payment_mobile_num?.trim() || null,
      payment_swift_code:   data.payment_swift_code?.trim() || null,
      payment_iban:         data.payment_iban?.trim()       || null,
      updated_at:           new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/settings')
  return { success: true }
}

// ─── Update shipping settings ─────────────────────────────────────────────────
export async function updateShippingSettings(data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendors')
    .update({
      delivery_methods:        data.delivery_methods       || [],
      ships_nationwide:        data.ships_nationwide       ?? true,
      shipping_regions:        data.shipping_regions       || [],
      base_shipping_fee:       Number(data.base_shipping_fee) || 0,
      free_shipping_threshold: data.free_shipping_threshold
        ? Number(data.free_shipping_threshold) : null,
      avg_processing_days:     Number(data.avg_processing_days) || 1,
      updated_at:              new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/settings')
  return { success: true }
}

// ─── Update notification preferences ─────────────────────────────────────────
export async function updateNotificationPrefs(data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendors')
    .update({
      notif_new_order:     data.notif_new_order     ?? true,
      notif_order_update:  data.notif_order_update  ?? true,
      notif_new_message:   data.notif_new_message   ?? true,
      notif_low_stock:     data.notif_low_stock      ?? true,
      notif_low_stock_threshold: Number(data.notif_low_stock_threshold) || 5,
      notif_review:        data.notif_review        ?? true,
      notif_circle:        data.notif_circle        ?? true,
      notif_campaign:      data.notif_campaign      ?? true,
      notif_payout:        data.notif_payout        ?? true,
      notif_email:         data.notif_email         ?? true,
      notif_push:          data.notif_push          ?? true,
      updated_at:          new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/settings')
  return { success: true }
}

// ─── Update security settings ─────────────────────────────────────────────────
export async function updatePassword(currentPassword, newPassword) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

// ─── Delete / deactivate store ────────────────────────────────────────────────
export async function deactivateStore(reason) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendors')
    .update({
      store_status:        'deactivated',
      deactivation_reason: reason || null,
      deactivated_at:      new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}