'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const [{ data: adminRow }, { data: userRow }] = await Promise.all([
    supabase.from('admins').select('id, role').eq('user_id', user.id).maybeSingle(),
    supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
  ])
  
  if (adminRow) return adminRow
  if (userRow?.role === 'admin') {
    return { id: user.id, role: userRow.role }
  }
  
  return null
}

export async function getVerifications() {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return { error: 'Unauthorized' }

  // Fetch all vendors that have completed onboarding
  const { data, error } = await supabase
    .from('vendors')
    .select(`
      id, user_id,
      store_name, store_category, business_country,
      business_type, business_reg_name, business_reg_number,
      id_type, id_front_url, id_back_url, selfie_url,
      verification_status, created_at, updated_at,
      users:user_id(full_name, email)
    `)
    .eq('onboarding_complete', true)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function approveVerification(vendorId) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('vendors')
    .update({ 
      verification_status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', vendorId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/verifications')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function rejectVerification(vendorId) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('vendors')
    .update({ 
      verification_status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', vendorId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/verifications')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
