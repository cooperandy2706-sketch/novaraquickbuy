'use client'
// FILE: src/hooks/useRealtimeAnalytics.js
//
// Only patches the 3 KPIs that vendors genuinely need live on the analytics page:
//   • Revenue total    — ticks up on every new completed order
//   • Orders count     — increments on new order
//   • Unread messages  — increments on new message
//
// Everything else (charts, top products, reviews, followers) is historical
// aggregate data that doesn't need sub-second updates. Those refresh when
// the vendor changes the date range or reloads the page.

import { useState, useEffect, useRef } from 'react'
import { createClient }                from '@/lib/supabase/client'

export function useRealtimeAnalytics(initialOverview, vendorId) {
  const supabase   = createClient()
  const [overview, setOverview] = useState(initialOverview)
  const channelRef = useRef(null)

  const patch = (update) =>
    setOverview(prev => prev ? { ...prev, ...update } : prev)

  useEffect(() => {
    if (!vendorId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`analytics-live:${vendorId}`)

      // ── New order → bump revenue + order count ────────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        const amount = payload.new.total_amount ?? 0
        patch({
          revenue:  (overview?.revenue  ?? 0) + amount,
          orders:   (overview?.orders   ?? 0) + 1,
        })
      })

      // ── Order completed → also update avg order value ─────────────────────
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        // If order was cancelled, subtract its amount from revenue
        if (payload.new.status === 'cancelled' && payload.old?.status !== 'cancelled') {
          patch({
            revenue: Math.max(0, (overview?.revenue ?? 0) - (payload.new.total_amount ?? 0)),
            orders:  Math.max(0, (overview?.orders  ?? 0) - 1),
          })
        }
      })

      // ── New message → bump unread count ──────────────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        if (payload.new.sender_role === 'vendor') return
        patch({ totalMessages: (overview?.totalMessages ?? 0) + 1 })
      })

      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  // Sync when server data changes (range switch)
  useEffect(() => {
    if (initialOverview) setOverview(initialOverview)
  }, [initialOverview])

  return overview
}