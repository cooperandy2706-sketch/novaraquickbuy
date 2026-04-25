// FILE: src/store/themeStore.js
// Persists the user's theme preference across sessions.
// 'system' = follow OS dark mode, 'light' = always light, 'dark' = always dark

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      preference: 'system',   // 'system' | 'light' | 'dark'
      setPreference: (p) => set({ preference: p }),
    }),
    {
      name:    'novara-theme',
      version: 1,
    }
  )
)