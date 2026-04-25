'use client'
import { useLocaleStore } from '@/store/localeStore'
import { LOCALES } from '@/constants/global/locales'
import { useRouter, usePathname } from '@/i18n/navigation'
 
export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocaleStore()
  const router   = useRouter()
  const pathname = usePathname()
 
  const handleChange = (e) => {
    const newLocale = e.target.value
    setLocale(newLocale)
    router.replace(pathname, { locale: newLocale })
  }
 
  return (
    <select
      value={locale}
      onChange={handleChange}
      className="text-sm bg-transparent border border-gray-200 rounded-md px-2 py-1 cursor-pointer"
      aria-label="Select language"
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.nativeName}
        </option>
      ))}
    </select>
  )
}
