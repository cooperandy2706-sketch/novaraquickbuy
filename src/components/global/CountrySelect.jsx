'use client'
import { COUNTRIES } from '@/constants/global/countries'
 
export default function CountrySelect({ value, onChange, name = 'country', required = false, className = '' }) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent ${className}`}
      aria-label="Select country"
    >
      <option value="">Select Country</option>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.name}
        </option>
      ))}
    </select>
  )
}
