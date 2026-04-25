// All supported locales for Novara Quickbuy
// Format: { code, name, nativeName, dir, region }
 
export const LOCALES = [
  { code: 'en',    name: 'English',            nativeName: 'English',      dir: 'ltr', region: 'Global'        },
  { code: 'fr',    name: 'French',             nativeName: 'Français',     dir: 'ltr', region: 'West Africa / Europe' },
  { code: 'ar',    name: 'Arabic',             nativeName: 'العربية',       dir: 'rtl', region: 'Middle East / N.Africa' },
  { code: 'sw',    name: 'Swahili',            nativeName: 'Kiswahili',    dir: 'ltr', region: 'East Africa'    },
  { code: 'pt',    name: 'Portuguese',         nativeName: 'Português',    dir: 'ltr', region: 'Brazil / Africa' },
  { code: 'zh',    name: 'Chinese (Simplified)',nativeName: '中文',          dir: 'ltr', region: 'China / SE Asia' },
  { code: 'es',    name: 'Spanish',            nativeName: 'Español',      dir: 'ltr', region: 'Latin America'  },
  { code: 'ha',    name: 'Hausa',              nativeName: 'Hausa',        dir: 'ltr', region: 'West Africa'    },
  { code: 'yo',    name: 'Yoruba',             nativeName: 'Yorùbá',       dir: 'ltr', region: 'West Africa'    },
  { code: 'ig',    name: 'Igbo',               nativeName: 'Igbo',         dir: 'ltr', region: 'West Africa'    },
]
 
export const DEFAULT_LOCALE = 'en'
 
export const LOCALE_CODES = LOCALES.map(l => l.code)
 
export const getLocale = (code) => LOCALES.find(l => l.code === code) || LOCALES[0]
