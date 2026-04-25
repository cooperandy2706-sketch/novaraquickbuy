'use client'

import { useState, useEffect, useRef } from 'react'
import { getOnboardingState }           from '@/lib/actions/onboarding'
import { cn }                           from '@/utils/cn'
import StepStoreIdentity                from '@/components/onboarding/StepStoreIdentity'
import StepBusinessInfo                 from '@/components/onboarding/StepBusinessInfo'
import StepPaymentSetup                 from '@/components/onboarding/StepPaymentSetup'
import StepShipping                     from '@/components/onboarding/StepShipping'
import StepVerificationDocs             from '@/components/onboarding/StepVerificationDocs'
import StepComplete                     from '@/components/onboarding/StepComplete'

const STEPS = [
  { num: 1, label: 'Store',    short: 'Store identity'    },
  { num: 2, label: 'Business', short: 'Business info'     },
  { num: 3, label: 'Payment',  short: 'Payment setup'     },
  { num: 4, label: 'Shipping', short: 'Shipping config'   },
  { num: 5, label: 'Verify',   short: 'Verification docs' },
  { num: 6, label: 'Done',     short: 'All set!'          },
]

export default function OnboardingPage() {
  const [step,    setStep]    = useState(1)
  const [vendor,  setVendor]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const initialised = useRef(false)

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    getOnboardingState()
      .then(data => {
        console.log('[onboarding] state loaded:', data)
        if (data) {
          setVendor(data)
          const savedStep = data.onboarding_complete
            ? 6
            : Math.min(Math.max(data.onboarding_step ?? 1, 1), 6)
          setStep(savedStep)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('[onboarding] getOnboardingState failed:', err)
        setError(err?.message ?? 'Failed to load onboarding state')
        setLoading(false)
      })
  }, [])

  const goNext = (updatedVendor) => {
    if (updatedVendor) setVendor(v => ({ ...v, ...updatedVendor }))
    setStep(s => Math.min(s + 1, 6))
  }

  const goBack = () => setStep(s => Math.max(s - 1, 1))

  // Loading state
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold shadow-brand animate-pulse">
            N
          </div>
          <p className="text-sm text-neutral-400">Loading your store setup...</p>
        </div>
      </div>
    )
  }

  // Error state — shows what went wrong instead of blank screen
  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-neutral-50">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500 font-bold text-xl">
            !
          </div>
          <div>
            <p className="font-semibold text-neutral-800 mb-1">Could not load your store setup</p>
            <p className="text-sm text-neutral-500">{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              initialised.current = false
              getOnboardingState()
                .then(data => {
                  if (data) {
                    setVendor(data)
                    const savedStep = data.onboarding_complete
                      ? 6
                      : Math.min(Math.max(data.onboarding_step ?? 1, 1), 6)
                    setStep(savedStep)
                  }
                  setLoading(false)
                })
                .catch(err => {
                  setError(err?.message ?? 'Failed to load onboarding state')
                  setLoading(false)
                })
            }}
            className="px-6 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-brand-50 via-white to-neutral-50">

      {/* Sticky header */}
      <div className="sticky top-0 z-overlay bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 py-4">

          {/* Logo */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold shadow-brand text-sm sm:text-base">
                N
              </div>
              <div>
                <p className="font-bold text-brand-800 text-xs sm:text-sm leading-none">Novara Quickbuy</p>
                <p className="text-neutral-400 text-[10px] sm:text-xs">Vendor Setup</p>
              </div>
            </div>
            <div className="sm:hidden text-[10px] font-bold text-brand bg-brand-50 px-2 py-1 rounded-lg border border-brand-100">
              STEP {step}/6
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const done    = step > s.num
              const current = step === s.num
              const last    = i === STEPS.length - 1
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold',
                      'transition-all duration-300 shrink-0',
                      done    && 'bg-brand text-white shadow-brand',
                      current && 'bg-brand-800 text-white ring-4 ring-brand-200 scale-105 sm:scale-110',
                      !done && !current && 'bg-neutral-200 text-neutral-400',
                    )}>
                      {done ? '✓' : s.num}
                    </div>
                    <span className={cn(
                      'text-[9px] font-medium mt-1 hidden sm:block whitespace-nowrap',
                      current ? 'text-brand-800' : done ? 'text-brand' : 'text-neutral-400'
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {!last && (
                    <div className={cn(
                      'flex-1 h-0.5 mx-1 transition-all duration-500',
                      done ? 'bg-brand' : 'bg-neutral-200'
                    )} />
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-xs text-neutral-400 mt-3 text-center">
            Step {step} of {STEPS.length} — {STEPS[step - 1].short}
          </p>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="animate-fade-up" key={step}>
          {step === 1 && <StepStoreIdentity    vendor={vendor} onNext={goNext} />}
          {step === 2 && <StepBusinessInfo     vendor={vendor} onNext={goNext} onBack={goBack} />}
          {step === 3 && <StepPaymentSetup     vendor={vendor} onNext={goNext} onBack={goBack} />}
          {step === 4 && <StepShipping         vendor={vendor} onNext={goNext} onBack={goBack} />}
          {step === 5 && <StepVerificationDocs vendor={vendor} onNext={goNext} onBack={goBack} />}
          {step === 6 && <StepComplete         vendor={vendor} />}
        </div>
      </div>

    </div>
  )
}