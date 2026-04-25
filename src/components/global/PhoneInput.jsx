'use client'
import PhoneInputLib from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useLocaleStore } from '@/store/localeStore'
 
export default function PhoneInput({ value, onChange, required = false, className = '' }) {
  const country = useLocaleStore((s) => s.country)
 
  return (
    <PhoneInputLib
      international
      defaultCountry={country}
      value={value}
      onChange={onChange}
      className={`phone-input ${className}`}
      aria-label="Phone number"
    />
  )
}
