'use client'
// FILE: src/hooks/useVendorBalance.js
// Vendor balance hook: escrowed, available, payouts, realtime updates.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export function useVendorBalance() {
  const [balance,     setBalance]     = useState(null)
  const [payouts,     setPayouts]     = useState([])
  const [escrows,     setEscrows]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [error,       setError]       = useState(null)

  const { user }  = useAuthStore()
  const supabase  = createClient()

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }

    // Get vendor id for this user
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) { setLoading(false); return }

    const [balRes, payoutRes, escrowRes] = await Promise.all([
      supabase
        .from('novapay_vendor_balances')
        .select('*')
        .eq('vendor_id', vendor.id)
        .single(),

      supabase
        .from('novapay_payouts')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('requested_at', { ascending: false })
        .limit(20),

      supabase
        .from('novapay_escrow')
        .select('*, order:orders(order_number, status, created_at)')
        .eq('vendor_id', vendor.id)
        .eq('status', 'holding')
        .order('held_at', { ascending: false })
        .limit(20),
    ])

    if (balRes.data)    setBalance(balRes.data)
    if (payoutRes.data) setPayouts(payoutRes.data)
    if (escrowRes.data) setEscrows(escrowRes.data)
    setLoading(false)
  }, [user?.id])

  // Realtime
  useEffect(() => {
    fetchAll()
    if (!user) return

    const channel = supabase
      .channel(`vendor-balance-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'novapay_vendor_balances',
      }, fetchAll)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'novapay_payouts',
      }, fetchAll)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'novapay_escrow',
      }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  // Request payout
  const requestPayout = useCallback(async ({
    amount, payoutMethod, destinationName, destinationAccount, destinationNetwork,
  }) => {
    setPayoutLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/novapay/payout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          payout_method:        payoutMethod,
          destination_name:     destinationName,
          destination_account:  destinationAccount,
          destination_network:  destinationNetwork,
        }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        throw new Error(msg ?? 'Payout request failed')
      }
      await fetchAll()
      return await res.json()
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setPayoutLoading(false)
    }
  }, [fetchAll])

  return {
    balance,
    availableBalance:  balance?.available_balance  ?? 0,
    escrowedBalance:   balance?.escrowed_balance   ?? 0,
    pendingPayout:     balance?.pending_payout      ?? 0,
    lifetimeEarned:    balance?.lifetime_earned     ?? 0,
    lifetimeWithdrawn: balance?.lifetime_withdrawn  ?? 0,
    currency:          balance?.currency            ?? 'GHS',
    payouts,
    escrows,
    loading,
    payoutLoading,
    error,
    requestPayout,
    refetch: fetchAll,
  }
}