/**
 * Formats a number as a currency string.
 * Supports passing a currency code (string) or a currency object { code, locale }.
 */
export const formatCurrency = (amount, currencyInput = 'GHS') => {
  let code = 'GHS'
  let locale = 'en-GH'

  if (typeof currencyInput === 'string') {
    code = currencyInput
  } else if (currencyInput && typeof currencyInput === 'object') {
    code   = currencyInput.code   || 'GHS'
    locale = currencyInput.locale || 'en-GH'
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch (e) {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount)
  }
}

export const formatCurrencyShort = (amount) => {
  if (amount >= 1_000_000) return `GH₵${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `GH₵${(amount / 1_000).toFixed(1)}k`
  return `GH₵${Number(amount).toFixed(2)}`
}

