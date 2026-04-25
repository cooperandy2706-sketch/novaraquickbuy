// FILE: src/store/inventoryStore.js
'use client'

import { create } from 'zustand'

export const useInventoryStore = create((set) => ({
  lowStockProducts:   [],
  outOfStockProducts: [],
  setLowStock:   (items) => set({ lowStockProducts: items }),
  setOutOfStock: (items) => set({ outOfStockProducts: items }),
  addLowStock: (product) => set((state) => ({
    lowStockProducts: state.lowStockProducts.find(p => p.id === product.id)
      ? state.lowStockProducts
      : [...state.lowStockProducts, product],
  })),
  dismiss: (productId) => set((state) => ({
    lowStockProducts:   state.lowStockProducts.filter(p => p.id !== productId),
    outOfStockProducts: state.outOfStockProducts.filter(p => p.id !== productId),
  })),
}))