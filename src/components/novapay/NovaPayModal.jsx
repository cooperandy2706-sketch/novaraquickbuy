'use client'
// FILE: src/components/novapay/NovaPayModal.jsx
// The main branded NovaPay payment sheet.
// Shown as a bottom sheet on mobile, centred modal on desktop.
// Handles: method selection, MoMo flow, Stripe card flow, wallet flow.
//
// FIX: loadStripe is now LAZY — it only runs when the user selects a card
// payment method, not at module load time. This prevents the crash:
//   "Expected publishable key to be of type string, got type undefined"
// which happened because the old top-level loadStripe() call executed
// before NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY was available, and also ran
// even when the user was only using MoMo or wallet — where Stripe is
// never needed at all.

import { useState, useEffect, useRef } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useNovaPay }          from '@/hooks/useNovaPay'
import { useWallet }           from '@/hooks/useWallet'
import { getAvailableMethods } from '@/lib/novapay/processor-router'
import { cn } from '@/utils/cn'
import {
  X, ShieldCheck, Loader2, CheckCircle2,
  CreditCard, Smartphone, Building2, Wallet,
  ArrowLeft, Lock, AlertCircle, RefreshCw,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
// LAZY STRIPE LOADER
// _stripePromise is only created once, on demand.
// If Stripe is never needed (MoMo/wallet payments), this
// function is never called and stripe-js is never loaded.
// ─────────────────────────────────────────────────────────────

let _stripePromise = null

function getStripePromise() {
  if (_stripePromise) return _stripePromise
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    console.warn('[NovaPay] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — card payments unavailable.')
    return null
  }
  _stripePromise = import('@stripe/stripe-js').then(m => m.loadStripe(key))
  return _stripePromise
}

// ─────────────────────────────────────────────────────────────
// STRIPE APPEARANCE
// ─────────────────────────────────────────────────────────────

const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary:    '#16A34A',
    colorBackground: '#ffffff',
    colorText:       '#1e293b',
    colorDanger:     '#dc2626',
    borderRadius:    '14px',
    fontFamily:      'system-ui, sans-serif',
  },
  rules: {
    '.Input': { border: '1.5px solid #e2e8f0', boxShadow: 'none', padding: '11px 14px' },
    '.Input:focus': { border: '1.5px solid #16A34A', boxShadow: '0 0 0 3px rgba(22,163,74,0.1)' },
  },
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

// ─────────────────────────────────────────────────────────────
// METHOD ICONS
// ─────────────────────────────────────────────────────────────

