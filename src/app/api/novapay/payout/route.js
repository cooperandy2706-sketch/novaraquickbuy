// =================================================================
// NOVAPAY — Standalone API Routes
// These are the individual Next.js route handlers.
// Each section = one file. File path is in the comment above it.
// =================================================================


// =================================================================
// FILE: src/app/api/novapay/payout/route.js
// Vendor requests payout of available balance.
// =================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const {
      amount,
      payout_method       = 'momo',
      destination_name,
      destination_account,
      destination_network,
    } = await req.json()

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum payout is 1 GHS' }, { status: 400 })
    }
    if (!destination_name || !destination_account) {
      return NextResponse.json({ error: 'Destination details required' }, { status: 400 })
    }

    // Get vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })

    // Check available balance
    const { data: balance } = await supabase
      .from('novapay_vendor_balances')
      .select('available_balance, currency')
      .eq('vendor_id', vendor.id)
      .single()

    if (!balance || balance.available_balance < amount) {
      return NextResponse.json({
        error: `Insufficient available balance. Available: ${balance?.available_balance ?? 0}`,
      }, { status: 400 })
    }

    // Create payout — trigger reserve_payout_balance deducts from available
    const { data: payout, error: payoutErr } = await supabase
      .from('novapay_payouts')
      .insert({
        vendor_id:            vendor.id,
        amount,
        currency:             balance.currency,
        status:               'requested',
        payout_method,
        destination_name,
        destination_account,
        destination_network,
      })
      .select('id, payout_number')
      .single()

    if (payoutErr) return NextResponse.json({ error: payoutErr.message }, { status: 400 })

    return NextResponse.json({
      success:       true,
      payout_id:     payout.id,
      payout_number: payout.payout_number,
    })
  } catch (err) {
    console.error('[novapay/payout]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


// =================================================================
// FILE: src/app/api/novapay/wallet/topup/route.js
// Buyer tops up NovaPay wallet via external processor.
// =================================================================

export async function POST_topup(req) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { amount, currency = 'GHS', payment_method, momo_number } = await req.json()

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum topup is 1 GHS (100 pesewas)' }, { status: 400 })
    }

    const { getProcessor } = await import('@/lib/novapay/processor-router')
    const { getProcessorClient } = await import('@/lib/novapay/processors')
    const { default: crypto } = await import('crypto')

    const { processor, region } = getProcessor(payment_method, currency)
    const reference  = 'TUP-' + crypto.randomBytes(8).toString('hex').toUpperCase()
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/novapay/wallet/topup/callback?ref=${reference}`

    // Create topup session record
    await supabase.from('novapay_topup_sessions').insert({
      user_id:        user.id,
      reference,
      amount,
      currency,
      payment_method,
      processor,
      status: 'pending',
    })

    // Record pending transaction
    await supabase.from('novapay_transactions').insert({
      user_id:        user.id,
      tx_type:        'wallet_topup',
      status:         'pending',
      reference,
      amount,
      currency,
      payment_method,
      processor,
      region,
      description:    'NovaPay wallet topup',
    })

    // Initiate with processor
    const client = getProcessorClient(processor)
    const result = await client.initiate({
      email:         user.email,
      amount,
      currency,
      reference,
      callbackUrl,
      paymentMethod: payment_method,
      momoNumber:    momo_number,
      metadata:      { topup: true, user_id: user.id },
    })

    return NextResponse.json({
      success:           true,
      reference,
      processor,
      authorization_url: result.authorization_url ?? null,
      client_secret:     result.client_secret      ?? null,
    })
  } catch (err) {
    console.error('[wallet/topup]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


// =================================================================
// FILE: src/app/api/novapay/wallet/topup/callback/route.js
// Handles redirect callback from Paystack/Flutterwave after topup.
// Verifies payment, credits wallet, redirects to wallet page.
// =================================================================

export async function GET_topupCallback(req) {
  const url       = new URL(req.url)
  const reference = url.searchParams.get('ref') ?? url.searchParams.get('reference')
  const trxref    = url.searchParams.get('trxref')

  const supabase = createClient()

  try {
    if (!reference) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?topup=error`)
    }

    // Fetch session
    const { data: session } = await supabase
      .from('novapay_topup_sessions')
      .select('*')
      .eq('reference', reference)
      .single()

    if (!session || session.status === 'completed') {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?topup=${session?.status ?? 'error'}`)
    }

    // Verify with processor
    const { getProcessorClient } = await import('@/lib/novapay/processors')
    const client = getProcessorClient(session.processor)
    const verification = await client.verify(trxref ?? reference)

    if (!verification.success) {
      await supabase
        .from('novapay_topup_sessions')
        .update({ status: 'failed' })
        .eq('reference', reference)
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?topup=failed`)
    }

    // Credit wallet
    await supabase.rpc('increment_wallet_balance', {
      p_user_id:  session.user_id,
      p_amount:   session.amount,
      p_currency: session.currency,
    })

    // Mark session completed
    await supabase
      .from('novapay_topup_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('reference', reference)

    // Mark transaction completed
    await supabase
      .from('novapay_transactions')
      .update({
        status:        'completed',
        processor_ref: verification.processor_charge_id,
      })
      .eq('reference', reference)

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?topup=success&amount=${session.amount}`)
  } catch (err) {
    console.error('[wallet/topup/callback]', err)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?topup=error`)
  }
}


