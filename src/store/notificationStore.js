// FILE: src/store/notificationStore.js
import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount:   0,
  loading:       false,
  hasMore:       true,

  // ── Setters ───────────────────────────────────────────────
  setNotifications: (n)  => set({
    notifications: n,
    unreadCount:   n.filter(x => !x.read).length,
  }),
  setLoading: (v)  => set({ loading: v }),
  setHasMore: (v)  => set({ hasMore: v }),
  setUnreadCount: (n) => set({ unreadCount: n }),

  // ── Realtime inserts ──────────────────────────────────────
  prependNotification: (notif) => set(s => ({
    notifications: [notif, ...s.notifications].slice(0, 100),
    unreadCount:   s.unreadCount + (notif.read ? 0 : 1),
  })),

  // ── Mark read (array of ids, or all if ids=[]) ────────────
  markRead: (ids) => set(s => {
    const idSet = new Set(ids)
    const updated = s.notifications.map(n =>
      idSet.has(n.id) ? { ...n, read: true, read_at: new Date().toISOString() } : n
    )
    return {
      notifications: updated,
      unreadCount:   updated.filter(n => !n.read).length,
    }
  }),

  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
    unreadCount:   0,
  })),

  // ── Remove ────────────────────────────────────────────────
  removeNotification: (id) => set(s => {
    const updated = s.notifications.filter(n => n.id !== id)
    return {
      notifications: updated,
      unreadCount:   updated.filter(n => !n.read).length,
    }
  }),

  // Legacy helpers (used by VendorLayoutShell)
  incrementUnread: () => set(s => ({ unreadCount: s.unreadCount + 1 })),
  decrementUnread: () => set(s => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  resetUnread:     () => set({ unreadCount: 0 }),
  addNotification: (notif) => set(s => ({
    notifications: [notif, ...s.notifications].slice(0, 50),
    unreadCount:   s.unreadCount + 1,
  })),
}))