// FILE: src/store/wishlistStore.js
// Lightweight Zustand store for wishlist UI state.
// Persists the "last used list id" and quick-add state.
// The real data lives in Supabase — this is only UI state.

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      // Last list the user added to (for quick-add default)
      lastListId:   null,
      lastListName: null,

      // Items added this session (optimistic UI on product pages)
      // { [productId]: listId }
      addedItems: {},

      setLastList: (id, name) => set({ lastListId: id, lastListName: name }),

      markAdded: (productId, listId) =>
        set(s => ({ addedItems: { ...s.addedItems, [productId]: listId } })),

      markRemoved: (productId) =>
        set(s => {
          const next = { ...s.addedItems }
          delete next[productId]
          return { addedItems: next }
        }),

      isAdded:   (productId) => !!get().addedItems[productId],
      isWishlisted: (productId) => !!get().addedItems[productId],
      getListId: (productId) => get().addedItems[productId] ?? null,

      toggle: (product) => {
        if (!product) return
        const id = product.id ?? product.product_id
        if (!id) return

        if (get().isAdded(id)) {
          const next = { ...get().addedItems }
          delete next[id]
          set({ addedItems: next })
        } else {
          set(s => ({
            addedItems: { ...s.addedItems, [id]: s.lastListId || 'default' }
          }))
        }
      },
    }),
    {
      name:    'novara-wishlist-ui',
      version: 1,
      partialize: (s) => ({
        lastListId:   s.lastListId,
        lastListName: s.lastListName,
        addedItems:   s.addedItems,
      }),
    }
  )
)