// FILE: src/components/global/RtlProvider.jsx
'use client'

import { useEffect } from 'react'

const RTL_LOCALES = ['ar', 'fa', 'he', 'ur']

export default function RtlProvider({ locale, children }) {
  useEffect(() => {
    const html = document.documentElement
    const isRtl = RTL_LOCALES.includes(locale)
    html.setAttribute('dir',  isRtl ? 'rtl' : 'ltr')
    html.setAttribute('lang', locale ?? 'en')
  }, [locale])

  return <>{children}</>
}