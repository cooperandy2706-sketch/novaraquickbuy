'use server'
// FILE: src/lib/actions/auth.js

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'

import { NotificationService } from '@/lib/services/notifications'

// ── Sign Up ───────────────────────────────────────────────────────────────────
export async function signUp({ full_name, email, password, role }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) return { error: error.message }

  if (data.user) {
    // Upsert users row (trigger may not have fired yet)
    await supabase.from('users').upsert({
      id:         data.user.id,
      email:      email.toLowerCase().trim(),
      full_name:  full_name.trim(),
      role,
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    // If vendor — create vendors stub
    if (role === 'vendor') {
      await supabase.from('vendors').upsert({
        user_id:             data.user.id,
        store_name:          `${full_name.trim()}'s Store`,
        store_status:        'pending',
        onboarding_complete: false,
        onboarding_step:     1,
        created_at:          new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }

    // Send Welcome Email via Resend
    try {
      await NotificationService.sendWelcomeEmail(email, full_name)
    } catch (err) {
      console.error('Failed to send welcome email:', err)
    }
  }

  return { success: true, user: data.user }
}

// ── Sign In ───────────────────────────────────────────────────────────────────
export async function signIn({ email, password }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  })

  if (error) return { error: error.message }

  // Update last_seen_at
  await supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', data.user.id)

  return { success: true, user: data.user }
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ── Forgot Password ───────────────────────────────────────────────────────────
export async function forgotPassword({ email }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.toLowerCase().trim(),
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?type=recovery` }
  )

  if (error) return { error: error.message }
  return { success: true }
}

// ── Reset Password ────────────────────────────────────────────────────────────
export async function resetPassword({ password }) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}

// ── Update Profile ────────────────────────────────────────────────────────────
export async function updateProfile({ full_name, avatar_url, phone, locale, currency, country_code }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({ full_name, avatar_url, phone, locale, currency, country_code })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { success: true }
}

// ── Get current session + full profile ───────────────────────────────────────
export async function getSessionProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, email, full_name, avatar_url, role,
      phone, locale, currency, country_code,
      created_at, last_seen_at,
      vendor:vendors (
        id, user_id,
        store_name, store_handle, store_tagline,
        store_logo_url, store_banner_url, store_category,
        store_status, store_description,
        verified, verification_status,
        onboarding_complete, onboarding_step,
        trust_score, follower_count,
        subscription_status, subscription_plan,
        subscription_expires_at,
        business_country
      )
    `)
    .eq('id', user.id)
    .single()

  return profile ?? null
}

// ── Check if email already registered ────────────────────────────────────────
export async function checkEmailExists(email) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()
  return !!data
}