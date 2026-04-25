'use client'
// FILE: src/hooks/useRealtimeDashboard.js
//
// Patches dashboard stats in real time as orders and products change.
// Pass the initial `data` from the server action — this hook keeps it live.

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeDashboard(initialData, vendorId) {
  const supabase   = createClient()
  const [data, setData] = useState(initialData)
  const channelRef = useRef(null)

  // Patch helper — merges partial stats update
  const patchStats = useCallback((patch) => {
    setData(prev => {
      if (!prev) return prev
      return { ...prev, stats: { ...prev.stats, ...patch } }
    })
  }, [])

  // Prepend a new order to the recent orders list
  const prependOrder = useCallback((order) => {
    setData(prev => {
      if (!prev) return prev
      const updated = [order, ...(prev.recentOrders ?? [])].slice(0, 5)
      return { ...prev, recentOrders: updated }
    })
  }, [])

  // Append today's revenue to the chart
  const patchChart = useCallback((amount) => {
    setData(prev => {
      if (!prev) return prev
      const today    = new Date().toLocaleDateString('en', { weekday: 'short' })
      const updated  = (prev.chartData ?? []).map(d =>
        d.label === today ? { ...d, total: d.total + amount } : d
      )
      return { ...prev, chartData: updated }
    })
  }, [])

  useEffect(() => {
    if (!vendorId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`dashboard-live:${vendorId}`)

      // ── New order → bump counters + revenue + chart ───────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        const order  = payload.new
        const amount = order.total_amount ?? 0

        setData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            stats: {
              ...prev.stats,
              totalOrders:   (prev.stats.totalOrders   ?? 0) + 1,
              pendingOrders: (prev.stats.pendingOrders ?? 0) + 1,
              revenueThis:   (prev.stats.revenueThis   ?? 0) + amount,
            },
            recentOrders: [order, ...(prev.recentOrders ?? [])].slice(0, 5)
          }
        })
        patchChart(amount)
      })

      // ── Order status change → update pending count ────────────────────────────
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        const { status } = payload.new
        const prevStatus = payload.old?.status
        if (status === prevStatus) return

        const pendingStatuses = ['pending', 'vendor_accepted', 'preparing']
        const wasP = pendingStatuses.includes(prevStatus)
        const isP  = pendingStatuses.includes(status)

        setData(prev => {
          if (!prev) return prev
          let pendingOrders = prev.stats.pendingOrders ?? 0
          if (wasP && !isP) pendingOrders = Math.max(0, pendingOrders - 1)
          if (!wasP && isP) pendingOrders = pendingOrders + 1

          const recentOrders = (prev.recentOrders ?? []).map(o =>
            o.id === payload.new.id ? { ...o, status } : o
          )

          return {
            ...prev,
            stats: { ...prev.stats, pendingOrders },
            recentOrders
          }
        })
      })

      // ── Product stock change → update stock alerts ────────────────────────────
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'products',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        const { stock_quantity: qty } = payload.new
        const prevQty = payload.old?.stock_quantity ?? qty

        // Recalculate low/out-of-stock deltas
        const wasOut  = prevQty === 0
        const isOut   = qty     === 0
        const wasLow  = prevQty > 0  && prevQty <= 5
        const isLow   = qty     > 0  && qty     <= 5

        let outDelta = 0
        let lowDelta = 0

        if (!wasOut && isOut)   outDelta += 1
        if (wasOut  && !isOut)  outDelta -= 1
        if (!wasLow && isLow)   lowDelta += 1
        if (wasLow  && !isLow)  lowDelta -= 1

        if (outDelta !== 0 || lowDelta !== 0) {
          setData(prev => {
            if (!prev) return prev
            return {
              ...prev,
              stats: {
                ...prev.stats,
                outOfStockCount: Math.max(0, (prev.stats.outOfStockCount ?? 0) + outDelta),
                lowStockCount:   Math.max(0, (prev.stats.lowStockCount   ?? 0) + lowDelta),
              }
            }
          })
        }
      })

      // ── New message → bump unread count ──────────────────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        if (payload.new.sender_role === 'vendor') return
        setData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            stats: {
              ...prev.stats,
              unreadMessages: (prev.stats.unreadMessages ?? 0) + 1,
            }
          }
        })
      })

      .subscribe()

    channelRef.current = channel

    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  // Keep local data in sync if server re-fetches (e.g. router.refresh)
  useEffect(() => {
    if (initialData) setData(initialData)
  }, [initialData])

  return data
}