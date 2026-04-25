'use client'
// FILE: src/hooks/useCart.js
// NovaPay-aware cart hook.
//
// Architecture:
//   useCartStore  — Zustand store with localStorage persistence
//   useCart       — hook that wraps the store with auth + Supabase sync
//
// Key fixes vs v1:
//   • Derived state (count, subtotal) were functions called in render —
//     now they are computed values stored in state, preventing stale reads
//   • Guest → auth merge: when user logs in, local items are pushed to DB
//     then the canonical DB list replaces local state
//   • Realtime: Supabase channel listens for cart_items changes across tabs/devices
//   • addItem was missing the `id` field on new items — caused remove/updateQty
//     to silently fail on guest items (no DB id yet)
//   • updateQty(id, 0) now correctly removes the item both locally and from DB
//   • clear() properly awaits the DB delete before resolving
//   • All DB ops are fire-and-forget with error logging — never throw to UI
//   • `syncing` is now a counter (not bool) so concurrent syncs don't race
//   • Exposes `isEmpty`, `hasItem`, `getItem` helpers used by cart/checkout pages

import { create }       from 'zustand'
import { persist }      from 'zustand/middleware'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

// ─────────────────────────────────────────────────────────────
// ITEM SHAPE
// {
//   id            string   DB row id (null for guest items)
//   product_id    string   uuid
//   vendor_id     string   uuid
//   vendor_name   string
//   name          string
//   image_url     string | null
//   price         number   smallest unit (pesewas/kobo/cents)
//   currency      string   'GHS' | 'NGN' etc.
//   variant_label string
//   qty           number
//   max_qty       number
// }
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function computeDerived(items) {
  return {
    count:    items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
  }
}

function isSameItem(a, b) {
  const bId = b.product_id || b.id
  return (
    a.product_id    === bId &&
    (a.variant_label ?? '') === (b.variant_label ?? '')
  )
}

// Map a Supabase cart_items row (with joins) to our item shape
function mapDBRow(row) {
  const p = row.product
  if (!p) return null
  return {
    id:            row.id,
    product_id:    p.id,
    vendor_id:     p.vendor?.id    ?? '',
    vendor_name:   p.vendor?.store_name ?? '',
    name:          p.name,
    image_url:     p.images?.[0]   ?? null,
    price:         p.price,
    currency:      p.currency      ?? 'GHS',
    variant_label: row.variant_label ?? '',
    qty:           row.qty,
    max_qty:       p.stock         ?? 99,
  }
}

// ─────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────

