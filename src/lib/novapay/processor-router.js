// FILE: src/lib/novapay/processor-router.js
// Determines which payment processor to use based on:
//   - User's country / IP region
//   - Payment method selected
//   - Processor availability
//
// Under the hood: Paystack (Ghana/Nigeria/Africa)
//                 Flutterwave (Rest of Africa)
//                 Stripe (Global/EU/US)
// User always sees: NovaPay

const PROCESSOR_ROUTES = {
  // Ghana
  ghana: {
    card:            'paystack',
    momo_mtn:        'paystack',
    momo_vodafone:   'paystack',
    momo_airteltigo: 'paystack',
    bank_transfer:   'paystack',
    wallet:          'wallet',
  },
  // Nigeria
  nigeria: {
    card:          'paystack',
    bank_transfer: 'paystack',
    ussd:          'paystack',
    wallet:        'wallet',
  },
  // Kenya
  kenya: {
    card:      'flutterwave',
    momo_mtn:  'flutterwave',
    wallet:    'wallet',
  },
  // South Africa
  south_africa: {
    card:          'flutterwave',
    bank_transfer: 'flutterwave',
    wallet:        'wallet',
  },
  // Rest of Africa
  africa_other: {
    card:          'flutterwave',
    momo_mtn:      'flutterwave',
    bank_transfer: 'flutterwave',
    wallet:        'wallet',
  },
  // Europe
  europe: {
    card:        'stripe',
    apple_pay:   'stripe',
    google_pay:  'stripe',
    wallet:      'wallet',
  },
  // North America
  north_america: {
    card:        'stripe',
    apple_pay:   'stripe',
    google_pay:  'stripe',
    wallet:      'wallet',
  },
  // Global fallback
  global: {
    card:   'stripe',
    wallet: 'wallet',
  },
}

// ─────────────────────────────────────────────────────────────
// CURRENCY → REGION MAP
// ─────────────────────────────────────────────────────────────

const CURRENCY_REGION = {
  GHS: 'ghana',
  NGN: 'nigeria',
  KES: 'kenya',
  ZAR: 'south_africa',
  TZS: 'africa_other',
  UGX: 'africa_other',
  USD: 'north_america',
  EUR: 'europe',
  GBP: 'europe',
  CAD: 'north_america',
  AUD: 'global',
}

// ─────────────────────────────────────────────────────────────
// COUNTRY CODE → REGION
// ─────────────────────────────────────────────────────────────

const COUNTRY_REGION = {
  GH: 'ghana',   NG: 'nigeria',  KE: 'kenya',
  ZA: 'south_africa', TZ: 'africa_other', UG: 'africa_other',
  RW: 'africa_other', SN: 'africa_other', CI: 'africa_other',
  CM: 'africa_other', ZM: 'africa_other', ET: 'africa_other',
  GB: 'europe',   DE: 'europe',   FR: 'europe',
  NL: 'europe',   ES: 'europe',   IT: 'europe',
  US: 'north_america', CA: 'north_america',
  AU: 'global',   NZ: 'global',   SG: 'global',
}

// ─────────────────────────────────────────────────────────────
// PAYMENT METHOD AVAILABILITY PER REGION
// ─────────────────────────────────────────────────────────────

