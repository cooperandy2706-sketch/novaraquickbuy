// Supported currencies with formatting metadata
// symbol, code, name, decimals, locale
 
export const CURRENCIES = [
  { code: 'GHS', symbol: 'GH₵',  name: 'Ghanaian Cedi',        decimals: 2, locale: 'en-GH' },
  { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira',        decimals: 2, locale: 'en-NG' },
  { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',       decimals: 2, locale: 'en-KE' },
  { code: 'USD', symbol: '$',    name: 'US Dollar',             decimals: 2, locale: 'en-US' },
  { code: 'GBP', symbol: '£',    name: 'British Pound',         decimals: 2, locale: 'en-GB' },
  { code: 'EUR', symbol: '€',    name: 'Euro',                  decimals: 2, locale: 'de-DE' },
  { code: 'ZAR', symbol: 'R',    name: 'South African Rand',    decimals: 2, locale: 'en-ZA' },
  { code: 'TZS', symbol: 'TSh',  name: 'Tanzanian Shilling',    decimals: 0, locale: 'sw-TZ' },
  { code: 'UGX', symbol: 'USh',  name: 'Ugandan Shilling',      decimals: 0, locale: 'sw-UG' },
  { code: 'XOF', symbol: 'CFA',  name: 'West African CFA Franc',decimals: 0, locale: 'fr-SN' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA',   decimals: 0, locale: 'fr-CM' },
  { code: 'EGP', symbol: 'E£',   name: 'Egyptian Pound',        decimals: 2, locale: 'ar-EG' },
  { code: 'MAD', symbol: 'MAD',  name: 'Moroccan Dirham',       decimals: 2, locale: 'ar-MA' },
  { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real',        decimals: 2, locale: 'pt-BR' },
  { code: 'CNY', symbol: '¥',    name: 'Chinese Yuan',          decimals: 2, locale: 'zh-CN' },
  { code: 'INR', symbol: '₹',    name: 'Indian Rupee',          decimals: 2, locale: 'en-IN' },
  { code: 'CAD', symbol: 'CA$',  name: 'Canadian Dollar',       decimals: 2, locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar',     decimals: 2, locale: 'en-AU' },
  { code: 'AED', symbol: 'AED',  name: 'UAE Dirham',            decimals: 2, locale: 'ar-AE' },
]
 
export const DEFAULT_CURRENCY = 'GHS'
 
export const getCurrency = (code) =>
  CURRENCIES.find(c => c.code === code) || CURRENCIES[0]
 
export const formatMoney = (amount, currencyCode = 'GHS') => {
  const currency = getCurrency(currencyCode)
  return new Intl.NumberFormat(currency.locale, {
    style:                 'currency',
    currency:              currency.code,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount)
}
 
export const formatMoneyShort = (amount, currencyCode = 'GHS') => {
  const currency = getCurrency(currencyCode)
  if (amount >= 1_000_000) return `${currency.symbol}${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `${currency.symbol}${(amount / 1_000).toFixed(1)}k`
  return `${currency.symbol}${Number(amount).toFixed(currency.decimals)}`
}
