// FILE: src/store/localeStore.js
'use client'

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'

export const useLocaleStore = create(
  persist(
    (set, get) => ({
      locale:   'en',
      currency: 'GHS',
      country:  'all',
      detectedCountry: null,
      timezone: 'Africa/Accra',
      
      setLocale:   (locale)   => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setCountry:  (country)  => set({ country }),
      setTimezone: (timezone) => set({ timezone }),
      
      detectLocation: async () => {
        if (get().detectedCountry) return
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
          let detected = 'Ghana'
          if (tz.includes('Lagos'))   detected = 'Nigeria'
          if (tz.includes('Nairobi')) detected = 'Kenya'
          if (tz.includes('Joburg'))  detected = 'South Africa'
          if (tz.includes('London'))  detected = 'United Kingdom'
          if (tz.includes('New_York')) detected = 'United States'
          set({ detectedCountry: detected, timezone: tz })
        } catch (e) {
          console.error("Location detection failed", e)
        }
      },

      setRegion:   ({ locale, currency, country, timezone }) =>
        set({ locale, currency, country, timezone }),
    }),
    { name: 'novara-locale', version: 1 }
  )
)