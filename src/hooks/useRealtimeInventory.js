'use client'
// FILE: src/hooks/useRealtimeInventory.js
//
// Subscribes to Supabase Realtime for product stock changes.
// Patches the inventory list in place — no full page refresh needed.
// Also updates summary counts (out of stock, low stock, in stock).

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

function recalcSummary(products) {
  return {
    total:      products.length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
    lowStock:   products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
    inStock:    products.filter(p => p.stock_quantity > 5).length,
  }
}

export function useRealtimeInventory(initialData, vendorId) {
  const supabase   = createClient()
  const [data, setData] = useState(initialData)
  const channelRef = useRef(null)

  // Patch a single product's stock in the list
  const patchProduct = useCallback((id, patch) => {
    setData(prev => {
      if (!prev) return prev
      const products = prev.products.map(p =>
        p.id === id ? { ...p, ...patch } : p
      )
      return {
        ...prev,
        products,
        summary: recalcSummary(products),
      }
    })
  }, [])

  // Patch a variant's stock inside a product
  const patchVariant = useCallback((variantId, stock_quantity) => {
    setData(prev => {
      if (!prev) return prev
      const products = prev.products.map(p => ({
        ...p,
        variants: (p.variants ?? []).map(v =>
          v.id === variantId ? { ...v, stock_quantity } : v
        ),
      }))
      return { ...prev, products }
    })
  }, [])

  useEffect(() => {
    if (!vendorId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`inventory-live:${vendorId}`)

      // ── Product stock updated ─────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'products',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        const { id, stock_quantity, low_stock_threshold, status, updated_at } = payload.new
        patchProduct(id, { stock_quantity, low_stock_threshold, status, updated_at })
      })

      // ── Order placed → stock decremented by order_items ───────────────────
      // When a new order comes in, we fetch updated stock for affected products
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, async () => {
        // Refetch affected products' stock — we don't know which products
        // were in the order without querying order_items, so we just
        // trigger a light re-fetch of out-of-stock / low-stock counts
        const client = createClient()
        const [
          { count: outOfStock },
          { count: lowStock },
          { count: inStock },
          { count: total },
        ] = await Promise.all([
          client.from('products').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).eq('track_inventory', true).eq('stock_quantity', 0),
          client.from('products').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).eq('track_inventory', true).gt('stock_quantity', 0).lte('stock_quantity', 5),
          client.from('products').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).eq('track_inventory', true).gt('stock_quantity', 5),
          client.from('products').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).eq('track_inventory', true),
        ])

        setData(prev => prev ? {
          ...prev,
          summary: {
            total:      total      ?? prev.summary.total,
            outOfStock: outOfStock ?? prev.summary.outOfStock,
            lowStock:   lowStock   ?? prev.summary.lowStock,
            inStock:    inStock    ?? prev.summary.inStock,
          }
        } : prev)
      })

      // ── Variant stock updated ─────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'product_variants',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        patchVariant(payload.new.id, payload.new.stock_quantity)
      })

      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  // Sync when server data changes (filter/search change)
  useEffect(() => {
    if (initialData) setData(initialData)
  }, [initialData])

  return data
}