export const AVAILABLE_METHODS = {
  ghana: [
    { id: 'momo_mtn',        label: 'MTN MoMo',        icon: 'momo',    popular: true  },
    { id: 'momo_vodafone',   label: 'Vodafone Cash',   icon: 'momo',    popular: true  },
    { id: 'momo_airteltigo', label: 'AirtelTigo Money',icon: 'momo',    popular: false },
    { id: 'card',            label: 'Card',             icon: 'card',    popular: false },
    { id: 'bank_transfer',   label: 'Bank Transfer',   icon: 'bank',    popular: false },
    { id: 'wallet',          label: 'NovaPay Wallet',  icon: 'wallet',  popular: false },
  ],
  nigeria: [
    { id: 'bank_transfer',   label: 'Bank Transfer',   icon: 'bank',    popular: true  },
    { id: 'card',            label: 'Card',             icon: 'card',    popular: true  },
    { id: 'ussd',            label: 'USSD',             icon: 'ussd',    popular: true  },
    { id: 'wallet',          label: 'NovaPay Wallet',  icon: 'wallet',  popular: false },
  ],
  kenya: [
    { id: 'momo_mtn',        label: 'M-Pesa',           icon: 'momo',    popular: true  },
    { id: 'card',            label: 'Card',              icon: 'card',    popular: false },
    { id: 'wallet',          label: 'NovaPay Wallet',   icon: 'wallet',  popular: false },
  ],
  europe: [
    { id: 'card',            label: 'Card',              icon: 'card',    popular: true  },
    { id: 'apple_pay',       label: 'Apple Pay',         icon: 'apple',   popular: true  },
    { id: 'google_pay',      label: 'Google Pay',        icon: 'google',  popular: false },
    { id: 'wallet',          label: 'NovaPay Wallet',   icon: 'wallet',  popular: false },
  ],
  north_america: [
    { id: 'card',            label: 'Card',              icon: 'card',    popular: true  },
    { id: 'apple_pay',       label: 'Apple Pay',         icon: 'apple',   popular: true  },
    { id: 'google_pay',      label: 'Google Pay',        icon: 'google',  popular: false },
    { id: 'wallet',          label: 'NovaPay Wallet',   icon: 'wallet',  popular: false },
  ],
  africa_other: [
    { id: 'momo_mtn',        label: 'Mobile Money',      icon: 'momo',    popular: true  },
    { id: 'card',            label: 'Card',               icon: 'card',    popular: false },
    { id: 'bank_transfer',   label: 'Bank Transfer',     icon: 'bank',    popular: false },
    { id: 'wallet',          label: 'NovaPay Wallet',    icon: 'wallet',  popular: false },
  ],
  global: [
    { id: 'card',            label: 'Card',               icon: 'card',    popular: true  },
    { id: 'wallet',          label: 'NovaPay Wallet',    icon: 'wallet',  popular: false },
  ],
}

// ─────────────────────────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────────────────────────

/**
 * getProcessor
 * Determines which processor handles a given payment.
 *
 * @param {string} paymentMethod  — e.g. 'momo_mtn', 'card', 'wallet'
 * @param {string} currency       — e.g. 'GHS', 'USD'
 * @param {string} countryCode    — e.g. 'GH', 'US' (optional, overrides currency)
 * @returns {{ processor: string, region: string }}
 */
export function getProcessor(paymentMethod, currency = 'GHS', countryCode = null) {
  const region = countryCode
    ? (COUNTRY_REGION[countryCode.toUpperCase()] ?? 'global')
    : (CURRENCY_REGION[currency.toUpperCase()] ?? 'global')

  const routes  = PROCESSOR_ROUTES[region] ?? PROCESSOR_ROUTES.global
  const processor = routes[paymentMethod] ?? routes.card ?? 'stripe'

  return { processor, region }
}

/**
 * getAvailableMethods
 * Returns payment methods available for a region.
 *
 * @param {string} currency
 * @param {string} countryCode
 * @returns {Array}
 */
export function getAvailableMethods(currency = 'GHS', countryCode = null) {
  const region = countryCode
    ? (COUNTRY_REGION[countryCode.toUpperCase()] ?? 'global')
    : (CURRENCY_REGION[currency.toUpperCase()] ?? 'global')

  return AVAILABLE_METHODS[region] ?? AVAILABLE_METHODS.global
}

/**
 * getRegion
 */
export function getRegion(currency = 'GHS', countryCode = null) {
  if (countryCode) return COUNTRY_REGION[countryCode.toUpperCase()] ?? 'global'
  return CURRENCY_REGION[currency.toUpperCase()] ?? 'global'
}

/**
 * isMoMoMethod
 */
export function isMoMoMethod(method) {
  return ['momo_mtn','momo_vodafone','momo_airteltigo'].includes(method)
}

/**
 * isStripeMethod
 */
export function isStripeMethod(method) {
  return ['card','apple_pay','google_pay'].includes(method)
}

/**
 * isWalletMethod
 */
export function isWalletMethod(method) {
  return method === 'wallet'
}