function MethodIcon({ icon, className }) {
  const icons = {
    momo:   <Smartphone size={18} className={className} />,
    card:   <CreditCard size={18} className={className} />,
    bank:   <Building2  size={18} className={className} />,
    wallet: <Wallet     size={18} className={className} />,
    ussd:   <span className={cn('text-xs font-black', className)}>##</span>,
    apple: (
      <svg viewBox="0 0 24 24" className={cn('w-4 h-4', className)} fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    google: (
      <svg viewBox="0 0 24 24" className={cn('w-4 h-4', className)}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  }
  return icons[icon] ?? <CreditCard size={18} className={className} />
}

// ─────────────────────────────────────────────────────────────
// METHOD PICKER
// ─────────────────────────────────────────────────────────────

function MethodPicker({ currency, walletBalance, selected, onSelect }) {
  const methods = getAvailableMethods(currency)

  return (
    <div className="space-y-2">
      {methods.map(method => {
        const isWallet     = method.id === 'wallet'
        const walletSuffix = isWallet && walletBalance > 0 ? fmt(walletBalance, currency) : null

        return (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={cn(
              'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-150',
              selected === method.id
                ? 'border-brand bg-brand-50 shadow-sm'
                : 'border-neutral-200 bg-white hover:border-neutral-300',
            )}
          >
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              selected === method.id ? 'bg-brand/10' : 'bg-neutral-100',
            )}>
              <MethodIcon
                icon={method.icon}
                className={selected === method.id ? 'text-brand' : 'text-neutral-500'}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-semibold',
                  selected === method.id ? 'text-brand-800' : 'text-neutral-700',
                )}>
                  {method.label}
                </span>
                {method.popular && (
                  <span className="text-[9px] font-black text-brand bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-full">
                    POPULAR
                  </span>
                )}
              </div>
              {walletSuffix && (
                <p className="text-[10px] text-neutral-400 mt-0.5">Balance: {walletSuffix}</p>
              )}
            </div>

            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
              selected === method.id ? 'border-brand bg-brand' : 'border-neutral-300',
            )}>
              {selected === method.id && (
                <span className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MOMO NUMBER INPUT
// ─────────────────────────────────────────────────────────────

function MoMoInput({ method, value, onChange }) {
  const networkLabels = {
    momo_mtn:        'MTN number',
    momo_vodafone:   'Vodafone number',
    momo_airteltigo: 'AirtelTigo number',
  }
  const prefixes = {
    momo_mtn:        '024/025/054',
    momo_vodafone:   '020/050',
    momo_airteltigo: '027/057',
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
        {networkLabels[method] ?? 'Phone number'}
      </label>
      <div className="flex items-center gap-0 border-2 border-neutral-200 rounded-2xl overflow-hidden focus-within:border-brand transition-colors">
        <span className="bg-neutral-50 px-3 py-3 text-xs font-bold text-neutral-500 border-r border-neutral-200 shrink-0">
          +233
        </span>
        <input
          type="tel"
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder={`${prefixes[method] ?? 'XXXXXXXXX'}...`}
          className="flex-1 px-3 py-3 text-sm font-semibold text-neutral-800 outline-none bg-white placeholder:text-neutral-300 placeholder:font-normal"
        />
      </div>
      <p className="text-[10px] text-neutral-400">
        A mobile money prompt will appear on your phone after clicking Pay.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MOMO WAITING SCREEN
// ─────────────────────────────────────────────────────────────

function MoMoWaiting({ prompt, onCancel }) {
  const [seconds, setSeconds] = useState(120)
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [])

  const networkColors = {
    momo_mtn:        '#FFCC00',
    momo_vodafone:   '#E60000',
    momo_airteltigo: '#00B5E2',
  }

  return (
    <div className="flex flex-col items-center text-center py-6 space-y-4">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{
          background:  networkColors[prompt?.network] ?? '#16A34A',
          animation:   'novapay-pulse 1.5s ease-in-out infinite',
        }}
      >
        <Smartphone size={32} className="text-white" />
      </div>

      <div>
        <h3 className="text-base font-black text-neutral-800">Check your phone</h3>
        <p className="text-sm text-neutral-500 mt-1 max-w-xs">
          A Mobile Money prompt has been sent to{' '}
          <strong>{prompt?.phone ? `+233 ${prompt.phone}` : 'your number'}</strong>.
          Approve it to complete payment.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 flex items-center justify-center text-[11px] font-black text-neutral-600">
          {seconds}
        </div>
        <span>seconds remaining</span>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-3 max-w-xs text-left">
        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">
          <strong>Enter your PIN</strong> on your phone to approve. Do not share your PIN with anyone.
        </p>
      </div>

      <button
        onClick={onCancel}
        className="text-xs text-neutral-400 hover:text-neutral-600 font-semibold transition-colors"
      >
        Cancel payment
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STRIPE INNER FORM  (must be a child of <Elements>)
// ─────────────────────────────────────────────────────────────

function StripePayForm({ onPay, loading, error, amount, currency }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [ready, setReady] = useState(false)

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => setReady(true)}
        options={{ layout: { type: 'tabs', defaultCollapsed: false } }}
      />

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={() => ready && onPay({ stripe, elements })}
        disabled={!ready || loading}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black transition-all',
          ready && !loading
            ? 'bg-brand text-white hover:bg-brand-600 active:scale-[0.98] shadow-lg shadow-brand/25'
            : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
        )}
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
          : <><Lock size={14} /> Pay {fmt(amount, currency)} securely</>
        }
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STRIPE ELEMENTS WRAPPER
// This component calls getStripePromise() on mount — the first
// time it's rendered is the first time Stripe is ever loaded.
// It only renders when step === 'stripe_elements' AND we have
// a clientSecret, meaning a card method was actually selected.
// ─────────────────────────────────────────────────────────────

function StripeElementsWrapper({ clientSecret, onPay, onBack, loading, error, amount, currency }) {
  const stripeRef = useRef(null)

  // Trigger lazy load on first render of this component
  if (!stripeRef.current) {
    stripeRef.current = getStripePromise()
  }

  if (!stripeRef.current) {
    return (
      <div className="flex flex-col items-center py-8 gap-3 text-center">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-sm font-bold text-neutral-700">Card payments unavailable</p>
        <p className="text-xs text-neutral-400 max-w-xs">
          Stripe is not configured. Please use MoMo or NovaPay Wallet instead.
        </p>
        <button onClick={onBack} className="text-xs text-brand font-semibold hover:underline">
          Choose a different method
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 font-semibold transition-colors"
      >
        <ArrowLeft size={13} /> Choose different method
      </button>

      <Elements
        stripe={stripeRef.current}
        options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
      >
        <StripePayForm
          onPay={onPay}
          loading={loading}
          error={error}
          amount={amount}
          currency={currency}
        />
      </Elements>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SUCCESS SCREEN
// ─────────────────────────────────────────────────────────────

function SuccessScreen({ amount, currency, reference, onClose }) {
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-4">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
      >
        <CheckCircle2 size={36} className="text-white" />
      </div>
      <div>
        <h3 className="text-xl font-black text-neutral-900">Payment Successful!</h3>
        <p className="text-sm text-neutral-500 mt-1">
          {fmt(amount, currency)} secured in NovaPay Escrow
        </p>
      </div>
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-3.5 w-full max-w-xs text-left space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-brand" />
          <p className="text-xs font-bold text-brand-800">Escrow Active</p>
        </div>
        <p className="text-[11px] text-brand-600 leading-relaxed">
          Your payment is locked. The vendor receives funds only after you confirm delivery.
        </p>
        {reference && (
          <p className="text-[10px] text-brand-400 font-mono">Ref: {reference}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-2xl bg-brand text-white font-black text-sm hover:bg-brand-600 transition-colors"
      >
        Track My Order →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────

export default function NovaPayModal({
  open, onClose, onSuccess,
  amount, currency = 'GHS',
  items = [], vendorId, vendorName,
  deliveryMethod, deliveryAddress,
  deliveryFee = 0, couponDiscount = 0,
}) {
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [momoNumber,     setMomoNumber]     = useState('')

  const {
    step, loading, error,
    reference, clientSecret, momoPrompt, orderId,
    initiate, confirmStripe, cancel, reset, clearError,
  } = useNovaPay()

  const { balance: walletBalance } = useWallet(currency)

  // Auto-select the most popular method for this currency on open
  useEffect(() => {
    if (open) {
      const methods = getAvailableMethods(currency)
      const popular = methods.find(m => m.popular) ?? methods[0]
      setSelectedMethod(popular?.id ?? null)
    }
  }, [open, currency])

  const handleClose = () => {
    if (step === 'success') onSuccess?.(orderId)
    reset()
    onClose()
  }

  const handlePay = async () => {
    clearError()
    await initiate({
      items,
      amount,
      currency,
      paymentMethod:   selectedMethod,
      momoNumber:      momoNumber || undefined,
      deliveryMethod,
      deliveryAddress,
      deliveryFee,
      couponDiscount,
      vendorId,
    })
  }

  const isMoMo = ['momo_mtn', 'momo_vodafone', 'momo_airteltigo'].includes(selectedMethod)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={step === 'success' ? handleClose : undefined}
      />

      {/* Sheet / Modal */}
      <div className="fixed z-[9999] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
              >
                <ShieldCheck size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-neutral-900 leading-none">NovaPay</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Secured by Novara Escrow</p>
              </div>
            </div>

            <div className="text-right mr-2">
              <p className="text-xs text-neutral-400">Total</p>
              <p className="text-lg font-black text-neutral-900 leading-tight">
                {fmt(amount, currency)}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-all shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 flex-1">

            {/* SUCCESS */}
            {step === 'success' && (
              <SuccessScreen
                amount={amount}
                currency={currency}
                reference={reference}
                onClose={handleClose}
              />
            )}

            {/* MOMO WAITING */}
            {step === 'awaiting_momo' && momoPrompt && (
              <MoMoWaiting prompt={momoPrompt} onCancel={cancel} />
            )}

            {/* PROCESSING / VERIFYING */}
            {(step === 'processing' || step === 'verifying') && (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <Loader2 size={28} className="text-brand animate-spin" />
                </div>
                <p className="text-sm font-bold text-neutral-700">
                  {step === 'verifying' ? 'Verifying payment…' : 'Processing your payment…'}
                </p>
                <p className="text-xs text-neutral-400">Please don't close this window.</p>
              </div>
            )}

            {/* STRIPE ELEMENTS
                Only renders when:
                  1. step is 'stripe_elements' (card method selected + API called)
                  2. clientSecret exists (PaymentIntent was created)
                getStripePromise() is called here for the first time — Stripe
                is never loaded for MoMo or wallet payments. */}
            {step === 'stripe_elements' && clientSecret && (
              <StripeElementsWrapper
                clientSecret={clientSecret}
                onPay={confirmStripe}
                onBack={cancel}
                loading={loading}
                error={error}
                amount={amount}
                currency={currency}
              />
            )}

            {/* METHOD SELECTION — idle or after a failed attempt */}
            {(step === 'idle' || step === 'failed') && (
              <div className="space-y-5">

                {step === 'failed' && error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3.5">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-700">Payment failed</p>
                      <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
                    </div>
                    <button onClick={cancel} className="text-[11px] text-red-500 font-semibold hover:text-red-700 shrink-0">
                      <RefreshCw size={13} />
                    </button>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                    Choose payment method
                  </p>
                  <MethodPicker
                    currency={currency}
                    walletBalance={walletBalance}
                    selected={selectedMethod}
                    onSelect={(m) => { setSelectedMethod(m); clearError() }}
                  />
                </div>

                {isMoMo && (
                  <MoMoInput
                    method={selectedMethod}
                    value={momoNumber}
                    onChange={setMomoNumber}
                  />
                )}

                <div className="flex items-start gap-2.5 bg-brand-50 border border-brand-100 rounded-2xl p-3.5">
                  <ShieldCheck size={14} className="text-brand shrink-0 mt-0.5" />
                  <p className="text-[11px] text-brand-700 leading-relaxed">
                    <strong>NovaPay Escrow:</strong> Your payment is held securely.
                    The vendor cannot access funds until you confirm delivery.
                    You have 48 hours to raise any dispute.
                  </p>
                </div>

                <button
                  onClick={handlePay}
                  disabled={loading || !selectedMethod || (isMoMo && momoNumber.length < 9)}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black transition-all duration-200',
                    !loading && selectedMethod && (!isMoMo || momoNumber.length >= 9)
                      ? 'bg-brand text-white hover:bg-brand-600 active:scale-[0.98] shadow-lg shadow-brand/25'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
                  )}
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Connecting…</>
                    : <><Lock size={14} /> Pay {fmt(amount, currency)}</>
                  }
                </button>

                <p className="text-center text-[10px] text-neutral-400">
                  By paying you agree to Novara's Terms of Service
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-6 pt-2">
            <div className="flex items-center justify-center gap-4">
              {['Paystack', 'Flutterwave', 'Stripe'].map(p => (
                <span key={p} className="text-[9px] font-bold text-neutral-300 uppercase tracking-wider">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes novapay-pulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(22,163,74,0.15); }
          50%       { box-shadow: 0 0 0 16px rgba(22,163,74,0.05); }
        }
      `}</style>
    </>
  )
}