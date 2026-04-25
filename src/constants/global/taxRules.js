// VAT / Tax rules per country
// Novara collects and remits tax where legally required
export const TAX_RULES = [
  { country: 'GH', taxName: 'VAT',       rate: 0.15,  inclusive: false, description: 'Ghana Value Added Tax (15%)' },
  { country: 'NG', taxName: 'VAT',       rate: 0.075, inclusive: false, description: 'Nigeria VAT (7.5%)' },
  { country: 'ZA', taxName: 'VAT',       rate: 0.15,  inclusive: true,  description: 'South Africa VAT (15%)' },
  { country: 'KE', taxName: 'VAT',       rate: 0.16,  inclusive: false, description: 'Kenya VAT (16%)' },
  { country: 'GB', taxName: 'VAT',       rate: 0.20,  inclusive: true,  description: 'UK VAT (20%)' },
  { country: 'DE', taxName: 'MwSt',      rate: 0.19,  inclusive: true,  description: 'Germany VAT (19%)' },
  { country: 'FR', taxName: 'TVA',       rate: 0.20,  inclusive: true,  description: 'France VAT (20%)' },
  { country: 'US', taxName: 'Sales Tax', rate: null,   inclusive: false, description: 'US sales tax — varies by state' },
  { country: 'AE', taxName: 'VAT',       rate: 0.05,  inclusive: false, description: 'UAE VAT (5%)' },
  { country: 'AU', taxName: 'GST',       rate: 0.10,  inclusive: true,  description: 'Australia GST (10%)' },
  { country: 'IN', taxName: 'GST',       rate: 0.18,  inclusive: false, description: 'India GST (18%)' },
  { country: 'BR', taxName: 'ICMS',      rate: 0.17,  inclusive: true,  description: 'Brazil ICMS (~17%)' },
  { country: 'CN', taxName: 'VAT',       rate: 0.13,  inclusive: true,  description: 'China VAT (13%)' },
]
 
export const getTaxRule = (countryCode) =>
  TAX_RULES.find(t => t.country === countryCode) || null
 
export const calcTax = (amount, countryCode) => {
  const rule = getTaxRule(countryCode)
  if (!rule || !rule.rate) return 0
  return rule.inclusive ? 0 : amount * rule.rate
}
