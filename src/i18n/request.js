import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
 
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
 
  // Fallback to default if locale not supported
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale
  }
 
  // Load all namespace files for this locale
  const namespaces = ['common', 'feed', 'product', 'checkout', 'orders', 'vendor', 'auth', 'settings', 'errors']
  const messages   = {}
 
  for (const ns of namespaces) {
    try {
      messages[ns] = (await import(`./messages/${locale}/${ns}.json`)).default
    } catch {
      // Fallback to English for missing translations
      try {
        messages[ns] = (await import(`./messages/en/${ns}.json`)).default
      } catch {
        messages[ns] = {}
      }
    }
  }
 
  return { locale, messages }
})
