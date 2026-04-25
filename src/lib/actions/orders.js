'use server'

import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Get orders list ──────────────────────────────────────────────────────────
export async function getOrders({ status, search, page = 1, limit = 20, dateFrom, dateTo } = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return null

  let query = supabase
    .from('orders')
    .select(`
      id, status, total_amount, subtotal, shipping_fee,
      delivery_method, created_at, updated_at,
      escrow_status, escrow_released_at, dispute_window_ends,
      buyer_id,
      order_items (
        id, quantity, unit_price, total_price,
        product:products ( id, name, thumbnail_url, sku )
      ),
      delivery:deliveries (
        id, status, tracking_number, estimated_at, delivered_at
      )
    `, { count: 'exact' })
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo)
  if (search)   query = query.ilike('id', `%${search}%`)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query
  if (error) {
    console.error('[getOrders] error:', error.message)
    return { orders: [], total: 0, page, limit, statusCounts: {} }
  }

  const orders = data ?? []

  // ── Manual Buyer Join ──────────────────────────────────────
  if (orders.length > 0) {
    const buyerIds = Array.from(new Set(orders.map(o => o.buyer_id).filter(Boolean)))
    if (buyerIds.length > 0) {
      const { data: buyers } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', buyerIds)
      
      const buyerMap = Object.fromEntries((buyers ?? []).map(b => [b.id, b]))
      orders.forEach(o => {
        o.buyer = buyerMap[o.buyer_id] ?? null
      })
    }
  }

  // Status summary counts
  const statuses = ['pending','vendor_accepted','preparing','shipped','delivered','completed','cancelled','disputed']
  const counts = await Promise.all(
    statuses.map(s =>
      supabase.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id).eq('status', s)
    )
  )
  const statusCounts = Object.fromEntries(statuses.map((s, i) => [s, counts[i].count ?? 0]))

  return { orders, total: count ?? 0, page, limit, statusCounts }
}

