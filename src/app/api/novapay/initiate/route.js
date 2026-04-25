// FILE: src/app/api/novapay/initiate/route.js
// Initiates a NovaPay payment.
// 1. Validates items + amounts server-side against DB
// 2. Creates a pending transaction record
// 3. Creates a pending order
// 4. Routes to the correct processor (Paystack / Flutterwave / Stripe / Wallet)
// 5. Returns processor-specific response to client

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProcessorClient } from '@/lib/novapay/processors'
import { getProcessor } from '@/lib/novapay/processor-router'
import crypto from 'crypto'

const PLATFORM_FEE_RATE = 0.015

function generateReference() {
  return 'NPY-' + crypto.randomBytes(8).toString('hex').toUpperCase()
}

export async function POST(req) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const {
      items, amount: clientAmount, currency = 'GHS',
      payment_method, processor: clientProcessor, region,
      momo_number, vendor_id, delivery_method,
      delivery_address, delivery_fee = 0, coupon_discount = 0,
    } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // ── 1. Validate items + compute authoritative total ──────
    const productIds = items.map(i => i.product_id)
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, price, currency, stock, vendor_id')
      .in('id', productIds)
      .eq('is_active', true)

    if (!dbProducts?.length) {
      return NextResponse.json({ error: 'Products not found or unavailable' }, { status: 400 })
    }

    const subtotal = dbProducts.reduce((sum, p) => {
      const item = items.find(i => i.product_id === p.id)
      return sum + p.price * (item?.qty ?? 1)
    }, 0)

    const totalAmount  = subtotal + delivery_fee - coupon_discount
    const platformFee  = Math.round(totalAmount * PLATFORM_FEE_RATE)
    const vendorNet    = totalAmount - platformFee

    // ── 2. Rate limit check ──────────────────────────────────
    const windowStart = new Date()
    windowStart.setMinutes(0, 0, 0)

    const { data: rateLimit } = await supabase
      .from('novapay_rate_limits')
      .select('count')
      .eq('user_id', user.id)
      .eq('event_type', 'payment_attempt')
      .gte('window_start', windowStart.toISOString())
      .single()

    if (rateLimit && rateLimit.count >= 20) {
      return NextResponse.json({ error: 'Too many payment attempts. Please wait before retrying.' }, { status: 429 })
    }

    // Increment rate limit
    await supabase.from('novapay_rate_limits').upsert({
      user_id:      user.id,
      event_type:   'payment_attempt',
      window_start: windowStart.toISOString(),
      count:        (rateLimit?.count ?? 0) + 1,
    }, { onConflict: 'user_id,event_type,window_start' })

    // ── 3. Determine processor ───────────────────────────────
    const primaryVendorId  = vendor_id ?? dbProducts[0]?.vendor_id
    const { processor }    = getProcessor(payment_method, currency)

    // ── 4. Create order ──────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id:         user.id,
        vendor_id:        primaryVendorId,
        status:           'pending',
        escrow_stage:     'payment_secured',
        subtotal,
        shipping_fee:     delivery_fee,
        discount_amount:  coupon_discount,
        total_amount:     totalAmount,
        currency,
        delivery_method,
        delivery_address,
        payment_status:   'pending',
      })
      .select('id, order_number')
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Insert order items
    await supabase.from('order_items').insert(
      items.map(item => ({
        order_id:      order.id,
        product_id:    item.product_id,
        variant_label: item.variant_label ?? '',
        quantity:      item.qty,
        unit_price:    dbProducts.find(p => p.id === item.product_id)?.price ?? item.price,
      }))
    )

    const reference = generateReference()

    // ── 5. Create pending transaction ────────────────────────
    await supabase.from('novapay_transactions').insert({
      user_id:        user.id,
      vendor_id:      primaryVendorId,
      order_id:       order.id,
      tx_type:        'payment',
      status:         'pending',
      reference,
      amount:         totalAmount,
      currency,
      payment_method,
      region,
      processor,
      description:    `Order ${order.order_number}`,
    })

    // ── 6. Wallet payment — handle inline ────────────────────
    if (processor === 'wallet') {
      try {
        await supabase.rpc('novapay_wallet_payment', {
          p_order_id:  order.id,
          p_buyer_id:  user.id,
          p_vendor_id: primaryVendorId,
          p_amount:    totalAmount,
          p_currency:  currency,
        })

        return NextResponse.json({
          success:   true,
          reference,
          order_id:  order.id,
          processor: 'wallet',
        })
      } catch (walletErr) {
        // Clean up order
        await supabase.from('orders').delete().eq('id', order.id)
        return NextResponse.json({ error: walletErr.message }, { status: 400 })
      }
    }

    // ── 7. External processor ────────────────────────────────
    const client         = getProcessorClient(processor)
    const callbackUrl    = `${process.env.NEXT_PUBLIC_APP_URL}/api/novapay/callback?reference=${reference}`

    let processorResult
    try {
      if (processor === 'stripe') {
        // Fetch vendor Stripe account
        const { data: vendor } = await supabase
          .from('vendors')
          .select('stripe_account_id')
          .eq('id', primaryVendorId)
          .single()

        processorResult = await client.initiate({
          amount:                totalAmount,
          currency,
          email:                 user.email,
          reference,
          callbackUrl,
          vendorStripeAccountId: vendor?.stripe_account_id,
          metadata: { order_id: order.id, buyer_id: user.id },
        })
      } else {
        // Paystack or Flutterwave
        processorResult = await client.initiate({
          email:         user.email,
          amount:        totalAmount,
          currency,
          reference,
          callbackUrl,
          paymentMethod: payment_method,
          momoNumber:    momo_number,
          customerName:  user.user_metadata?.full_name ?? '',
          metadata: { order_id: order.id, buyer_id: user.id, vendor_id: primaryVendorId },
        })
      }
    } catch (processorErr) {
      // Clean up
      await supabase.from('orders').delete().eq('id', order.id)
      await supabase
        .from('novapay_transactions')
        .update({ status: 'failed', failure_reason: processorErr.message })
        .eq('reference', reference)
      return NextResponse.json({ error: processorErr.message }, { status: 502 })
    }

    // Log processor interaction
    await supabase.from('novapay_processor_logs').insert({
      processor,
      event_type:    'initiate',
      direction:     'outbound',
      payload:       processorResult,
      status_code:   200,
    })

    return NextResponse.json({
      success:           true,
      reference,
      order_id:          order.id,
      processor,
      // Stripe fields
      client_secret:     processorResult.client_secret     ?? null,
      payment_intent_id: processorResult.payment_intent_id ?? null,
      // Paystack/Flutterwave redirect
      authorization_url: processorResult.authorization_url ?? null,
      access_code:       processorResult.access_code       ?? null,
    })

  } catch (err) {
    console.error('[novapay/initiate]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}