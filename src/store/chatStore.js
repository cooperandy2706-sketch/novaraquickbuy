'use client'
// FILE: src/store/chatStore.js
// Zustand store for all chat UI state.
// Manages: active conversation/circle, message caches, typing indicators,
// online presence, unread totals, draft messages per channel.

import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
  // ── Active channel ─────────────────────────────────────────
  activeTab:            'dms',          // 'dms' | 'circles'
  activeDmId:           null,           // conversation_id
  activeCircleId:       null,           // circle_id

  // ── Message caches: { [channelKey]: Message[] } ────────────
  // channelKey = `dm:${convId}` | `circle:${circleId}`
  messageCache:         {},

  // ── Typing: { [channelKey]: { [userId]: { name, ts } } } ──
  typingUsers:          {},

  // ── Online presence: Set<userId> ───────────────────────────
  onlineUsers:          new Set(),

  // ── Draft text per channel: { [channelKey]: string } ───────
  drafts:               {},

  // ── Reply-to state ─────────────────────────────────────────
  replyingTo:           null,           // { id, sender_name, content, message_type }

  // ── Emoji picker ──────────────────────────────────────────
  emojiPickerOpen:      false,
  emojiPickerTarget:    null,           // 'input' | messageId (for reactions)

  // ── Unread totals (derived from DB, cached here) ──────────
  totalDmUnread:        0,
  totalCircleUnread:    0,

  // ── ACTIONS ────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveDm: (id) => set({ activeDmId: id, activeCircleId: null }),

  setActiveCircle: (id) => set({ activeCircleId: id, activeDmId: null }),

  // Append messages to cache (for a channel)
  prependMessages: (channelKey, messages) => {
    const cache = get().messageCache
    const existing = cache[channelKey] ?? []
    // Prepend older messages (avoid duplicates by id)
    const existingIds = new Set(existing.map(m => m.id))
    const fresh = messages.filter(m => !existingIds.has(m.id))
    set({ messageCache: { ...cache, [channelKey]: [...fresh, ...existing] } })
  },

  appendMessage: (channelKey, message) => {
    const cache = get().messageCache
    const existing = cache[channelKey] ?? []
    // Avoid duplicate
    if (existing.some(m => m.id === message.id)) return
    set({ messageCache: { ...cache, [channelKey]: [...existing, message] } })
  },

  updateMessage: (channelKey, messageId, patch) => {
    const cache = get().messageCache
    const messages = cache[channelKey] ?? []
    set({
      messageCache: {
        ...cache,
        [channelKey]: messages.map(m => m.id === messageId ? { ...m, ...patch } : m),
      },
    })
  },

  removeMessage: (channelKey, messageId) => {
    const cache = get().messageCache
    const messages = cache[channelKey] ?? []
    set({
      messageCache: {
        ...cache,
        [channelKey]: messages.map(m =>
          m.id === messageId ? { ...m, is_deleted: true, content: null } : m
        ),
      },
    })
  },

  clearChannel: (channelKey) => {
    const cache = { ...get().messageCache }
    delete cache[channelKey]
    set({ messageCache: cache })
  },

  // Typing indicators
  setTyping: (channelKey, userId, userName) => {
    const typing = { ...get().typingUsers }
    typing[channelKey] = { ...typing[channelKey], [userId]: { name: userName, ts: Date.now() } }
    set({ typingUsers: typing })
  },

  clearTyping: (channelKey, userId) => {
    const typing = { ...get().typingUsers }
    if (typing[channelKey]) {
      const ch = { ...typing[channelKey] }
      delete ch[userId]
      typing[channelKey] = ch
      set({ typingUsers: typing })
    }
  },

  // Presence
  setUserOnline: (userId) => {
    const s = new Set(get().onlineUsers)
    s.add(userId)
    set({ onlineUsers: s })
  },
  setUserOffline: (userId) => {
    const s = new Set(get().onlineUsers)
    s.delete(userId)
    set({ onlineUsers: s })
  },
  isOnline: (userId) => get().onlineUsers.has(userId),

  // Drafts
  setDraft: (channelKey, text) =>
    set({ drafts: { ...get().drafts, [channelKey]: text } }),
  getDraft: (channelKey) => get().drafts[channelKey] ?? '',

  // Reply-to
  setReplyingTo: (msg) => set({ replyingTo: msg }),
  clearReplyingTo: () => set({ replyingTo: null }),

  // Emoji picker
  openEmojiPicker: (target) => set({ emojiPickerOpen: true, emojiPickerTarget: target }),
  closeEmojiPicker: () => set({ emojiPickerOpen: false, emojiPickerTarget: null }),

  // Unread totals
  setUnreadTotals: (dms, circles) =>
    set({ totalDmUnread: dms, totalCircleUnread: circles }),
}))