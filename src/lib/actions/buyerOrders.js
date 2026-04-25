'use server'

import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Buyer cancels their own order.
 * Only allowed if status is 'pending'.
 */
export async function buyerCancelOrder(orderId, reason = 'Cancelled by buyer') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Verify ownership and status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status, vendor_id')
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .single()

  if (orderError || !order) return { error: 'Order not found or access denied' }
  if (order.status !== 'pending') return { error: 'Order can only be cancelled while pending' }

  // 2. Update status
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      status: 'cancelled', 
      cancel_reason: reason,
      updated_at: new Date().toISOString() 
    })
    .eq('id', orderId)
    .eq('buyer_id', user.id)

  if (updateError) return { error: updateError.message }

  // 3. Log to timeline
  await supabase.from('order_timeline').insert({
    order_id:   orderId,
    event:      'cancelled',
    note:       reason,
    created_by: user.id,
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  return { success: true }
}

/**
 * Buyer updates their delivery address.
 * Allowed before the order is 'shipped'.
 */
export async function buyerUpdateAddress(orderId, newAddress) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Verify ownership and status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .single()

  if (orderError || !order) return { error: 'Order not found or access denied' }
  
  const restrictedStatuses = ['shipped', 'delivered', 'completed', 'cancelled', 'disputed']
  if (restrictedStatuses.includes(order.status)) {
    return { error: `Cannot update address when order is ${order.status}` }
  }

  // 2. Update address
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      delivery_address: newAddress,
      updated_at: new Date().toISOString() 
    })
    .eq('id', orderId)
    .eq('buyer_id', user.id)

  if (updateError) return { error: updateError.message }

  // 3. Log to timeline
  await supabase.from('order_timeline').insert({
    order_id:   orderId,
    event:      'address_updated',
    note:       'Delivery address was updated by the buyer',
    created_by: user.id,
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}
