'use client'

import { useState }      from 'react'
import { Truck, Package, Store, MapPin, ChevronRight, ChevronLeft, Clock, Coins, Info, CheckCircle2, Globe } from 'lucide-react'
import { saveShipping }  from '@/lib/actions/onboarding'
import { cn }            from '@/utils/cn'

const DELIVERY_OPTIONS = [
  {
    value: 'vendor_delivery',
    label: 'My Own Delivery',
    desc:  'You personally deliver to buyers, confirmed via OTP',
    emoji: '🚴',
  },
  {
    value: 'courier_shipping',
    label: 'Courier / Shipping',
    desc:  'Use DHL, FedEx, UPS, or any local courier service',
    emoji: '📦',
  },
  {
    value: 'platform_delivery',
    label: 'Novara Delivery',
    desc:  'Our platform drivers handle pickup and delivery',
    emoji: '🚗',
  },
  {
    value: 'store_pickup',
    label: 'Store Pickup',
    desc:  'Buyers collect from your location (QR scan at pickup)',
    emoji: '🏪',
  },
]

const SHIPPING_ZONES = [
  'North America', 'South America', 'Western Europe', 'Eastern Europe',
  'West Africa', 'East Africa', 'Southern Africa', 'North Africa',
  'Middle East', 'South Asia', 'Southeast Asia', 'East Asia',
  'Central Asia', 'Oceania / Pacific', 'Caribbean',
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

export default function StepShipping({ vendor, onNext, onBack }) {
  const [form, setForm] = useState({
    delivery_methods:        vendor?.delivery_methods        ?? [],
    ships_nationwide:        vendor?.ships_nationwide        ?? true,
    shipping_regions:        vendor?.shipping_regions        ?? [],
    base_shipping_fee:       vendor?.base_shipping_fee       ?? '',
    free_shipping_threshold: vendor?.free_shipping_threshold ?? '',
    avg_processing_days:     vendor?.avg_processing_days     ?? 1,
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const toggleMethod = (val) => {
    setForm(f => ({
      ...f,
      delivery_methods: f.delivery_methods.includes(val)
        ? f.delivery_methods.filter(m => m !== val)
        : [...f.delivery_methods, val],
    }))
    if (errors.delivery_methods) setErrors(e => ({ ...e, delivery_methods: '' }))
  }

  const toggleRegion = (r) => {
    setForm(f => ({
      ...f,
      shipping_regions: f.shipping_regions.includes(r)
        ? f.shipping_regions.filter(x => x !== r)
        : [...f.shipping_regions, r],
    }))
  }

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (form.delivery_methods.length === 0) e.delivery_methods = 'Select at least one delivery method'
    if (!form.ships_nationwide && form.shipping_regions.length === 0)
      e.shipping_regions = 'Select at least one region'
    return e
  }

  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    const res = await saveShipping(form)
    setLoading(false)
    if (res?.error) { setErrors({ _form: res.error }); return }
    onNext(res.data)
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 p-5 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Truck size={20} className="sm:hidden" />
            <Truck size={22} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="font-bold text-lg sm:text-xl leading-tight">Shipping & delivery</h2>
            <p className="text-orange-100 text-xs sm:text-sm mt-1">
              Configure how your products reach buyers. You can update this anytime.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-5 flex items-start gap-2.5 bg-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-sm">
          <Info size={14} className="text-orange-200 shrink-0 mt-0.5" />
          <span className="text-orange-100">Offering <span className="font-bold text-white">multiple delivery methods</span> increases buyer confidence and sales conversions.</span>
        </div>
      </div>

      {/* Delivery methods */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <Truck size={14} className="text-brand" /> Delivery Methods *
            <span className="ml-auto text-[10px] sm:text-xs font-normal text-neutral-400">Select all that apply</span>
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-3">
          {errors.delivery_methods && <p className="text-xs text-danger font-medium">{errors.delivery_methods}</p>}
          {DELIVERY_OPTIONS.map(opt => {
            const selected = form.delivery_methods.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleMethod(opt.value)}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all duration-150',
                  selected
                    ? 'border-brand bg-brand-50 ring-2 ring-brand/20'
                    : 'border-neutral-200 hover:border-brand-200 hover:bg-neutral-50',
                )}
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', selected ? 'text-brand-800' : 'text-neutral-700')}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-tight sm:leading-normal">{opt.desc}</p>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded flex items-center justify-center transition-all shrink-0',
                  selected ? 'bg-brand border-brand' : 'border-2 border-neutral-300',
                )}>
                  {selected && <CheckCircle2 size={14} className="text-white fill-brand" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Coverage */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <MapPin size={14} className="text-brand" /> Delivery Coverage
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          {/* Nationwide toggle */}
          <button
            type="button"
            onClick={() => set('ships_nationwide', !form.ships_nationwide)}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all',
              form.ships_nationwide
                ? 'border-brand bg-brand-50 ring-2 ring-brand/20'
                : 'border-neutral-200 hover:border-brand-200',
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
              form.ships_nationwide ? "bg-brand text-white" : "bg-neutral-100 text-neutral-400"
            )}>
              <Globe size={24} />
            </div>
            <div className="flex-1 text-left">
              <p className={cn('text-sm font-semibold', form.ships_nationwide ? 'text-brand-800' : 'text-neutral-700')}>
                Ship Nationwide
              </p>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">Ship to all regions worldwide</p>
            </div>
            <div className={cn(
              'w-12 h-6 rounded-full transition-all duration-200 relative shrink-0',
              form.ships_nationwide ? 'bg-brand' : 'bg-neutral-200',
            )}>
              <div className={cn(
                'w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all duration-200',
                form.ships_nationwide ? 'left-6' : 'left-0.5',
              )} />
            </div>
          </button>

          {/* Specific regions */}
          {!form.ships_nationwide && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-brand-800">Select Shipping Zones *</p>
              {errors.shipping_regions && <p className="text-xs text-danger font-medium">{errors.shipping_regions}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SHIPPING_ZONES.map(r => {
                  const sel = form.shipping_regions.includes(r)
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRegion(r)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all',
                        sel
                          ? 'border-brand bg-brand-50 text-brand-800'
                          : 'border-neutral-200 text-neutral-600 hover:border-brand-200',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                        sel ? 'bg-brand border-brand' : 'border-neutral-300',
                      )}>
                        {sel && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fees & Timing */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <Coins size={14} className="text-brand" /> Shipping Fees & Processing Time
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Base Shipping Fee (your currency)"
              hint="Leave 0 for free shipping on all orders">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0.00"
                  value={form.base_shipping_fee}
                  onChange={e => set('base_shipping_fee', e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white pl-8 pr-4 py-3 text-sm text-brand-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>
            </Field>

            <Field label="Free Shipping Threshold"
              hint="Orders above this amount ship free">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 200"
                  value={form.free_shipping_threshold}
                  onChange={e => set('free_shipping_threshold', e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white pl-8 pr-4 py-3 text-sm text-brand-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>
            </Field>
          </div>

          <Field label="Average Processing Time"
            hint="How many days before an order is ready to ship/deliver?">
            <div className="flex gap-2">
              {[1, 2, 3, 5, 7].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('avg_processing_days', d)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                    form.avg_processing_days === d
                      ? 'border-brand bg-brand-50 text-brand-800 ring-2 ring-brand/20'
                      : 'border-neutral-200 text-neutral-600 hover:border-brand-200',
                  )}
                >
                  {d === 1 ? 'Same' : `${d}d`}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
              <Clock size={11} />
              {form.avg_processing_days === 1
                ? 'Orders are prepared same day'
                : `Orders are prepared within ${form.avg_processing_days} business days`}
            </p>
          </Field>

          {/* Free shipping tip */}
          {form.free_shipping_threshold && Number(form.free_shipping_threshold) > 0 && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <Info size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700">
                Buyers will see <span className="font-semibold">"Free shipping on orders above {form.free_shipping_threshold}"</span> — this boosts average order value significantly.
              </p>
            </div>
          )}
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