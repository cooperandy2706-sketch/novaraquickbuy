// FILE: src/app/api/novapay/webhooks/route.js
// Unified NovaPay webhook handler.
// Paystack sends to: /api/novapay/webhooks?processor=paystack
// Flutterwave:       /api/novapay/webhooks?processor=flutterwave
// Stripe:            /api/novapay/webhooks?processor=stripe
//
// All events are normalised into the same internal processing flow.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac }   from 'crypto'
import { stripeClient } from '@/lib/novapay/processors'

const PLATFORM_FEE_RATE = 0.015

// ─────────────────────────────────────────────────────────────
// SIGNATURE VERIFICATION
// ─────────────────────────────────────────────────────────────

function verifyPaystack(body, signature) {
  const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')
  return hash === signature
}

function verifyFlutterwave(body, signature) {
  const hash = createHmac('sha256', process.env.FLUTTERWAVE_SECRET_HASH ?? '')
    .update(body)
    .digest('hex')
  return hash === signature
}

// ─────────────────────────────────────────────────────────────
// NORMALISE EVENT
// Maps processor-specific events to internal event types.
// ─────────────────────────────────────────────────────────────

function normalisePaystackEvent(event) {
  const data = event.data ?? {}
  return {
    type:      event.event,
    reference: data.reference,
    amount:    data.amount,
    currency:  data.currency?.toUpperCase() ?? 'GHS',
    status:    data.status,
    processor_charge_id: data.id?.toString(),
    metadata:  data.metadata,
    customer:  { email: data.customer?.email },
    raw:       data,
  }
}

function normaliseFlutterwaveEvent(event) {
  const data = event.data ?? {}
  return {
    type:      event.event,
    reference: data.tx_ref,
    amount:    data.amount,
    currency:  data.currency?.toUpperCase(),
    status:    data.status,
    processor_charge_id: data.id?.toString(),
    metadata:  data.meta,
    customer:  { email: data.customer?.email },
    raw:       data,
  }
}

function normaliseStripeEvent(event) {
  const obj = event.data?.object ?? {}
  return {
    type:      event.type,
    reference: obj.metadata?.novapay_ref,
    amount:    obj.amount,
    currency:  obj.currency?.toUpperCase(),
    status:    obj.status,
    processor_charge_id: obj.latest_charge ?? obj.id,
    metadata:  obj.metadata,
    customer:  { email: obj.receipt_email },
    raw:       obj,
  }
}

// ─────────────────────────────────────────────────────────────
// CORE: HANDLE SUCCESSFUL PAYMENT
// ─────────────────────────────────────────────────────────────

async function handlePaymentSuccess(supabase, { reference, amount, currency, processor_charge_id, metadata, processor }) {
  // Find transaction by reference
  const { data: tx } = await supabase
    .from('novapay_transactions')
    .select('*')
    .eq('reference', reference)
    .maybeSingle()

  if (!tx) {
    console.warn(`[webhook] No transaction found for reference: ${reference}`)
    return
  }

  if (tx.status === 'success') {
    console.log(`[webhook] Transaction ${reference} already completed, skipping`)
    return
  }

  const platformFee = tx.platform_fee ?? Math.round(amount * PLATFORM_FEE_RATE)
  const vendorNet   = amount - platformFee

  await supabase
    .from('novapay_transactions')
    .update({
      status:         'success',
      processor_ref:  processor_charge_id ?? reference,
      processor_data: { processor_charge_id, metadata },
    })
    .eq('id', tx.id)

  // Update order
  const ordId = tx.order_id
  if (ordId) {
    await supabase
      .from('orders')
      .update({
        escrow_stage:     'payment_secured',
        payment_status:   'succeeded',
      })
      .eq('id', ordId)

    // Create escrow
    const { error: escrowErr } = await supabase
      .from('novapay_escrow')
      .upsert({
        order_id:       ordId,
        buyer_id:       tx.user_id,
        vendor_id:      tx.vendor_id,
        amount:         amount,
        currency:       currency ?? tx.currency,
        status:         'holding',
      }, { onConflict: 'order_id' })

    if (!escrowErr) {
      // Credit vendor escrowed balance
      const { data: existing } = await supabase
        .from('novapay_vendor_balances')
        .select('escrowed_balance')
        .eq('vendor_id', tx.vendor_id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('novapay_vendor_balances')
          .update({ escrowed_balance: existing.escrowed_balance + vendorNet })
          .eq('vendor_id', tx.vendor_id)
      } else {
        await supabase.from('novapay_vendor_balances').insert({
          vendor_id:        tx.vendor_id,
          currency:         currency ?? tx.currency,
          escrowed_balance: vendorNet,
        })
      }
    }

    // Record platform revenue
    await supabase.from('novapay_platform_revenue').upsert({
      transaction_id: tx.id,
      order_id:       ordId,
      vendor_id:      tx.vendor_id,
      gross_amount:   amount,
      fee_amount:     platformFee,
      currency:       currency ?? tx.currency,
    }, { onConflict: 'transaction_id' })

    await supabase.from('order_timeline').insert({
      order_id: ordId,
      event:    `Payment confirmed via NovaPay — escrow secured (${processor ?? tx.processor})`,
    })

    // Clear cart
    if (tx.user_id) {
      await supabase.from('cart_items').delete().eq('user_id', tx.user_id)
    }
  }

  console.log(`[webhook] Payment success: ${reference}, amount: ${amount}, processor: ${processor}`)
}