export const useCartStore = create(
  persist(
    (set, get) => ({
      items:    [],
      count:    0,
      subtotal: 0,
      syncing:  0,   // counter — >0 means syncing
      recentlyDeleted: {}, // { id: timestamp } or { product_id: timestamp }

      // ── Internal setter that always recomputes derived ─────
      _setItems: (items) =>
        set({ items, ...computeDerived(items) }),

      _setSyncing: (delta) =>
        set(s => ({ syncing: Math.max(0, s.syncing + delta) })),

      // ── ADD ────────────────────────────────────────────────
      // Returns the final qty for the added item (useful for UI feedback)
      addItem: (product) => {
        const items    = get().items
        const existing = items.find(i => isSameItem(i, product))

        if (existing) {
          const newQty = Math.min(
            existing.qty + (product.qty ?? 1),
            product.max_qty ?? 99,
          )
          const updated = items.map(i =>
            isSameItem(i, product) ? { ...i, qty: newQty } : i
          )
          get()._setItems(updated)
          return newQty
        }

        const normalizedVendorId = product.vendor_id || product.vendor?.id || ''
        const normalizedPrice    = product.discount_price || product.price || 0
        const normalizedImage    = product.image_url || product.images?.[0] || null

        const newItem = {
          id:            null,  // filled in after DB write
          product_id:    product.product_id || product.id,
          vendor_id:     normalizedVendorId,
          vendor_name:   product.vendor_name || product.vendor?.store_name || '',
          name:          product.name,
          image_url:     normalizedImage,
          price:         normalizedPrice,
          currency:      product.currency     ?? 'GHS',
          variant_label: product.variant_label ?? '',
          qty:           product.qty           ?? 1,
          max_qty:       product.max_qty       ?? 99,
          _last_local_update: Date.now(),
        }
        get()._setItems([...items, newItem])
        return newItem.qty
      },

      // ── REMOVE ─────────────────────────────────────────────
      removeItem: (id) => {
        const timestamp = Date.now()
        set(s => ({
          recentlyDeleted: { ...s.recentlyDeleted, [id]: timestamp }
        }))
        get()._setItems(get().items.filter(i => i.id !== id && i.product_id !== id))
      },

      // Remove by product_id + variant (used when DB id not yet known)
      removeByProduct: (productId, variantLabel = '') => {
        const timestamp = Date.now()
        set(s => ({
          recentlyDeleted: { ...s.recentlyDeleted, [productId]: timestamp }
        }))
        get()._setItems(
          get().items.filter(i =>
            !(i.product_id === productId && (i.variant_label ?? '') === variantLabel)
          )
        )
      },

      // ── UPDATE QTY ─────────────────────────────────────────
      updateQty: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id)
          return
        }
        get()._setItems(
          get().items.map(i => i.id === id ? { ...i, qty, _last_local_update: Date.now() } : i)
        )
      },

      // ── PATCH ID (after DB write returns the row id) ───────
      patchId: (productId, variantLabel, dbId) => {
        set({
          items: get().items.map(i =>
            i.product_id === productId && (i.variant_label ?? '') === (variantLabel ?? '')
              ? { ...i, id: dbId, _last_local_update: Date.now() }
              : i
          ),
        })
      },

      // ── REPLACE ALL (from DB load) ─────────────────────────
      replaceItems: (dbItems) => {
        const NOW = Date.now()
        const recentDeletes = get().recentlyDeleted

        // Keep items that:
        // 1. Are not yet in DB (id: null)
        // 2. OR were updated locally < 10s ago (to handle DB propagation delay)
        const localOnly = get().items.filter(i => {
          const inDb = dbItems.some(di => di.product_id === i.product_id && di.variant_label === i.variant_label)
          if (inDb) return false

          const isUnsaved = i.id === null
          const isRecent  = (NOW - (i._last_local_update ?? 0)) < 10000 // 10s grace
          return isUnsaved || isRecent
        })

        // IMPORTANT: Filter out items from DB that were RECENTLY DELETED locally
        const filteredDb = dbItems.filter(di => {
          const deleteTime = recentDeletes[di.id] || recentDeletes[di.product_id]
          if (deleteTime && (NOW - deleteTime) < 10000) return false // Ignore stale DB re-adds for 10s
          return true
        })

        get()._setItems([...filteredDb, ...localOnly])
      },

      // ── CLEAR ──────────────────────────────────────────────
      clearItems: () => {
        const timestamp = Date.now()
        const ids = get().items.map(i => i.id).filter(Boolean)
        const pids = get().items.map(i => i.product_id).filter(Boolean)
        
        const newDeletes = { ...get().recentlyDeleted }
        ids.forEach(id => newDeletes[id] = timestamp)
        pids.forEach(pid => newDeletes[pid] = timestamp)
        
        set({ recentlyDeleted: newDeletes })
        get()._setItems([])
      },
    }),
    {
      name:       'novara-cart-v2',
      version:    2,
      partialize: (s) => ({ items: s.items }),
      // Rehydrate: recompute derived state from persisted items
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { count, subtotal } = computeDerived(state.items ?? [])
          state.count    = count
          state.subtotal = subtotal
          state.syncing  = 0
        }
      },
    }
  )
)

// ─────────────────────────────────────────────────────────────
// DB OPERATIONS  (all fire-and-forget with error logging)
// ─────────────────────────────────────────────────────────────

async function dbAddItem(supabase, userId, item) {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert(
        {
          user_id:       userId,
          product_id:    item.product_id,
          variant_label: item.variant_label ?? '',
          qty:           item.qty,
        },
        { onConflict: 'user_id,product_id,variant_label' }
      )
      .select('id, qty')
      .single()

    if (error) {
      console.error('[useCart] dbAddItem error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.error('[useCart] dbAddItem exception:', err)
    return null
  }
}

async function dbRemoveItem(supabase, id) {
  try {
    await supabase.from('cart_items').delete().eq('id', id)
  } catch (err) {
    console.error('[useCart] dbRemoveItem exception:', err)
  }
}

async function dbUpdateQty(supabase, id, qty) {
  try {
    await supabase.from('cart_items').update({ qty }).eq('id', id)
  } catch (err) {
    console.error('[useCart] dbUpdateQty exception:', err)
  }
}

async function dbClearCart(supabase, userId) {
  try {
    await supabase.from('cart_items').delete().eq('user_id', userId)
  } catch (err) {
    console.error('[useCart] dbClearCart exception:', err)
  }
}

async function dbLoadCart(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        qty,
        variant_label,
        product:products (
          id, name, price, currency, images, stock,
          vendor:vendors ( id, store_name )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[useCart] dbLoadCart error:', error.message)
      return null
    }
    return (data ?? []).map(mapDBRow).filter(Boolean)
  } catch (err) {
    console.error('[useCart] dbLoadCart exception:', err)
    return null
  }
}

