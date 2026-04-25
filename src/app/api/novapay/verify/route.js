// FILE: src/app/api/novapay/verify/route.js
// Verifies a payment with the processor and finalises the order.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProcessorClient } from '@/lib/novapay/processors'

const PLATFORM_FEE_RATE = 0.015

export async function POST(req) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { reference, order_id, processor_ref } = await req.json()
    if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })

    // Fetch pending transaction
    const { data: tx } = await supabase
      .from('novapay_transactions')
      .select('*')
      .eq('reference', reference)
      .single()

    if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    if (tx.status === 'success') {
      return NextResponse.json({ success: true, transaction: tx, already_completed: true })
    }

    // Verify with processor
    const client = getProcessorClient(tx.processor)
    const lookupRef = processor_ref ?? tx.processor_ref ?? reference

    let verification
    try {
      verification = await client.verify(lookupRef)
    } catch (err) {
      return NextResponse.json({ error: `Verification failed: ${err.message}` }, { status: 502 })
    }

    if (!verification.success) {
      await supabase
        .from('novapay_transactions')
        .update({ status: 'failed', failure_reason: 'Processor verification returned unsuccessful' })
        .eq('id', tx.id)

      await supabase
        .from('orders')
        .update({ status: 'cancelled', payment_status: 'failed' })
        .eq('id', order_id ?? tx.order_id)

      return NextResponse.json({ error: 'Payment was not successful' }, { status: 400 })
    }

    const ordId        = order_id ?? tx.order_id
    const platformFee  = Math.round(tx.amount * PLATFORM_FEE_RATE)
    const vendorNet    = tx.amount - platformFee

    // Mark transaction completed
    await supabase
      .from('novapay_transactions')
      .update({
        status:         'success',
        processor_ref:  verification.processor_charge_id ?? lookupRef,
        processor_data: verification.raw,
      })
      .eq('id', tx.id)

    // Update order
    await supabase
      .from('orders')
      .update({
        escrow_stage:     'payment_secured',
        payment_status:   'succeeded',
      })
      .eq('id', ordId)

    // Create escrow hold
    await supabase.from('novapay_escrow').upsert({
      order_id:       ordId,
      buyer_id:       user.id,
      vendor_id:      tx.vendor_id,
      amount:         tx.amount,
      currency:       tx.currency,
      status:         'holding',
    }, { onConflict: 'order_id' })

    // Credit vendor escrowed balance
    await supabase.from('novapay_vendor_balances').upsert({
      vendor_id:        tx.vendor_id,
      currency:         tx.currency,
      escrowed_balance: vendorNet,
    }, {
      onConflict: 'vendor_id',
      ignoreDuplicates: false,
    })

    // Increment escrowed_balance (supabase doesn't support atomic increments via upsert easily)
    await supabase.rpc('increment_vendor_escrowed', {
      p_vendor_id: tx.vendor_id,
      p_amount:    vendorNet,
    }).maybeSingle()

    // Record platform revenue
    await supabase.from('novapay_platform_revenue').insert({
      transaction_id: tx.id,
      order_id:       ordId,
      vendor_id:      tx.vendor_id,
      gross_amount:   tx.amount,
      fee_amount:     platformFee,
      currency:       tx.currency,
    })

    // Timeline event
    await supabase.from('order_timeline').insert({
      order_id: ordId,
      event:    `Payment confirmed via NovaPay (${tx.processor}) — escrow active`,
      note:     JSON.stringify({ reference, processor: tx.processor, amount: tx.amount }),
    })

    // Clear cart
    await supabase.from('cart_items').delete().eq('user_id', user.id)

    return NextResponse.json({
      success:     true,
      transaction: { ...tx, status: 'success' },
      order_id:    ordId,
    })

  } catch (err) {
    console.error('[novapay/verify]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}