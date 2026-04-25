'use client'
// FILE: src/hooks/useOrders.js
// Realtime orders hook for the customer orders page.
// Fetches all orders for the logged-in buyer and subscribes
// to live changes via Supabase postgres_changes.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

// ─────────────────────────────────────────────────────────────
// SHAPE MAPPER  raw DB row → clean UI object
// ─────────────────────────────────────────────────────────────
function mapOrder(o) {
  return {
    id:                  o.id,
    order_number:        o.order_number ?? `NQ-${o.id.slice(-5).toUpperCase()}`,
    status:              o.status,
    escrow_stage:        o.escrow_stage        ?? 'payment_secured',
    total_amount:        o.total_amount        ?? 0,
    currency:            o.currency            ?? 'GHS',
    tracking_number:     o.tracking_number     ?? null,
    delivery_method:     o.delivery_method     ?? 'courier_shipping',
    estimated_delivery:  o.estimated_delivery  ?? null,
    dispute_window_ends: o.dispute_window_ends ?? null,
    otp_code:            o.otp_code            ?? null,
    created_at:          o.created_at,
    address:             o.delivery_address    ?? null,
    vendor: {
      id:            o.vendor?.id            ?? '',
      store_name:    o.vendor?.store_name    ?? 'Unknown Vendor',
      initial:       (o.vendor?.store_name   ?? 'V')[0].toUpperCase(),
      avatar_url:    o.vendor?.avatar_url    ?? null,
      avatar_color:  '#16A34A',
      trust_score:   o.vendor?.trust_score   ?? 0,
      badges:        o.vendor?.badges        ?? [],
      response_time: o.vendor?.response_time ?? null,
    },
    items: (o.order_items ?? []).map(item => ({
      id:        item.id,
      name:      item.product?.name      ?? 'Product',
      variant:   item.variant_label      ?? '',
      qty:       item.quantity           ?? 1,
      price:     item.unit_price         ?? 0,
      image_url: item.product?.images?.[0] ?? null,
      color:     '#64748b',
    })),
    timeline: (o.order_timeline ?? []).map(t => ({
      event: t.event,
      at:    t.created_at,
      done:  true,
    })),
  }
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────
export function useOrders() {
  const [orders,    setOrders]  = useState([])
  const [loading,   setLoading] = useState(true)
  const [liveToast, setToast]   = useState(null)   // { text, key }

  const { user } = useAuthStore()
  const supabase  = createClient()

  // Flash a floating toast for 4.5 seconds
  const flash = useCallback((text) => {
    const key = Date.now()
    setToast({ text, key })
    setTimeout(() => setToast(t => t?.key === key ? null : t), 4500)
  }, [])

  // Full fetch (used on mount + INSERT events)
  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        escrow_stage,
        total_amount,
        currency,
        tracking_number,
        delivery_method,
        estimated_delivery,
        dispute_window_ends,
        otp_code,
        created_at,
        delivery_address,
        vendor:vendors (
          id,
          store_name,
          avatar_url,
          trust_score,
          badges,
          response_time
        ),
        order_items (
          id,
          quantity,
          unit_price,
          variant_label,
          product:products ( id, name, images )
        ),
        order_timeline (
          event,
          created_at
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) setOrders(data.map(mapOrder))
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchAll()
    if (!user) return

    const channel = supabase
      .channel(`orders-buyer-${user.id}`)

      // ── Order status / escrow changes ─────────────────────
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
        filter: `buyer_id=eq.${user.id}`,
      }, (payload) => {
        // Patch the changed order in-place — no full refetch needed
        setOrders(prev =>
          prev.map(o =>
            o.id === payload.new.id
              ? {
                  ...o,
                  status:              payload.new.status,
                  escrow_stage:        payload.new.escrow_stage,
                  tracking_number:     payload.new.tracking_number,
                  dispute_window_ends: payload.new.dispute_window_ends,
                  otp_code:            payload.new.otp_code,
                }
              : o
          )
        )
        const label =
          payload.new.status.charAt(0).toUpperCase() +
          payload.new.status.slice(1)
        flash(`📦 Order ${payload.new.order_number ?? ''} → ${label}`)
      })

      // ── New order placed ───────────────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'orders',
        filter: `buyer_id=eq.${user.id}`,
      }, () => {
        fetchAll()
        flash('🎉 New order placed!')
      })

      // ── New timeline event added ───────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'order_timeline',
      }, () => fetchAll())

      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetchAll])

  return { orders, loading, liveToast }
}