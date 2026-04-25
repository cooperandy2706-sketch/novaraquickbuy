'use client'
import { useLocaleStore } from '@/store/localeStore'
import { CURRENCIES } from '@/constants/global/currencies'
 
export default function CurrencySwitcher() {
  const { currency, setCurrency } = useLocaleStore()
 
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="text-sm bg-transparent border border-gray-200 rounded-md px-2 py-1 cursor-pointer"
      aria-label="Select currency"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
    </select>
  )
}
