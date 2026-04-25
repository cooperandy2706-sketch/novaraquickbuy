// Full country list with ISO codes, currency, calling code, and locale
// Prioritised: Africa and high-traffic regions first
 
export const COUNTRIES = [
  // ── Africa ───────────────────────────────────────────────
  { code: 'GH', name: 'Ghana',               currency: 'GHS', callingCode: '+233', locale: 'en',  flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria',             currency: 'NGN', callingCode: '+234', locale: 'en',  flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya',               currency: 'KES', callingCode: '+254', locale: 'sw',  flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania',            currency: 'TZS', callingCode: '+255', locale: 'sw',  flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda',              currency: 'UGX', callingCode: '+256', locale: 'sw',  flag: '🇺🇬' },
  { code: 'ZA', name: 'South Africa',        currency: 'ZAR', callingCode: '+27',  locale: 'en',  flag: '🇿🇦' },
  { code: 'SN', name: 'Senegal',             currency: 'XOF', callingCode: '+221', locale: 'fr',  flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire",       currency: 'XOF', callingCode: '+225', locale: 'fr',  flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon',            currency: 'XAF', callingCode: '+237', locale: 'fr',  flag: '🇨🇲' },
  { code: 'EG', name: 'Egypt',               currency: 'EGP', callingCode: '+20',  locale: 'ar',  flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco',             currency: 'MAD', callingCode: '+212', locale: 'ar',  flag: '🇲🇦' },
  { code: 'ET', name: 'Ethiopia',            currency: 'ETB', callingCode: '+251', locale: 'en',  flag: '🇪🇹' },
  { code: 'RW', name: 'Rwanda',              currency: 'RWF', callingCode: '+250', locale: 'fr',  flag: '🇷🇼' },
  { code: 'ZM', name: 'Zambia',              currency: 'ZMW', callingCode: '+260', locale: 'en',  flag: '🇿🇲' },
  // ── Americas ─────────────────────────────────────────────
  { code: 'US', name: 'United States',       currency: 'USD', callingCode: '+1',   locale: 'en',  flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',              currency: 'CAD', callingCode: '+1',   locale: 'en',  flag: '🇨🇦' },
  { code: 'BR', name: 'Brazil',              currency: 'BRL', callingCode: '+55',  locale: 'pt',  flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico',              currency: 'MXN', callingCode: '+52',  locale: 'es',  flag: '🇲🇽' },
  // ── Europe ───────────────────────────────────────────────
  { code: 'GB', name: 'United Kingdom',      currency: 'GBP', callingCode: '+44',  locale: 'en',  flag: '🇬🇧' },
  { code: 'DE', name: 'Germany',             currency: 'EUR', callingCode: '+49',  locale: 'de',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',              currency: 'EUR', callingCode: '+33',  locale: 'fr',  flag: '🇫🇷' },
  { code: 'ES', name: 'Spain',               currency: 'EUR', callingCode: '+34',  locale: 'es',  flag: '🇪🇸' },
  { code: 'IT', name: 'Italy',               currency: 'EUR', callingCode: '+39',  locale: 'it',  flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands',         currency: 'EUR', callingCode: '+31',  locale: 'nl',  flag: '🇳🇱' },
  // ── Middle East ──────────────────────────────────────────
  { code: 'AE', name: 'UAE',                 currency: 'AED', callingCode: '+971', locale: 'ar',  flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia',        currency: 'SAR', callingCode: '+966', locale: 'ar',  flag: '🇸🇦' },
  // ── Asia ─────────────────────────────────────────────────
  { code: 'CN', name: 'China',               currency: 'CNY', callingCode: '+86',  locale: 'zh',  flag: '🇨🇳' },
  { code: 'IN', name: 'India',               currency: 'INR', callingCode: '+91',  locale: 'en',  flag: '🇮🇳' },
  { code: 'SG', name: 'Singapore',           currency: 'SGD', callingCode: '+65',  locale: 'en',  flag: '🇸🇬' },
  { code: 'AU', name: 'Australia',           currency: 'AUD', callingCode: '+61',  locale: 'en',  flag: '🇦🇺' },
]
 
export const DEFAULT_COUNTRY = 'GH'
 
export const getCountry     = (code)     => COUNTRIES.find(c => c.code === code) || COUNTRIES[0]
export const getCountryName = (code)     => getCountry(code)?.name || code
export const getCurrencyByCountry = (code) => getCountry(code)?.currency || 'USD'
export const getLocaleByCountry   = (code) => getCountry(code)?.locale  || 'en'
