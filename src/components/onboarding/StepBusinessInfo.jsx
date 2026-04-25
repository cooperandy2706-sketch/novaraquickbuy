'use client'

import { useState }          from 'react'
import { Building2, Mail, Phone, MapPin, ChevronRight, ChevronLeft, Hash, Globe, Info } from 'lucide-react'
import { saveBusinessInfo }  from '@/lib/actions/onboarding'
import { cn }                from '@/utils/cn'

const BUSINESS_TYPES = [
  { value: 'individual',   label: 'Individual / Sole Trader', desc: 'Selling as a person, no registered company', emoji: '👤' },
  { value: 'registered',   label: 'Registered Business',      desc: 'Company with official registration',         emoji: '🏢' },
  { value: 'partnership',  label: 'Partnership',              desc: 'Two or more people running the business',    emoji: '🤝' },
]

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia',
  'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Cambodia',
  'Cameroon', 'Canada', 'Chile', 'China', 'Colombia',
  "Côte d'Ivoire", 'Croatia', 'Czech Republic', 'Denmark', 'Egypt',
  'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana',
  'Greece', 'Hungary', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan',
  'Jordan', 'Kenya', 'Malaysia', 'Mexico', 'Morocco',
  'Mozambique', 'Myanmar', 'Netherlands', 'New Zealand', 'Nigeria',
  'Norway', 'Pakistan', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia',
  'Senegal', 'Singapore', 'South Africa', 'South Korea', 'Spain',
  'Sri Lanka', 'Sweden', 'Switzerland', 'Tanzania', 'Thailand',
  'Turkey', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Vietnam', 'Zimbabwe', 'Other',
]

function Field({ label, required, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-brand-800">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-neutral-400 leading-relaxed">{hint}</p>}
      {children}
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  )
}

function TextInput({ icon: Icon, error, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />}
      <input
        {...props}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-sm text-brand-900 placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
          Icon && 'pl-10',
          error ? 'border-danger/50 bg-danger/5' : 'border-neutral-200 hover:border-neutral-300',
        )}
      />
    </div>
  )
}

