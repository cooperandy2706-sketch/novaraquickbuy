'use client'
import { useLocaleStore }                  from '@/store/localeStore'
import { formatMoney, formatMoneyShort }   from '@/constants/global/currencies'
 
export const useCurrency = () => {
  const currency = useLocaleStore((s) => s.currency)
 
  return {
    currency,
    format:      (amount) => formatMoney(amount, currency),
    formatShort: (amount) => formatMoneyShort(amount, currency),
  }
}
