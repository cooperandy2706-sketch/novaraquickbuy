'use client'

import { useState }            from 'react'
import { Store, AtSign, Tag, ChevronRight, Sparkles, ImageIcon } from 'lucide-react'
import { saveStoreIdentity }        from '@/lib/actions/onboarding'
import OnboardingImageUploader      from '@/components/onboarding/OnboardingImageUploader'
import { cn }                       from '@/utils/cn'

const CATEGORIES = [
  { value: 'fashion',     label: 'Fashion & Apparel',     emoji: '👗' },
  { value: 'electronics', label: 'Electronics & Gadgets',  emoji: '📱' },
  { value: 'food',        label: 'Food & Groceries',       emoji: '🍎' },
  { value: 'beauty',      label: 'Beauty & Skincare',      emoji: '💄' },
  { value: 'home',        label: 'Home & Living',          emoji: '🏠' },
  { value: 'sports',      label: 'Sports & Fitness',       emoji: '⚽' },
  { value: 'books',       label: 'Books & Stationery',     emoji: '📚' },
  { value: 'automotive',  label: 'Automotive',             emoji: '🚗' },
  { value: 'health',      label: 'Health & Wellness',      emoji: '💊' },
  { value: 'kids',        label: 'Kids & Toys',            emoji: '🧸' },
  { value: 'art',         label: 'Art & Crafts',           emoji: '🎨' },
  { value: 'other',       label: 'Other',                  emoji: '📦' },
]

function Field({ label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-brand-800">{label}</label>
      {hint && <p className="text-xs text-neutral-400 leading-relaxed">{hint}</p>}
      {children}
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  )
}

function TextInput({ icon: Icon, error, className, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
      )}
      <input
        {...props}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-sm text-brand-900 placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
          Icon && 'pl-10',
          error ? 'border-danger/50 bg-danger/5' : 'border-neutral-200 hover:border-neutral-300',
          className,
        )}
      />
    </div>
  )
}

export default function StepStoreIdentity({ vendor, onNext }) {
  const [form, setForm] = useState({
    store_name:     vendor?.store_name     ?? '',
    store_handle:   vendor?.store_handle   ?? '',
    store_tagline:  vendor?.store_tagline  ?? '',
    store_category: vendor?.store_category ?? '',
    store_logo_url: vendor?.store_logo_url ?? '',
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const handleNameChange = (val) => {
    set('store_name', val)
    // Auto-generate handle only if user hasn't manually edited it
    if (!vendor?.store_handle) {
      const handle = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)
      setForm(f => ({ ...f, store_name: val, store_handle: handle }))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.store_name.trim())   e.store_name     = 'Store name is required'
    if (form.store_name.length > 60) e.store_name   = 'Max 60 characters'
    if (!form.store_handle.trim()) e.store_handle   = 'Handle is required'
    if (!/^[a-z0-9_]{3,24}$/.test(form.store_handle))
      e.store_handle = 'Lowercase letters, numbers, _ only · 3–24 chars'
    if (!form.store_category)      e.store_category = 'Please pick a category'
    return e
  }

  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    const res = await saveStoreIdentity(form)
    setLoading(false)
    if (res?.error) { setErrors({ _form: res.error }); return }
    onNext(res.data)
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-5 sm:p-6 text-white shadow-brand">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Store size={20} className="sm:hidden" />
            <Store size={22} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="font-bold text-lg sm:text-xl leading-tight">Build your store identity</h2>
            <p className="text-brand-200 text-xs sm:text-sm mt-1">
              Your store name and category help buyers discover you across the platform.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-5 flex items-center gap-2.5 bg-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-sm">
          <Sparkles size={14} className="text-yellow-300 shrink-0" />
          <span className="text-brand-100">Stores with a clear category get <span className="font-bold text-white">3× more</span> discovery traffic</span>
        </div>
      </div>

      {/* Name & Handle */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <Store size={14} className="text-brand" /> Store Name & Identity
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4 sm:y-5">
          <Field label="Store Name *" error={errors.store_name}
            hint="The name buyers will see across the platform">
            <TextInput
              icon={Store}
              placeholder="e.g. Ama's Fashion Hub"
              value={form.store_name}
              onChange={e => handleNameChange(e.target.value)}
              maxLength={60}
              error={errors.store_name}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-neutral-400">{form.store_name.length}/60</span>
            </div>
          </Field>

          <Field label="Store Handle *" error={errors.store_handle}
            hint="Your unique store URL · novara.com/@handle">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold select-none">@</span>
              <input
                className={cn(
                  'w-full rounded-xl border bg-white pl-9 pr-4 py-3 text-sm text-brand-900 placeholder:text-neutral-400',
                  'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
                  errors.store_handle ? 'border-danger/50 bg-danger/5' : 'border-neutral-200 hover:border-neutral-300',
                )}
                placeholder="amasfashionhub"
                value={form.store_handle}
                onChange={e => set('store_handle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24))}
              />
            </div>
          </Field>

          <Field label="Tagline"
            hint="One sentence that tells buyers what makes you special (optional)">
            <div className="relative">
              <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                className="w-full rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white pl-10 pr-4 py-3 text-sm text-brand-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="e.g. Trendy fashion delivered to your door, worldwide"
                value={form.store_tagline}
                onChange={e => set('store_tagline', e.target.value)}
                maxLength={100}
              />
            </div>
          </Field>
        </div>
      </div>

      {/* Category */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <Tag size={14} className="text-brand" /> Store Category *
          </h3>
        </div>
        <div className="p-5 sm:p-6">
          {errors.store_category && (
            <p className="text-xs text-danger font-medium mb-3">{errors.store_category}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => set('store_category', cat.value)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all duration-150',
                  form.store_category === cat.value
                    ? 'border-brand bg-brand-50 text-brand-800 ring-2 ring-brand/25 shadow-sm'
                    : 'border-neutral-200 text-neutral-600 hover:border-brand-200 hover:bg-brand-50/50',
                )}
              >
                <span className="text-xl leading-none">{cat.emoji}</span>
                <span className="text-xs font-medium leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <ImageIcon size={14} className="text-brand" /> Store Logo
            <span className="text-neutral-400 font-normal text-[10px] sm:text-xs ml-1">(optional)</span>
          </h3>
        </div>
        <div className="p-5 sm:p-6">
          <OnboardingImageUploader
            url={form.store_logo_url}
            onChange={url => set('store_logo_url', url)}
            bucket="vendor-logos"
            folder="logos"
            preview="avatar"
            hint="Upload your store logo. Square images work best. You can update this anytime."
          />
        </div>
      </div>

      {errors._form && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger font-medium">
          {errors._form}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 disabled:opacity-60 text-white font-bold rounded-xl py-4 text-base transition-all shadow-brand active:scale-[0.98]"
      >
        {loading
          ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><span>Save & Continue</span> <ChevronRight size={18} /></>
        }
      </button>
    </div>
  )
}