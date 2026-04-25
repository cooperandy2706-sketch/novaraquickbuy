'use client'
// FILE: src/hooks/useRealtimeOrders.js

import { useState, useEffect, useRef } from 'react'
import { createClient }                from '@/lib/supabase/client'

// ── Orders list ───────────────────────────────────────────────────────────────
export function useRealtimeOrders(initialData, vendorId) {
  const supabase   = createClient()
  const [data, setData] = useState(initialData)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!vendorId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`orders-list:${vendorId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        setData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            orders: [payload.new, ...prev.orders],
            total:  prev.total + 1,
            statusCounts: {
              ...prev.statusCounts,
              pending: (prev.statusCounts?.pending ?? 0) + 1,
            },
          }
        })
      })
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        setData(prev => {
          if (!prev) return prev
          const orders = prev.orders.map(o =>
            o.id === payload.new.id ? { ...o, ...payload.new } : o
          )
          return { ...prev, orders }
        })
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  useEffect(() => { if (initialData) setData(initialData) }, [initialData])
  return data
}

// ── Single order detail ───────────────────────────────────────────────────────
export function useRealtimeOrderDetail(initialOrder, orderId) {
  const supabase   = createClient()
  const [order, setOrder] = useState(initialOrder)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!orderId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`order-detail:${orderId}`)
      // Order status changes
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new } : prev)
      })
      // New delivery update
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'deliveries',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, delivery: payload.new } : prev)
      })
      // New complaint filed
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'complaints',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setOrder(prev => {
          if (!prev) return prev
          return {
            ...prev,
            complaints: [...(prev.complaints ?? []), payload.new],
          }
        })
      })
      // New history entry
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'order_history',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setOrder(prev => {
          if (!prev) return prev
          return {
            ...prev,
            order_history: [...(prev.order_history ?? []), payload.new],
          }
        })
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  useEffect(() => { if (initialOrder) setOrder(initialOrder) }, [initialOrder])
  return { order, setOrder }
}