'use client'
// FILE: src/components/providers/ThemeProvider.jsx
//
// Mount once — in the customer layout or root layout.
// Reads themeStore preference and applies/removes 'dark' on <html>.
// When preference is 'system', also watches the OS media query so
// changing the OS theme mid-session updates the page instantly.

import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export default function ThemeProvider({ children }) {
  const preference = useThemeStore(s => s.preference)

  useEffect(() => {
    const root = document.documentElement

    function apply(pref) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = pref === 'dark' || (pref === 'system' && prefersDark)
      root.classList.toggle('dark', isDark)
      root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }

    apply(preference)

    // Only attach the media listener for 'system' mode
    if (preference !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  return children
}