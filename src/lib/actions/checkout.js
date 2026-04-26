'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function placeOrder(orderData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Unauthorised' }
    }

    const {
      items, subtotal, delivery_fee, coupon_discount, total_amount, currency,
      delivery_method, payment_method, delivery_address, vendor_id
    } = orderData

    if (!items?.length) {
      return { success: false, error: 'Cart is empty' }
    }

    // ── 1. Create order ──────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id:         user.id,
        vendor_id:        vendor_id,
        status:           'pending', // Initial status
        escrow_stage:     'payment_secured',
        subtotal,
        shipping_fee:     delivery_fee,
        discount_amount:  coupon_discount,
        total_amount:     total_amount,
        currency,
        delivery_method,
        delivery_address: delivery_method === 'store_pickup' ? null : delivery_address,
        payment_status:   'pending', // Manual payment
      })
      .select('id, order_number')
      .single()

    if (orderError) {
      console.error('[placeOrder] error:', orderError)
      return { success: false, error: 'Failed to create order' }
    }

    // ── 2. Insert order items ────────────────────────────────
    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map(item => ({
        order_id:      order.id,
        product_id:    item.product_id,
        vendor_id:     vendor_id,
        variant_label: item.variant_label ?? '',
        quantity:      item.qty,
        unit_price:    item.price,
        product_name:  item.name,
        product_image: item.image_url,
      }))
    )

    if (itemsError) {
      console.error('[placeOrder] items error:', itemsError)
      // Cleanup
      await supabase.from('orders').delete().eq('id', order.id)
      return { success: false, error: 'Failed to create order items' }
    }

    // ── 3. Initial Timeline ──────────────────────────────────
    await supabase.from('order_timeline').insert({
      order_id: order.id,
      event: 'pending',
      note: `Order placed. Payment method chosen: ${payment_method?.replace(/_/g, ' ') || 'none'}. Awaiting manual payment via WhatsApp.`,
      created_by: user.id
    })

    // ── 4. Send Push Notifications ───────────────────────────
    try {
      const { sendPushNotification } = await import('@/lib/pushNotifier')
      
      // Notify Vendor
      await sendPushNotification(
        vendor_id, 
        'New Order Received! 🛍️', 
        `You have a new order #${order.order_number} for ${currency} ${total_amount.toFixed(2)}.`
      )

      // Notify Buyer
      await sendPushNotification(
        user.id,
        'Order Placed Successfully',
        `Your order #${order.order_number} has been sent to the vendor for approval.`
      )
    } catch (pushError) {
      console.error('Failed to send push notifications for new order:', pushError)
      // We don't fail the order if the push fails
    }

    return { success: true, order_id: order.id }

  } catch (error) {
    console.error('[placeOrder] unexpected error:', error)
    return { success: false, error: 'Internal server error' }
  }
}
