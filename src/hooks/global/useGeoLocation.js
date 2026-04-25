'use client'
import { useEffect } from 'react'
import { useLocaleStore }         from '@/store/localeStore'
import { detectCountryFromIp }    from '@/lib/geo/detectCountry'
import { getCurrencyByCountry }   from '@/constants/global/countries'
import { getLocaleByCountry }     from '@/constants/global/countries'
import { getTimezoneForCountry }  from '@/constants/global/timezones'
 
// Auto-detect and set region on first visit
// Only runs if no region has been saved yet
export const useGeoLocation = () => {
  const { country, setRegion } = useLocaleStore()
 
  useEffect(() => {
    if (country) return  // Already set — don't override user preference
 
    detectCountryFromIp().then((geo) => {
      setRegion({
        country:  geo.country,
        currency: getCurrencyByCountry(geo.country),
        locale:   getLocaleByCountry(geo.country),
        timezone: getTimezoneForCountry(geo.country),
      })
    })
  }, [])
}