async function handlePaymentFailed(supabase, { reference, processor }) {
  await supabase
    .from('novapay_transactions')
    .update({ status: 'failed', failure_reason: 'Processor webhook: payment failed' })
    .eq('reference', reference)

  const { data: tx } = await supabase
    .from('novapay_transactions')
    .select('order_id')
    .eq('reference', reference)
    .maybeSingle()

  if (tx?.order_id) {
    await supabase
      .from('orders')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('id', tx.order_id)
  }
}

// ─────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────

export async function POST(req) {
  const url        = new URL(req.url)
  const processor  = url.searchParams.get('processor') ?? 'stripe'
  const bodyText   = await req.text()
  const supabase   = createClient()

  // ── Signature verification ───────────────────────────────
  try {
    if (processor === 'paystack') {
      const sig = req.headers.get('x-paystack-signature') ?? ''
      if (!verifyPaystack(bodyText, sig)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else if (processor === 'flutterwave') {
      const sig = req.headers.get('verif-hash') ?? ''
      if (sig !== process.env.FLUTTERWAVE_SECRET_HASH) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else if (processor === 'stripe') {
      const sig = req.headers.get('stripe-signature') ?? ''
      stripeClient.constructWebhookEvent(bodyText, sig)  // throws if invalid
    }
  } catch (err) {
    console.error(`[webhook] ${processor} signature verification failed:`, err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(bodyText)

  // Log raw event
  await supabase.from('novapay_processor_logs').insert({
    processor,
    event_type:    event.event ?? event.type ?? 'unknown',
    direction:     'inbound',
    payload:       event,
    status_code:   200,
  })

  // ── Paystack events ──────────────────────────────────────
  if (processor === 'paystack') {
    const normalised = normalisePaystackEvent(event)
    if (event.event === 'charge.success') {
      await handlePaymentSuccess(supabase, { ...normalised, processor: 'paystack' })
    } else if (event.event === 'charge.failed') {
      await handlePaymentFailed(supabase, { reference: normalised.reference, processor: 'paystack' })
    } else if (event.event === 'transfer.success') {
      // Vendor payout completed
      const ref = event.data?.reference
      if (ref) {
        await supabase
          .from('novapay_payouts')
          .update({ status: 'paid', processed_at: new Date().toISOString(), processor_transfer_id: event.data?.transfer_code })
          .eq('payout_number', ref)
      }
    } else if (event.event === 'transfer.failed') {
      const ref = event.data?.reference
      if (ref) {
        await supabase
          .from('novapay_payouts')
          .update({ status: 'failed', failure_reason: event.data?.reason ?? 'Transfer failed' })
          .eq('payout_number', ref)
      }
    }
  }

  // ── Flutterwave events ───────────────────────────────────
  if (processor === 'flutterwave') {
    const normalised = normaliseFlutterwaveEvent(event)
    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      await handlePaymentSuccess(supabase, { ...normalised, processor: 'flutterwave' })
    } else if (event.event === 'charge.completed' && event.data?.status === 'failed') {
      await handlePaymentFailed(supabase, { reference: normalised.reference, processor: 'flutterwave' })
    } else if (event.event === 'transfer.completed') {
      await supabase
        .from('novapay_payouts')
        .update({ status: 'paid', processed_at: new Date().toISOString() })
        .eq('payout_number', event.data?.reference)
    }
  }

  // ── Stripe events ────────────────────────────────────────
  if (processor === 'stripe') {
    const normalised = normaliseStripeEvent(event)
    if (event.type === 'payment_intent.succeeded') {
      await handlePaymentSuccess(supabase, { ...normalised, processor: 'stripe' })
    } else if (event.type === 'payment_intent.payment_failed') {
      await handlePaymentFailed(supabase, { reference: normalised.reference, processor: 'stripe' })
    } else if (event.type === 'charge.dispute.created') {
      const ref = event.data?.object?.metadata?.novapay_ref
      if (ref) {
        const { data: tx } = await supabase
          .from('novapay_transactions')
          .select('order_id')
          .eq('reference', ref)
          .maybeSingle()
        if (tx?.order_id) {
          await supabase
            .from('orders')
            .update({ status: 'disputed', escrow_stage: 'disputed' })
            .eq('id', tx.order_id)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}