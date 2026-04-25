'use client'
// FILE: src/hooks/useWallet.js
// NovaPay wallet hook. Fetches balance, realtime updates, topup, history.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export function useWallet(currency = 'GHS') {
  const [wallet,       setWallet]       = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [topupLoading, setTopupLoading] = useState(false)
  const [error,        setError]        = useState(null)

  const { user }  = useAuthStore()
  const supabase  = createClient()

  // ── Fetch wallet + recent transactions ────────────────────
  const fetchWallet = useCallback(async () => {
    if (!user) { setLoading(false); return }

    const [walletRes, txRes] = await Promise.all([
      supabase
        .from('novapay_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', currency)
        .single(),

      supabase
        .from('novapay_transactions')
        .select('id, tx_type, status, reference, amount, currency, description, created_at, payment_method, processor')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    if (walletRes.data) setWallet(walletRes.data)
    if (txRes.data)     setTransactions(txRes.data)
    setLoading(false)
  }, [user?.id, currency])

  // ── Realtime subscription ─────────────────────────────────
  useEffect(() => {
    fetchWallet()
    if (!user) return

    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'novapay_wallets',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setWallet(prev => prev ? { ...prev, ...payload.new } : payload.new)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'novapay_transactions',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setTransactions(prev => [payload.new, ...prev].slice(0, 50))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, currency])

  // ── Initiate wallet topup ─────────────────────────────────
  const topup = useCallback(async ({ amount, paymentMethod, momoNumber }) => {
    if (!user) return null
    setTopupLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/novapay/wallet/topup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, payment_method: paymentMethod, momo_number: momoNumber }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        throw new Error(msg ?? 'Topup failed')
      }

      const data = await res.json()
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setTopupLoading(false)
    }
  }, [user, currency])

  return {
    wallet,
    balance:      wallet?.balance ?? 0,
    isFrozen:     wallet?.is_frozen ?? false,
    transactions,
    loading,
    topupLoading,
    error,
    topup,
    refetch:      fetchWallet,
  }
}