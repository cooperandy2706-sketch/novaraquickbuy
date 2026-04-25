'use client'
// FILE: src/hooks/useRealtimeAdmin.js
//
// Boots all admin realtime subscriptions once in the admin layout.
// Keeps nav badges + platform vitals live without polling.

import { useEffect, useRef } from 'react'
import { createClient }      from '@/lib/supabase/client'
import { useAdminStore }     from '@/store/adminStore'

export function useRealtimeAdmin() {
  const supabase   = createClient()
  const channelRef = useRef(null)

  // ── Bootstrap counts ─────────────────────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      const now   = new Date()
      const yday  = new Date(Date.now() - 86400000).toISOString()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

      const results = await Promise.allSettled([
        supabase.from('subscription_payments').select('id', { count:'exact', head:true }).eq('status','pending'),
        supabase.from('vendors').select('id', { count:'exact', head:true }).eq('verification_status','pending'),
        supabase.from('orders').select('id', { count:'exact', head:true }).eq('status','disputed'),
        supabase.from('vendors').select('id', { count:'exact', head:true }).gte('created_at', yday),
        supabase.from('orders').select('id', { count:'exact', head:true }).not('status','in','("cancelled","completed")'),
        supabase.from('orders').select('total_amount').gte('created_at', today).neq('status','cancelled'),
        supabase.from('orders').select('id', { count:'exact', head:true }).gte('created_at', today).neq('status','cancelled'),
      ])

      const get = (i, fallback = 0) =>
        results[i].status === 'fulfilled' ? results[i].value?.count ?? fallback : fallback
      const getData = (i) =>
        results[i].status === 'fulfilled' ? results[i].value?.data ?? [] : []

      const revenueToday = getData(5).reduce((s, r) => s + (r.total_amount ?? 0), 0)

      const store = useAdminStore.getState()
      store.setPendingPayments(get(0))
      store.setPendingVerifications(get(1))
      store.setOpenDisputes(get(2))
      store.setNewVendors(get(3))
      store.setVitals({ activeOrders: get(4), revenueToday, newOrdersToday: get(6) })
    }

    bootstrap().catch(() => {})
  }, [])

  // ── Realtime subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel('admin-global')

      // Subscription payment submitted
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'subscription_payments',
      }, () => useAdminStore.getState().incPendingPayments())

      // Payment approved / rejected
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'subscription_payments',
      }, (p) => {
        if (p.old?.status === 'pending' && p.new?.status !== 'pending')
          useAdminStore.getState().decPendingPayments()
      })

      // New vendor registered
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'vendors',
      }, () => {
        const s = useAdminStore.getState()
        s.setNewVendors(s.newVendors + 1)
      })

      // Vendor docs submitted / verification resolved
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'vendors',
      }, (p) => {
        if (p.old?.verification_status !== 'pending' && p.new?.verification_status === 'pending')
          useAdminStore.getState().incPendingVerifications()
        if (p.old?.verification_status === 'pending' && p.new?.verification_status !== 'pending')
          useAdminStore.getState().decPendingVerifications()
      })

      // Order status changes
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
      }, (p) => {
        const store  = useAdminStore.getState()
        const wasD   = p.old?.status === 'disputed'
        const isD    = p.new?.status === 'disputed'
        if (!wasD && isD) store.incOpenDisputes()
        if (wasD && !isD) store.decOpenDisputes()

        const done = ['cancelled','completed']
        const wasA = !done.includes(p.old?.status)
        const isA  = !done.includes(p.new?.status)
        if (wasA && !isA) store.setVitals({ activeOrders: Math.max(0, store.activeOrders - 1) })
        if (!wasA && isA) store.setVitals({ activeOrders: store.activeOrders + 1 })
      })

      // New order
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'orders',
      }, (p) => {
        const store = useAdminStore.getState()
        store.setVitals({
          activeOrders:   store.activeOrders + 1,
          newOrdersToday: store.newOrdersToday + 1,
          revenueToday:   store.revenueToday + (p.new?.total_amount ?? 0),
        })
      })

      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [])
}