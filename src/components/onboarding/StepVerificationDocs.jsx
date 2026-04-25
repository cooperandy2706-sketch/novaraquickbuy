'use client'

import { useState }              from 'react'
import { ShieldCheck, FileText, Camera, ChevronRight, ChevronLeft, AlertCircle, Upload, Lock } from 'lucide-react'
import { saveVerificationDocs }   from '@/lib/actions/onboarding'
import OnboardingImageUploader    from '@/components/onboarding/OnboardingImageUploader'
import { cn }                     from '@/utils/cn'

const ID_TYPES = [
  { value: 'national_id',     label: 'National ID',         desc: 'Government-issued national identity card', emoji: '🪪' },
  { value: 'passport',        label: 'Passport',            desc: 'International travel document',            emoji: '📔' },
  { value: 'drivers_license', label: "Driver's License",    desc: 'Government-issued driving licence',        emoji: '🚗' },
  { value: 'residence_permit',label: 'Residence Permit',    desc: 'Residency or work permit card',            emoji: '📋' },
]

export default function StepVerificationDocs({ vendor, onNext, onBack }) {
  const [form, setForm] = useState({
    id_type:      vendor?.id_type      ?? '',
    id_front_url: vendor?.id_front_url ?? '',
    id_back_url:  vendor?.id_back_url  ?? '',
    selfie_url:   vendor?.selfie_url   ?? '',
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.id_type)            e.id_type      = 'Select an ID type'
    if (!form.id_front_url.trim())e.id_front_url = 'Front of ID is required'
    return e
  }

  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    const res = await saveVerificationDocs(form)
    setLoading(false)
    if (res?.error) { setErrors({ _form: res.error }); return }
    onNext(res.data)
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-700 to-violet-600 p-5 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="sm:hidden" />
            <ShieldCheck size={22} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="font-bold text-lg sm:text-xl leading-tight">Identity verification</h2>
            <p className="text-violet-200 text-xs sm:text-sm mt-1">
              Verification protects buyers and unlocks full vendor features.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { icon: '🛡️', text: 'Badge' },
            { icon: '💰', text: 'Payouts' },
            { icon: '📈', text: 'Search' },
          ].map(b => (
            <div key={b.text} className="flex flex-col items-center gap-1 sm:gap-1.5 bg-white/10 rounded-xl px-1.5 py-2.5 sm:py-3 text-center">
              <span className="text-base sm:text-xl">{b.icon}</span>
              <p className="text-[10px] sm:text-[11px] text-violet-100 font-medium leading-tight">{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-4">
        <Lock size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-800 mb-0.5">Your data is encrypted and safe</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Documents are used for identity verification only. They are stored securely and never shared with buyers or third parties.
          </p>
        </div>
      </div>

      {/* ID Type */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <FileText size={14} className="text-brand" /> ID Document Type *
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-3">
          {errors.id_type && <p className="text-xs text-danger font-medium">{errors.id_type}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ID_TYPES.map(id => (
              <button
                key={id.value}
                type="button"
                onClick={() => set('id_type', id.value)}
                className={cn(
                  'flex items-start gap-3 px-4 py-4 rounded-xl border text-left transition-all duration-150',
                  form.id_type === id.value
                    ? 'border-brand bg-brand-50 ring-2 ring-brand/20'
                    : 'border-neutral-200 hover:border-brand-200 hover:bg-neutral-50',
                )}
              >
                <span className="text-xl leading-none mt-0.5">{id.emoji}</span>
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold leading-tight', form.id_type === id.value ? 'text-brand-800' : 'text-neutral-700')}>
                    {id.label}
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-tight sm:leading-normal">{id.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload docs */}
      {form.id_type && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
            <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
              <Upload size={14} className="text-brand" /> Upload Documents
            </h3>
          </div>
          <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
            <OnboardingImageUploader
              label="Front of ID *"
              hint="Clear photo of the front of your ID — all text must be readable"
              url={form.id_front_url}
              onChange={v => set('id_front_url', v)}
              error={errors.id_front_url}
              bucket="vendor-documents"
              folder="id-documents"
              preview="wide"
              icon={Camera}
            />

            {form.id_type !== 'passport' && (
              <OnboardingImageUploader
                label="Back of ID"
                hint="Back side of your ID (optional but recommended)"
                url={form.id_back_url}
                onChange={v => set('id_back_url', v)}
                bucket="vendor-documents"
                folder="id-documents"
                preview="wide"
                icon={Camera}
              />
            )}

            <OnboardingImageUploader
              label="Selfie with ID"
              hint="A photo of you holding your ID next to your face (optional — speeds up verification)"
              url={form.selfie_url}
              onChange={v => set('selfie_url', v)}
              bucket="vendor-documents"
              folder="selfies"
              preview="wide"
              icon={Camera}
            />
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-amber-800 flex items-center gap-2"><AlertCircle size={13} /> Tips for faster approval</p>
        <ul className="space-y-1">
          {[
            'Make sure all text on the ID is clearly visible',
            'Avoid glare, shadows, or blurry images',
            'The full ID must be in frame — no cropping',
            'Selfies should show your face and ID clearly',
          ].map(tip => (
            <li key={tip} className="text-xs text-amber-700 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5 shrink-0">•</span> {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Review notice */}
      <div className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
        <Camera size={15} className="text-neutral-400 shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-500 leading-relaxed">
          Our team will review your submission within <span className="font-semibold text-neutral-700">24–48 hours</span>. You'll receive an email once verified. You can still set up your store while waiting.
        </p>
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
            : <><span>Submit & Finish</span> <ChevronRight size={18} /></>
          }
        </button>
      </div>
    </div>
  )
}