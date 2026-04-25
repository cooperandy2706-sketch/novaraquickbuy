// Detect user's country from IP using a free geolocation API
// Called once on first visit to set default locale/currency/country
 
export const detectCountryFromIp = async () => {
  try {
    // Using ipapi.co — free tier: 1000 req/day
    const res  = await fetch('https://ipapi.co/json/', { cache: 'no-store' })
    const data = await res.json()
    return {
      country:  data.country_code || 'GH',
      currency: data.currency     || 'GHS',
      timezone: data.timezone     || 'Africa/Accra',
      language: data.languages?.split(',')[0]?.split('-')[0] || 'en',
    }
  } catch {
    // Fallback — default to Ghana
    return { country: 'GH', currency: 'GHS', timezone: 'Africa/Accra', language: 'en' }
  }
}
