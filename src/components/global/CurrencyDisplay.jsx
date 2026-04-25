'use client'
import { useLocaleStore } from '@/store/localeStore'
import { formatMoney, formatMoneyShort } from '@/constants/global/currencies'
 
export default function CurrencyDisplay({ amount, short = false, className = '' }) {
  const currency = useLocaleStore((s) => s.currency)
  const formatted = short
    ? formatMoneyShort(amount, currency)
    : formatMoney(amount, currency)
  return <span className={className}>{formatted}</span>
}