// ─── Get single order ─────────────────────────────────────────────────────────
export async function getOrder(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name, store_handle, business_email, business_phone, business_address, business_city, business_country, store_logo_url')
    .eq('user_id', user.id).single()
  if (!vendor) return null

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, quantity, unit_price, total_price,
        product:products ( id, name, thumbnail_url, sku, category )
      ),
      delivery:deliveries (
        id, status, tracking_number, otp_code, delivery_photo,
        estimated_at, delivered_at, courier_name
      ),
      payments:novapay_transactions (
        id, amount, payment_method, status, processor_ref, initiated_at
      ),
      complaints (
        id, reason, description, status, created_at, resolved_at, resolution, resolved_by
      ),
      order_timeline (
        id, event, note, created_at, created_by
      )
    `)
    .eq('id', id).eq('vendor_id', vendor.id).single()

  if (error) {
    console.error('[getOrder] error:', error.message)
    return null
  }
  const order = data
  if (order) {
    const { data: buyer } = await supabase
      .from('users')
      .select('id, full_name, email, phone, avatar_url, shipping_address')
      .eq('id', order.buyer_id)
      .single()
    order.buyer = buyer ?? null
  }

  return { order, vendor }
}

import { NotificationService } from '@/lib/services/notifications'

// ─── Accept order ─────────────────────────────────────────────────────────────
export async function acceptOrder(id, estimatedDelivery) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).single()

  const { data: order } = await supabase.from('orders').select('buyer_id').eq('id', id).single()

  const { error } = await supabase.from('orders')
    .update({ status: 'vendor_accepted', updated_at: new Date().toISOString() })
    .eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }

  // Insert or update delivery info
  if (estimatedDelivery) {
    const { error: deliveryError } = await supabase.from('deliveries').upsert({
      order_id: id,
      vendor_id: vendor.id,
      estimated_at: new Date(estimatedDelivery).toISOString(),
      status: 'pending'
    }, { onConflict: 'order_id' })
    if (deliveryError) console.error('[acceptOrder] delivery error:', deliveryError)
  }

  await logHistory(supabase, id, 'vendor_accepted', `Order accepted. Estimated readiness: ${new Date(estimatedDelivery).toLocaleString()}`, user.id)
  
  if (order?.buyer_id) {
    await NotificationService.notifyOrderStatusUpdate(order.buyer_id, id, 'vendor_accepted')
  }

  revalidatePath(`/vendor/orders/${id}`)
  revalidatePath('/vendor/orders')
  return { success: true }
}

// ─── Update status ────────────────────────────────────────────────────────────
export async function updateOrderStatus(id, status, note = '') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).single()

  const { data: order } = await supabase.from('orders').select('buyer_id').eq('id', id).single()

  const { error } = await supabase.from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  await logHistory(supabase, id, status, note || `Status updated to ${status}`, user.id)
  
  if (order?.buyer_id) {
    await NotificationService.notifyOrderStatusUpdate(order.buyer_id, id, status, note)
  }

  revalidatePath(`/vendor/orders/${id}`)
  revalidatePath('/vendor/orders')
  return { success: true }
}

// ─── Mark shipped ─────────────────────────────────────────────────────────────
export async function markShipped(id, { tracking_number, courier_name, estimated_delivery }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).single()

  const { data: order } = await supabase.from('orders').select('buyer_id').eq('id', id).single()

  await supabase.from('deliveries')
    .update({ tracking_number, courier_name, estimated_at: estimated_delivery, status: 'in_transit' })
    .eq('order_id', id)

  const { error } = await supabase.from('orders')
    .update({ status: 'shipped', updated_at: new Date().toISOString() })
    .eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  await logHistory(supabase, id, 'shipped', `Shipped via ${courier_name}. Tracking: ${tracking_number}`, user.id)
  
  if (order?.buyer_id) {
    const details = `Carrier: ${courier_name}, Tracking: ${tracking_number}`
    await NotificationService.notifyOrderStatusUpdate(order.buyer_id, id, 'shipped', details)
  }

  revalidatePath(`/vendor/orders/${id}`)
  return { success: true }
}

// ─── Mark out for delivery ────────────────────────────────────────────────────
// orders.status stays 'shipped' (valid enum); only deliveries.status advances
export async function markOutForDelivery(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase.from('orders').select('buyer_id').eq('id', id).single()

  const { error } = await supabase.from('deliveries')
    .update({ status: 'out_for_delivery', updated_at: new Date().toISOString() })
    .eq('order_id', id)

  if (error) return { error: error.message }
  await logHistory(supabase, id, 'out_for_delivery', 'Order is out for delivery', user.id)

  if (order?.buyer_id) {
    await NotificationService.notifyOrderStatusUpdate(order.buyer_id, id, 'out_for_delivery', 'Your order is out for delivery')
  }

  revalidatePath(`/vendor/orders/${id}`)
  return { success: true }
}


// ─── Cancel order ─────────────────────────────────────────────────────────────
export async function cancelOrder(id, reason) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).single()

  const { data: order } = await supabase.from('orders').select('buyer_id').eq('id', id).single()

  const { error } = await supabase.from('orders')
    .update({ status: 'cancelled', cancel_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', id).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  await logHistory(supabase, id, 'cancelled', `Cancelled by vendor: ${reason}`, user.id)
  
  if (order?.buyer_id) {
    await NotificationService.notifyOrderStatusUpdate(order.buyer_id, id, 'cancelled', `Reason: ${reason}`)
  }

  revalidatePath(`/vendor/orders/${id}`)
  revalidatePath('/vendor/orders')
  return { success: true }
}

// ─── File complaint ───────────────────────────────────────────────────────────
export async function fileComplaint(orderId, { type, message }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).single()

  const { data: order } = await supabase.from('orders').select('buyer_id').eq('id', orderId).single()

  const { data, error } = await supabase.from('complaints')
    .insert({
      order_id:    orderId,
      vendor_id:   vendor.id,
      buyer_id:    order?.buyer_id, // Added buyer_id from order
      reason:      type,
      description: message,
      status:      'open',
      created_at:  new Date().toISOString(),
    })
    .select().single()

  if (error) return { error: error.message }

  await supabase.from('orders')
    .update({ status: 'disputed', updated_at: new Date().toISOString() })
    .eq('id', orderId).eq('vendor_id', vendor.id)

  await logHistory(supabase, orderId, 'disputed', `Complaint filed: ${type}`, user.id)
  revalidatePath(`/vendor/orders/${orderId}`)
  return { success: true, data }
}

// ─── Request early escrow release ────────────────────────────────────────────
export async function requestEscrowRelease(orderId, reason) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).single()

  const { error } = await supabase.from('orders')
    .update({
      escrow_stage:                  'release_requested',
      escrow_release_requested:      true,
      escrow_release_request_note:   reason,
      updated_at:                    new Date().toISOString(),
    })
    .eq('id', orderId).eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  await logHistory(supabase, orderId, null, `Early escrow release requested: ${reason}`, user.id)
  revalidatePath(`/vendor/orders/${orderId}`)
  return { success: true }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
async function logHistory(supabase, orderId, status, note, userId) {
  await supabase.from('order_timeline').insert({
    order_id:   orderId,
    event:      status ?? 'status_update',
    note,
    created_by: userId,
    created_at: new Date().toISOString(),
  })
}