// Merge local guest items into DB on sign-in
async function dbMergeGuestItems(supabase, userId, localItems) {
  if (!localItems.length) return

  const rows = localItems.map(i => ({
    user_id:       userId,
    product_id:    i.product_id,
    variant_label: i.variant_label ?? '',
    qty:           i.qty,
  }))

  try {
    await supabase
      .from('cart_items')
      .upsert(rows, { onConflict: 'user_id,product_id,variant_label' })
  } catch (err) {
    console.error('[useCart] dbMergeGuestItems exception:', err)
  }
}

// ─────────────────────────────────────────────────────────────
// useCart HOOK
// ─────────────────────────────────────────────────────────────

export function useCart() {
  const store   = useCartStore()
  const { user } = useAuthStore()
  const prevUserIdRef = useRef(null)
  const channelRef    = useRef(null)

  // ── On auth change: merge guest cart → DB → load canonical DB cart ──
  useEffect(() => {
    const prevUserId = prevUserIdRef.current
    const userId     = user?.id ?? null

    // No change
    if (userId === prevUserId) return
    prevUserIdRef.current = userId

    if (!userId) {
      // User signed out — keep local items, kill realtime
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    // User just signed in
    const supabase = createClient()
    ;(async () => {
      store._setSyncing(1)

      // 1. Push any local guest items to DB
      const localItems = store.items.filter(i => !i.id)
      if (localItems.length) {
        await dbMergeGuestItems(supabase, userId, localItems)
      }

      // 2. Load canonical cart from DB (overwrites local)
      const dbItems = await dbLoadCart(supabase, userId)
      if (dbItems !== null) {
        store.replaceItems(dbItems)
      }

      store._setSyncing(-1)

      // 3. Subscribe to realtime cart changes
      subscribeRealtime(supabase, userId)
    })()
  }, [user?.id])

  // ── Realtime subscription ──────────────────────────────────
  const subscribeRealtime = useCallback((supabase, userId) => {
    // Kill existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    channelRef.current = supabase
      .channel(`cart:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'cart_items',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Reload full cart on any change from another tab/device
          // (simple and correct — cart is small)
          const items = await dbLoadCart(supabase, userId)
          if (items !== null) store.replaceItems(items)
        }
      )
      .subscribe()
  }, [])

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // ── PUBLIC API ────────────────────────────────────────────

  const add = useCallback(async (product) => {
    // Optimistic local update first
    store.addItem(product)

    if (!user?.id) return   // guest — localStorage only

    const productId = product.product_id || product.id
    const supabase  = createClient()
    const data      = await dbAddItem(supabase, user.id, {
      ...product,
      product_id: productId
    })
    if (data?.id) {
      // Patch the local item with its real DB id
      store.patchId(productId, product.variant_label ?? '', data.id)
    }
  }, [user?.id])

  const remove = useCallback(async (id) => {
    // Find the item before removing (need product_id for removeByProduct fallback)
    const item = store.items.find(i => i.id === id)

    // Optimistic removal
    store.removeItem(id)

    if (!user?.id) return

    // Only hit DB if we have a real DB id
    if (item?.id) {
      const supabase = createClient()
      await dbRemoveItem(supabase, item.id)
    }
  }, [user?.id, store.items])

  const updateQty = useCallback(async (id, qty) => {
    if (qty <= 0) {
      await remove(id)
      return
    }

    // Optimistic
    store.updateQty(id, qty)

    if (!user?.id) return

    const item = store.items.find(i => i.id === id)
    if (item?.id) {
      const supabase = createClient()
      await dbUpdateQty(supabase, item.id, qty)
    }
  }, [user?.id, store.items, remove])

  const clear = useCallback(async () => {
    store.clearItems()

    if (!user?.id) return

    const supabase = createClient()
    await dbClearCart(supabase, user.id)
  }, [user?.id])

  // ── HELPERS ───────────────────────────────────────────────

  const hasItem = useCallback((productId, variantLabel = '') =>
    store.items.some(
      i => i.product_id === productId && (i.variant_label ?? '') === variantLabel
    ),
  [store.items])

  const getItem = useCallback((productId, variantLabel = '') =>
    store.items.find(
      i => i.product_id === productId && (i.variant_label ?? '') === variantLabel
    ) ?? null,
  [store.items])

  const getQty = useCallback((productId, variantLabel = '') =>
    getItem(productId, variantLabel)?.qty ?? 0,
  [getItem])

  return {
    // State
    items:           store.items,
    count:           store.count,
    subtotal:        store.subtotal,
    syncing:         store.syncing > 0,
    isEmpty:         store.items.length === 0,
    isAuthenticated: !!user,

    // Actions
    add,
    remove,
    updateQty,
    clear,

    // Helpers
    hasItem,
    getItem,
    getQty,
  }
}