'use client'
import { useLocaleStore } from '@/store/localeStore'
import { getLocale }      from '@/constants/global/locales'
import { isRtl }          from '@/constants/global/rtlLocales'
 
export const useLocale = () => {
  const { locale, currency, country, timezone, setLocale, setCurrency, setCountry, setRegion } =
    useLocaleStore()
 
  const localeData = getLocale(locale)
  const rtl        = isRtl(locale)
 
  return {
    locale, currency, country, timezone,
    localeData, rtl,
    setLocale, setCurrency, setCountry, setRegion,
  }
}
