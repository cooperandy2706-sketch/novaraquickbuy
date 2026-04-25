'use client'
import { useTranslations } from 'next-intl'
import CountrySelect from './CountrySelect'
import PhoneInput    from './PhoneInput'
 
export default function AddressForm({ value = {}, onChange }) {
  const t = useTranslations('checkout')
 
  const update = (field, val) => onChange({ ...value, [field]: val })
 
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('firstName')}</label>
          <input type="text" value={value.firstName || ''} onChange={(e) => update('firstName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('lastName')}</label>
          <input type="text" value={value.lastName || ''} onChange={(e) => update('lastName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
 
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
        <PhoneInput value={value.phone || ''} onChange={(val) => update('phone', val)} />
      </div>
 
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
        <input type="text" value={value.address || ''} onChange={(e) => update('address', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('city')}</label>
          <input type="text" value={value.city || ''} onChange={(e) => update('city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('postalCode')}</label>
          <input type="text" value={value.postalCode || ''} onChange={(e) => update('postalCode', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
 
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('country')}</label>
        <CountrySelect value={value.country || ''} onChange={(val) => update('country', val)} />
      </div>
    </div>
  )
}