export default function StepBusinessInfo({ vendor, onNext, onBack }) {
  const [form, setForm] = useState({
    business_type:       vendor?.business_type        ?? '',
    business_reg_name:   vendor?.business_reg_name    ?? '',
    business_reg_number: vendor?.business_reg_number  ?? '',
    business_email:      vendor?.business_email       ?? '',
    business_phone:      vendor?.business_phone       ?? '',
    business_address:    vendor?.business_address     ?? '',
    business_city:       vendor?.business_city        ?? '',
    business_country:    vendor?.business_country     ?? '',
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.business_type)            e.business_type      = 'Select your business type'
    if (!form.business_reg_name.trim()) e.business_reg_name  = 'Legal name is required'
    if (!form.business_email.trim())    e.business_email     = 'Business email is required'
    if (!/\S+@\S+\.\S+/.test(form.business_email)) e.business_email = 'Enter a valid email'
    if (!form.business_phone.trim())    e.business_phone     = 'Phone number is required'
    if (!form.business_address.trim())  e.business_address   = 'Address is required'
    if (!form.business_city.trim())     e.business_city      = 'City is required'
    if (!form.business_country)         e.business_country   = 'Country is required'
    return e
  }

  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    const res = await saveBusinessInfo(form)
    setLoading(false)
    if (res?.error) { setErrors({ _form: res.error }); return }
    onNext(res.data)
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-700 p-5 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Building2 size={20} className="sm:hidden" />
            <Building2 size={22} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="font-bold text-lg sm:text-xl leading-tight">Business information</h2>
            <p className="text-neutral-300 text-xs sm:text-sm mt-1">
              This helps us verify your store and process payouts correctly.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-5 flex items-start gap-2.5 bg-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-sm">
          <Info size={14} className="text-blue-300 shrink-0 mt-0.5" />
          <span className="text-neutral-200">Your business details are kept private and only used for verification and payouts.</span>
        </div>
      </div>

      {/* Business Type */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <Building2 size={14} className="text-brand" /> Business Type *
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-3">
          {errors.business_type && (
            <p className="text-xs text-danger font-medium">{errors.business_type}</p>
          )}
          {BUSINESS_TYPES.map(bt => (
            <button
              key={bt.value}
              type="button"
              onClick={() => set('business_type', bt.value)}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all duration-150',
                form.business_type === bt.value
                  ? 'border-brand bg-brand-50 ring-2 ring-brand/20'
                  : 'border-neutral-200 hover:border-brand-200 hover:bg-neutral-50',
              )}
            >
              <span className="text-2xl leading-none">{bt.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold', form.business_type === bt.value ? 'text-brand-800' : 'text-neutral-700')}>{bt.label}</p>
                <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-tight sm:leading-normal">{bt.desc}</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                form.business_type === bt.value ? 'border-brand bg-brand' : 'border-neutral-300',
              )}>
                {form.business_type === bt.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Legal Details */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <Hash size={14} className="text-brand" /> Legal Details
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <Field label="Legal / Registered Name" required
            hint="The official name of your business or your full name if individual"
            error={errors.business_reg_name}>
            <TextInput
              icon={Building2}
              placeholder="e.g. John Smith or Acme Trading Ltd"
              value={form.business_reg_name}
              onChange={e => set('business_reg_name', e.target.value)}
              error={errors.business_reg_name}
            />
          </Field>

          {form.business_type === 'registered' && (
            <Field label="Registration Number"
              hint="Your company's official registration number (optional but recommended)">
              <TextInput
                icon={Hash}
                placeholder="e.g. CS000123456"
                value={form.business_reg_number}
                onChange={e => set('business_reg_number', e.target.value)}
              />
            </Field>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <Mail size={14} className="text-brand" /> Contact Information
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <Field label="Business Email" required error={errors.business_email}
            hint="Used for order notifications and payouts">
            <TextInput
              icon={Mail}
              type="email"
              placeholder="hello@yourbusiness.com"
              value={form.business_email}
              onChange={e => set('business_email', e.target.value)}
              error={errors.business_email}
            />
          </Field>

          <Field label="Business Phone" required error={errors.business_phone}
            hint="Your primary contact number">
            <TextInput
              icon={Phone}
              type="tel"
              placeholder="+1 555 000 0000"
              value={form.business_phone}
              onChange={e => set('business_phone', e.target.value)}
              error={errors.business_phone}
            />
          </Field>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <MapPin size={14} className="text-brand" /> Business Address
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <Field label="Street Address" required error={errors.business_address}>
            <TextInput
              icon={MapPin}
              placeholder="e.g. 123 Main Street"
              value={form.business_address}
              onChange={e => set('business_address', e.target.value)}
              error={errors.business_address}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" required error={errors.business_city}>
              <TextInput
                placeholder="e.g. New York"
                value={form.business_city}
                onChange={e => set('business_city', e.target.value)}
                error={errors.business_city}
              />
            </Field>

            <Field label="Country" required error={errors.business_country}>
              <div className="relative">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10" />
                <select
                  value={form.business_country}
                  onChange={e => set('business_country', e.target.value)}
                  className={cn(
                    'w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm text-brand-900 appearance-none',
                    'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
                    errors.business_country ? 'border-danger/50' : 'border-neutral-200',
                  )}
                >
                  <option value="">Select your country…</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </Field>
          </div>
        </div>
      </div>

      {errors._form && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger font-medium">
          {errors._form}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-4 rounded-xl border border-neutral-200 text-neutral-600 font-semibold text-sm hover:bg-neutral-50 transition-all active:scale-[0.98]"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 disabled:opacity-60 text-white font-bold rounded-xl py-4 text-base transition-all shadow-brand active:scale-[0.98]"
        >
          {loading
            ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><span>Save & Continue</span> <ChevronRight size={18} /></>
          }
        </button>
      </div>
    </div>
  )
}