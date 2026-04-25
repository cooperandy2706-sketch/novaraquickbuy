// =================================================================
// NOVAPAY — Admin API Routes
// All routes require admin role. Checked via Supabase RLS + middleware.
// =================================================================


// =================================================================
// FILE: src/app/api/novapay/admin/payouts/[action]/route.js
// Admin payout management: approve, reject, mark-paid.
// =================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user : null
}

// GET /api/novapay/admin/payouts?status=requested
export async function GET_adminPayouts(req) {
  const supabase = createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url    = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'requested'

  const { data, error } = await supabase
    .from('v_novapay_pending_payouts')
    .select('*')
    .order('requested_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payouts: data })
}

// POST /api/novapay/admin/payouts/approve
export async function POST_approvePayout(req) {
  const supabase = createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { payout_id, admin_note } = await req.json()

  const { data, error } = await supabase.rpc('novapay_admin_approve_payout', {
    p_payout_id:  payout_id,
    p_admin_id:   admin.id,
    p_admin_note: admin_note ?? null,
  })

  if (error || !data?.success) {
    return NextResponse.json({ error: data?.error ?? error?.message }, { status: 400 })
  }

  // If vendor has Paystack/Flutterwave configured, initiate transfer immediately
  const { data: payout } = await supabase
    .from('novapay_payouts')
    .select('*, vendor:vendors(id, store_name)')
    .eq('id', payout_id)
    .single()

  if (payout?.payout_method === 'momo') {
    try {
      const { paystackClient } = await import('@/lib/novapay/processors')

      // Create transfer recipient
      const networkBankCodes = {
        mtn:        'MTN',
        vodafone:   'VOD',
        airteltigo: 'ATL',
      }

      const recipient = await paystackClient.createRecipient({
        type:          'mobile_money',
        name:          payout.destination_name,
        accountNumber: payout.destination_account.replace('+233', '0'),
        bankCode:      networkBankCodes[payout.destination_network] ?? 'MTN',
        currency:      payout.currency,
      })

      const transfer = await paystackClient.transfer({
        amount:         payout.amount,
        currency:       payout.currency,
        recipientCode:  recipient.recipient_code,
        reason:         `Novara payout ${payout.payout_number}`,
        reference:      payout.payout_number,
      })

      // Mark as processing
      await supabase
        .from('novapay_payouts')
        .update({
          status:                'processing',
          processor:             'paystack',
          processor_transfer_id: transfer.transfer_id,
          processed_at:          new Date().toISOString(),
        })
        .eq('id', payout_id)

    } catch (transferErr) {
      console.error('[admin/payout/approve] Transfer failed:', transferErr.message)
      // Mark approved but failed to process — admin must retry
      await supabase
        .from('novapay_payouts')
        .update({ status: 'approved', processor_response: { error: transferErr.message } })
        .eq('id', payout_id)
    }
  }

  return NextResponse.json({ success: true })
}

// POST /api/novapay/admin/payouts/reject
export async function POST_rejectPayout(req) {
  const supabase = createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { payout_id, reason } = await req.json()

  await supabase
    .from('novapay_payouts')
    .update({
      status:     'rejected',
      admin_note: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payout_id)
    .in('status', ['requested', 'approved'])

  return NextResponse.json({ success: true })
}

// POST /api/novapay/admin/payouts/mark-paid
export async function POST_markPaid(req) {
  const supabase = createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { payout_id, bank_reference } = await req.json()

  await supabase
    .from('novapay_payouts')
    .update({
      status:          'paid',
      bank_reference,
      processed_at:    new Date().toISOString(),
    })
    .eq('id', payout_id)

  return NextResponse.json({ success: true })
}


// =================================================================
// FILE: src/app/api/novapay/admin/disputes/route.js
// Admin dispute management.
// =================================================================

// GET disputes queue
export async function GET_adminDisputes(req) {
  const supabase = createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabase
    .from('v_novapay_open_disputes')
    .select('*')
    .order('created_at', { ascending: true })

  return NextResponse.json({ disputes: data ?? [] })
}

// POST resolve dispute
export async function POST_resolveDispute(req) {
  const supabase = createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { dispute_id, resolution, resolution_note, refund_amount } = await req.json()

  const { data, error } = await supabase.rpc('novapay_admin_resolve_dispute', {
    p_dispute_id:      dispute_id,
    p_admin_id:        admin.id,
    p_resolution:      resolution,
    p_resolution_note: resolution_note,
    p_refund_amount:   refund_amount ?? null,
  })

  if (error || !data?.success) {
    return NextResponse.json({ error: data?.error ?? error?.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}


// =================================================================
// FILE: src/app/api/novapay/admin/adjust/route.js
// Manual admin balance adjustment (credit/debit buyer wallet or vendor balance).
// =================================================================

export async function POST_adminAdjust(req) {
  const supabase = createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const {
    target_type, target_id, user_id, vendor_id,
    adjustment_type, amount, currency = 'GHS',
    reason, internal_note,
  } = await req.json()

  if (!target_type || !amount || !reason) {
    return NextResponse.json({ error: 'target_type, amount, reason required' }, { status: 400 })
  }

  let balance_before = null
  let balance_after  = null

  // Apply adjustment
  if (target_type === 'buyer_wallet') {
    const { data: wallet } = await supabase
      .from('novapay_wallets')
      .select('balance')
      .eq('user_id', user_id)
      .eq('currency', currency)
      .single()

    balance_before = wallet?.balance ?? 0

    if (adjustment_type === 'credit') {
      await supabase.rpc('increment_wallet_balance', {
        p_user_id:  user_id,
        p_amount:   amount,
        p_currency: currency,
      })
      balance_after = balance_before + amount
    } else {
      await supabase
        .from('novapay_wallets')
        .update({ balance: Math.max(0, balance_before - amount) })
        .eq('user_id', user_id)
        .eq('currency', currency)
      balance_after = Math.max(0, balance_before - amount)
    }

    // Transaction logging is handled by novapay_admin_adjustments below

  } else if (target_type === 'vendor_balance') {
    const { data: bal } = await supabase
      .from('novapay_vendor_balances')
      .select('available_balance')
      .eq('vendor_id', vendor_id)
      .single()

    balance_before = bal?.available_balance ?? 0

    if (adjustment_type === 'credit') {
      await supabase
        .from('novapay_vendor_balances')
        .update({ available_balance: balance_before + amount })
        .eq('vendor_id', vendor_id)
      balance_after = balance_before + amount
    } else {
      await supabase
        .from('novapay_vendor_balances')
        .update({ available_balance: Math.max(0, balance_before - amount) })
        .eq('vendor_id', vendor_id)
      balance_after = Math.max(0, balance_before - amount)
    }
  }

  // Log adjustment
  await supabase.from('novapay_admin_adjustments').insert({
    admin_id:        admin.id,
    target_type,
    target_id,
    user_id:         user_id   ?? null,
    vendor_id:       vendor_id ?? null,
    direction:       adjustment_type,
    adjustment_type,
    amount,
    currency,
    reason,
    internal_note,
    balance_before,
    balance_after,
  })

  return NextResponse.json({ success: true, balance_before, balance_after })
}


// =================================================================
// FILE: src/app/api/novapay/admin/kpis/route.js
// Platform KPI data for admin dashboard.
// =================================================================

export async function GET_adminKpis(req) {
  const supabase = createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url      = new URL(req.url)
  const period   = url.searchParams.get('period') ?? '30d'

  const periodMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
  const days      = periodMap[period] ?? 30
  const since     = new Date(Date.now() - days * 86400 * 1000).toISOString()

  const [kpisRes, dailyRes, processorRes, pendingPayoutsRes, openDisputesRes] = await Promise.all([
    supabase.from('v_novapay_platform_kpis').select('*').single(),
    supabase
      .from('v_novapay_daily_revenue')
      .select('*')
      .gte('day', since.split('T')[0])
      .order('day', { ascending: true }),
    supabase.from('v_novapay_processor_breakdown').select('*'),
    supabase
      .from('novapay_payouts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'requested'),
    supabase
      .from('novapay_disputes')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open','under_review','escalated']),
  ])

  return NextResponse.json({
    kpis:            kpisRes.data,
    daily_revenue:   dailyRes.data   ?? [],
    by_processor:    processorRes.data ?? [],
    pending_payouts: pendingPayoutsRes.count ?? 0,
    open_disputes:   openDisputesRes.count   ?? 0,
  })
}