// =================================================================
// FILE: src/app/api/novapay/poll/route.js
// MoMo polling endpoint — checks if a pending payment succeeded.
// Called every 5s by useNovaPay hook until success/failed/timeout.
// =================================================================

export async function GET_poll(req) {
  const url       = new URL(req.url)
  const reference = url.searchParams.get('reference')

  if (!reference) return NextResponse.json({ status: 'not_found' })

  const supabase = createClient()

  const { data: tx } = await supabase
    .from('novapay_transactions')
    .select('status, processor, processor_ref, reference')
    .eq('reference', reference)
    .single()

  if (!tx) return NextResponse.json({ status: 'not_found' })
  if (tx.status === 'completed') return NextResponse.json({ status: 'success' })
  if (tx.status === 'failed')    return NextResponse.json({ status: 'failed' })

  // Optionally check Paystack directly for real-time status
  if (tx.status === 'pending' && tx.processor === 'paystack') {
    try {
      const { paystackClient } = await import('@/lib/novapay/processors')
      const verification = await paystackClient.verify(tx.processor_ref ?? reference)
      if (verification.success) {
        return NextResponse.json({ status: 'success' })
      }
      if (verification.raw?.status === 'failed' || verification.raw?.status === 'abandoned') {
        return NextResponse.json({ status: 'failed' })
      }
    } catch {}
  }

  return NextResponse.json({ status: 'pending' })
}


// =================================================================
// FILE: src/app/api/novapay/callback/route.js
// Handles redirect callback from Paystack/Flutterwave after order payment.
// Redirects to /orders/[id] with status.
// =================================================================

export async function GET_callback(req) {
  const url       = new URL(req.url)
  const reference = url.searchParams.get('reference') ?? url.searchParams.get('ref')
  const trxref    = url.searchParams.get('trxref')
  const status    = url.searchParams.get('status')

  if (!reference) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=error`)
  }

  const supabase = createClient()

  // Find transaction + order
  const { data: tx } = await supabase
    .from('novapay_transactions')
    .select('order_id, processor, status')
    .eq('reference', reference)
    .single()

  if (!tx || !tx.order_id) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/orders?payment=error`)
  }

  // If already completed (webhook fired first), redirect directly
  if (tx.status === 'completed') {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/orders/${tx.order_id}?payment=success`
    )
  }

  // Verify with processor (callback fires after payment)
  try {
    const { getProcessorClient } = await import('@/lib/novapay/processors')
    const client = getProcessorClient(tx.processor)
    const verification = await client.verify(trxref ?? reference)

    if (verification.success) {
      // Trigger verify endpoint internally
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/novapay/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, order_id: tx.order_id }),
      })

      return Response.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/orders/${tx.order_id}?payment=success`
      )
    }
  } catch (err) {
    console.error('[novapay/callback]', err)
  }

  return Response.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/orders/${tx.order_id}?payment=pending`
  )
}