// Shipping zones group countries for delivery pricing and logistics
export const SHIPPING_ZONES = [
  {
    id:        'west_africa',
    name:      'West Africa',
    countries: ['GH','NG','SN','CI','CM','BJ','TG','BF','ML','NE','GN','LR','SL','GW','CV','MR','GM'],
    baseRate:  5.00,
    currency:  'USD',
    estDays:   '2-5',
  },
  {
    id:        'east_africa',
    name:      'East Africa',
    countries: ['KE','TZ','UG','RW','ET','SD','DJ','SO','ER','BI'],
    baseRate:  6.00,
    currency:  'USD',
    estDays:   '3-6',
  },
  {
    id:        'southern_africa',
    name:      'Southern Africa',
    countries: ['ZA','ZM','ZW','MW','MZ','BW','NA','LS','SZ','MG','MU'],
    baseRate:  7.00,
    currency:  'USD',
    estDays:   '3-7',
  },
  {
    id:        'north_africa',
    name:      'North Africa',
    countries: ['EG','MA','TN','DZ','LY'],
    baseRate:  8.00,
    currency:  'USD',
    estDays:   '4-7',
  },
  {
    id:        'europe',
    name:      'Europe',
    countries: ['GB','DE','FR','ES','IT','NL','BE','SE','NO','DK','FI','CH','AT','PL','PT'],
    baseRate:  12.00,
    currency:  'USD',
    estDays:   '5-10',
  },
  {
    id:        'north_america',
    name:      'North America',
    countries: ['US','CA','MX'],
    baseRate:  15.00,
    currency:  'USD',
    estDays:   '7-14',
  },
  {
    id:        'middle_east',
    name:      'Middle East',
    countries: ['AE','SA','QA','KW','BH','OM','JO','LB'],
    baseRate:  10.00,
    currency:  'USD',
    estDays:   '5-10',
  },
  {
    id:        'asia_pacific',
    name:      'Asia Pacific',
    countries: ['CN','IN','SG','AU','JP','KR','MY','TH','ID','PH','VN','NZ'],
    baseRate:  14.00,
    currency:  'USD',
    estDays:   '7-14',
  },
  {
    id:        'latin_america',
    name:      'Latin America',
    countries: ['BR','AR','CO','CL','PE','VE','EC','UY','PY','BO'],
    baseRate:  16.00,
    currency:  'USD',
    estDays:   '10-20',
  },
]
 
export const getShippingZone = (countryCode) =>
  SHIPPING_ZONES.find(z => z.countries.includes(countryCode))
 
export const getShippingRate = (countryCode) =>
  getShippingZone(countryCode)?.baseRate || 20.00
