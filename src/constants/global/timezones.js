// Key timezones mapped to regions / countries
export const TIMEZONES = [
  { tz: 'Africa/Accra',      offset: 'UTC+0',   label: 'Accra, Lomé, Dakar',      countries: ['GH','TG','SN','GN'] },
  { tz: 'Africa/Lagos',      offset: 'UTC+1',   label: 'Lagos, Abuja, Douala',     countries: ['NG','CM','BJ','NE'] },
  { tz: 'Africa/Nairobi',    offset: 'UTC+3',   label: 'Nairobi, Kampala, Dar',    countries: ['KE','UG','TZ','ET','RW'] },
  { tz: 'Africa/Cairo',      offset: 'UTC+2',   label: 'Cairo',                    countries: ['EG'] },
  { tz: 'Africa/Casablanca', offset: 'UTC+1',   label: 'Casablanca, Rabat',        countries: ['MA'] },
  { tz: 'Africa/Johannesburg',offset:'UTC+2',   label: 'Johannesburg, Lusaka',     countries: ['ZA','ZM','ZW'] },
  { tz: 'Europe/London',     offset: 'UTC+0/+1',label: 'London',                   countries: ['GB'] },
  { tz: 'Europe/Paris',      offset: 'UTC+1/+2',label: 'Paris, Berlin, Rome',      countries: ['FR','DE','IT','ES','NL'] },
  { tz: 'America/New_York',  offset: 'UTC-5/-4',label: 'New York, Toronto',        countries: ['US','CA'] },
  { tz: 'America/Sao_Paulo', offset: 'UTC-3',   label: 'São Paulo',                countries: ['BR'] },
  { tz: 'Asia/Dubai',        offset: 'UTC+4',   label: 'Dubai, Abu Dhabi',         countries: ['AE','OM'] },
  { tz: 'Asia/Riyadh',       offset: 'UTC+3',   label: 'Riyadh',                   countries: ['SA'] },
  { tz: 'Asia/Shanghai',     offset: 'UTC+8',   label: 'Shanghai, Beijing',        countries: ['CN'] },
  { tz: 'Asia/Kolkata',      offset: 'UTC+5:30',label: 'Mumbai, Delhi',            countries: ['IN'] },
  { tz: 'Asia/Singapore',    offset: 'UTC+8',   label: 'Singapore',                countries: ['SG','MY'] },
  { tz: 'Australia/Sydney',  offset: 'UTC+10',  label: 'Sydney, Melbourne',        countries: ['AU'] },
]
 
export const getTimezoneForCountry = (countryCode) =>
  TIMEZONES.find(t => t.countries.includes(countryCode))?.tz || 'UTC'
