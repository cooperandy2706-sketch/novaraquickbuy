// Format an address object into a display string
// Different countries have different address formats
 
export const formatAddress = (address) => {
  if (!address) return ''
  const { firstName, lastName, address: street, city, state, postalCode, country } = address
  const name = [firstName, lastName].filter(Boolean).join(' ')
 
  // Countries that put postal code before city
  const postalFirst = ['DE','FR','ES','IT','NL','CH','AT','PL','SE','NO','DK','FI','BR','CN','IN']
 
  if (postalFirst.includes(country)) {
    return [name, street, `${postalCode} ${city}`, state, country].filter(Boolean).join(', ')
  }
 
  // Default: city, state, postal, country
  return [name, street, city, state, postalCode, country].filter(Boolean).join(', ')
}
