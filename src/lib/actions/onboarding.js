'use server'

import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------
// GET STATE
// ---------------------------------------------------------
export async function getOnboardingState() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data ?? null
}

// ---------------------------------------------------------
// UPGRADE TO VENDOR
// ---------------------------------------------------------
export async function startVendorOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Upgrade role to vendor
  const { error } = await supabase
    .from('users')
    .update({ role: 'vendor' })
    .eq('id', user.id)

  if (error) return { error: error.message }
  
  // Ensure vendor row exists (stub)
  const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).maybeSingle()
  if (!vendor) {
    await supabase.from('vendors').insert({ 
      user_id: user.id, 
      onboarding_step: 1, 
      onboarding_complete: false,
      store_status: 'pending' 
    })
  }

  return { success: true }
}

// ---------------------------------------------------------
// STEP 1 — Store identity
// ---------------------------------------------------------
export async function saveStoreIdentity(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('vendors')
    .upsert({
      user_id:          user.id,
      store_name:       formData.store_name,
      store_handle:     formData.store_handle,
      store_tagline:    formData.store_tagline    || null,
      store_category:   formData.store_category,
      store_logo_url:   formData.store_logo_url   || null,
      store_banner_url: formData.store_banner_url || null,
      onboarding_step:  2,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select().single()

  if (error) return { error: error.message }
  // FIX: removed revalidatePath — it was causing page remount + step reset
  return { data }
}

// ---------------------------------------------------------
// STEP 2 — Business info
// ---------------------------------------------------------
export async function saveBusinessInfo(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('vendors')
    .update({
      business_type:       formData.business_type,
      business_reg_name:   formData.business_reg_name,
      business_reg_number: formData.business_reg_number || null,
      business_email:      formData.business_email,
      business_phone:      formData.business_phone,
      business_address:    formData.business_address,
      business_city:       formData.business_city,
      business_country:    formData.business_country,
      onboarding_step:     3,
      updated_at:          new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select().single()

  if (error) return { error: error.message }
  return { data }
}

// ---------------------------------------------------------
// STEP 3 — Payment setup
// ---------------------------------------------------------
export async function savePaymentSetup(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('vendors')
    .update({
      payment_method:       formData.payment_method,
      payment_account_name: formData.payment_account_name,
      payment_account_num:  formData.payment_account_num,
      payment_bank_name:    formData.payment_bank_name  || null,
      payment_mobile_num:   formData.payment_mobile_num || null,
      onboarding_step:      4,
      updated_at:           new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select().single()

  if (error) return { error: error.message }
  return { data }
}

// ---------------------------------------------------------
// STEP 4 — Shipping
// ---------------------------------------------------------
export async function saveShipping(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('vendors')
    .update({
      delivery_methods:        formData.delivery_methods,
      ships_nationwide:        formData.ships_nationwide,
      shipping_regions:        formData.shipping_regions        || [],
      base_shipping_fee:       formData.base_shipping_fee       || 0,
      free_shipping_threshold: formData.free_shipping_threshold || null,
      avg_processing_days:     formData.avg_processing_days     || 1,
      onboarding_step:         5,
      updated_at:              new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select().single()

  if (error) return { error: error.message }
  return { data }
}

// ---------------------------------------------------------
// STEP 5 — Verification docs
// ---------------------------------------------------------
export async function saveVerificationDocs(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('vendors')
    .update({
      id_type:             formData.id_type,
      id_front_url:        formData.id_front_url,
      id_back_url:         formData.id_back_url || null,
      selfie_url:          formData.selfie_url  || null,
      verification_status: 'pending',
      onboarding_step:     6,
      onboarding_complete: true,
      updated_at:          new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select().single()

  if (error) return { error: error.message }
  return { data }
}

// ---------------------------------------------------------
// STEP 6 — Complete onboarding
// FIX: this is the missing action. StepComplete calls this,
// which triggers fn_sync_user_claims on the DB side so the
// next refreshSession() call gets a JWT with
// onboarding_complete=true embedded by the hook.
// ---------------------------------------------------------
export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Ensure onboarding_complete is true (idempotent)
  const { error } = await supabase
    .from('vendors')
    .update({
      onboarding_complete: true,
      onboarding_step:     6,
      updated_at:          new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Revalidate vendor routes now that onboarding is done
  revalidatePath('/vendor/dashboard')

  return { success: true }
}