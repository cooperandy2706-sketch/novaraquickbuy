'use client'
// FILE: src/hooks/useNovaPay.js
// Main NovaPay hook used by the checkout flow.
// Handles: payment initiation, MoMo polling, Stripe Elements, wallet payments.

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { getProcessor, isMoMoMethod, isStripeMethod, isWalletMethod } from '@/lib/novapay/processor-router'

// ─────────────────────────────────────────────────────────────
// STEP MACHINE
// idle → method_selected → processing → awaiting_momo | stripe_elements → verifying → success | failed
// ─────────────────────────────────────────────────────────────

export function useNovaPay() {
  const [step,          setStep]          = useState('idle')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [reference,     setReference]     = useState(null)
  const [clientSecret,  setClientSecret]  = useState(null)  // Stripe only
  const [momoPrompt,    setMomoPrompt]    = useState(null)  // MoMo phone + network
  const [transaction,   setTransaction]   = useState(null)  // completed tx data
  const [orderId,       setOrderId]       = useState(null)

  const pollRef     = useRef(null)
  const { user }    = useAuthStore()
  const supabase    = createClient()

  // ── Clear error ────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), [])

  // ── INITIATE PAYMENT ───────────────────────────────────────
  // Calls /api/novapay/initiate → gets back reference + processor details
  const initiate = useCallback(async ({
    items,
    amount,
    currency,
    paymentMethod,
    momoNumber,
    deliveryMethod,
    deliveryAddress,
    deliveryFee,
    couponDiscount,
    vendorId,
  }) => {
    if (!user) { setError('Please sign in to pay.'); return null }
    setLoading(true)
    setError(null)

    try {
      const { processor, region } = getProcessor(paymentMethod, currency)

      const res = await fetch('/api/novapay/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          amount,
          currency,
          payment_method:   paymentMethod,
          processor,
          region,
          momo_number:      momoNumber ?? null,
          vendor_id:        vendorId,
          delivery_method:  deliveryMethod,
          delivery_address: deliveryAddress,
          delivery_fee:     deliveryFee    ?? 0,
          coupon_discount:  couponDiscount ?? 0,
        }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        throw new Error(msg ?? 'Payment initiation failed.')
      }

      const data = await res.json()
      setReference(data.reference)
      setOrderId(data.order_id)

      // ── Stripe: return client_secret for Elements ─────────
      if (isStripeMethod(paymentMethod)) {
        setClientSecret(data.client_secret)
        setStep('stripe_elements')
        return data
      }

      // ── MoMo: redirect or show prompt ─────────────────────
      if (isMoMoMethod(paymentMethod)) {
        setMomoPrompt({ phone: momoNumber, network: paymentMethod, reference: data.reference })
        setStep('awaiting_momo')
        // Start polling for MoMo confirmation
        startMoMoPoll(data.reference)
        // Some processors redirect; handle authorization_url
        if (data.authorization_url) {
          window.location.href = data.authorization_url
        }
        return data
      }

      // ── Wallet payment: instant ────────────────────────────
      if (isWalletMethod(paymentMethod)) {
        setStep('processing')
        const result = await verifyAndFinalize(data.reference, data.order_id)
        return result
      }

      // ── Bank transfer / USSD: show instructions ────────────
      setStep('processing')
      return data

    } catch (err) {
      setError(err.message)
      setStep('failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // ── CONFIRM STRIPE PAYMENT ─────────────────────────────────
  const confirmStripe = useCallback(async ({ stripe, elements }) => {
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
    setStep('processing')

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (stripeError) throw new Error(stripeError.message)

      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        await verifyAndFinalize(reference, orderId)
      } else {
        throw new Error('Payment was not completed.')
      }
    } catch (err) {
      setError(err.message)
      setStep('failed')
    } finally {
      setLoading(false)
    }
  }, [reference, orderId])

  // ── VERIFY + FINALIZE ──────────────────────────────────────
  const verifyAndFinalize = useCallback(async (ref, oid) => {
    setStep('verifying')

    const res = await fetch('/api/novapay/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: ref, order_id: oid }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({}))
      throw new Error(msg ?? 'Payment verification failed.')
    }

    const data = await res.json()
    setTransaction(data.transaction)
    setStep('success')
    return data
  }, [])

  // ── MOMO POLLING ───────────────────────────────────────────
  const startMoMoPoll = useCallback((ref) => {
    let attempts = 0
    const maxAttempts = 24  // 2 minutes at 5s intervals

    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        clearInterval(pollRef.current)
        setError('MoMo payment timed out. Please try again.')
        setStep('failed')
        return
      }

      try {
        const res = await fetch(`/api/novapay/poll?reference=${ref}`)
        if (!res.ok) return
        const { status } = await res.json()

        if (status === 'success') {
          clearInterval(pollRef.current)
          await verifyAndFinalize(ref, orderId)
        } else if (status === 'failed') {
          clearInterval(pollRef.current)
          setError('MoMo payment was declined or cancelled.')
          setStep('failed')
        }
        // 'pending' → keep polling
      } catch {}
    }, 5000)

    return () => clearInterval(pollRef.current)
  }, [orderId, verifyAndFinalize])

  // ── CANCEL ─────────────────────────────────────────────────
  const cancel = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    setStep('idle')
    setError(null)
    setReference(null)
    setClientSecret(null)
    setMomoPrompt(null)
  }, [])

  // ── RESET ──────────────────────────────────────────────────
  const reset = useCallback(() => {
    cancel()
    setTransaction(null)
    setOrderId(null)
  }, [cancel])

  return {
    // State
    step,
    loading,
    error,
    reference,
    clientSecret,
    momoPrompt,
    transaction,
    orderId,

    // Actions
    initiate,
    confirmStripe,
    cancel,
    reset,
    clearError,
    setStep,
  }
}