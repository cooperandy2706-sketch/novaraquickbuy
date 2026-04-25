// FILE: src/store/adminStore.js
import { create } from 'zustand'

export const useAdminStore = create((set, get) => ({
  // Pending items that need attention — shown as nav badges
  pendingPayments:      0,  // subscription payments awaiting verification
  pendingVerifications: 0,  // vendor ID verifications pending
  openDisputes:         0,  // order disputes needing admin action
  pendingWithdrawals:   0,  // payout requests awaiting approval
  newVendors:           0,  // vendors registered in last 24h
  flaggedContent:       0,  // reported content awaiting review

  // Live platform vitals
  activeVendors:  0,
  activeOrders:   0,
  revenueToday:   0,
  newOrdersToday: 0,

  // Setters
  setPendingPayments:      (n) => set({ pendingPayments:      n }),
  setPendingVerifications: (n) => set({ pendingVerifications: n }),
  setOpenDisputes:         (n) => set({ openDisputes:         n }),
  setPendingWithdrawals:   (n) => set({ pendingWithdrawals:   n }),
  setNewVendors:           (n) => set({ newVendors:           n }),
  setFlaggedContent:       (n) => set({ flaggedContent:       n }),
  setVitals:               (v) => set(v),

  incPendingPayments:      () => set(s => ({ pendingPayments:      s.pendingPayments      + 1 })),
  incPendingVerifications: () => set(s => ({ pendingVerifications: s.pendingVerifications + 1 })),
  incOpenDisputes:         () => set(s => ({ openDisputes:         s.openDisputes         + 1 })),
  decPendingPayments:      () => set(s => ({ pendingPayments:      Math.max(0, s.pendingPayments      - 1) })),
  decPendingVerifications: () => set(s => ({ pendingVerifications: Math.max(0, s.pendingVerifications - 1) })),
  decOpenDisputes:         () => set(s => ({ openDisputes:         Math.max(0, s.openDisputes         - 1) })),
}))