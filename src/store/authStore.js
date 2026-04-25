// FILE: src/store/authStore.js
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user:    null,
  profile: null,
  loading: true,

  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  setAuth: (user, profile) => set({ user, profile, loading: false }),
  clearAuth: ()            => set({ user: null, profile: null, loading: false }),
}))