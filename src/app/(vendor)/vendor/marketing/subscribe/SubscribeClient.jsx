'use client'
// FILE: src/app/(vendor)/vendor/marketing/subscribe/SubscribeClient.jsx

import { useState, useRef } from 'react'
import {
  CheckCircle2, Clock, Crown, Zap,
  Upload, AlertCircle, Loader2,
  Copy, CheckCheck, ChevronRight,
  Shield, Star, BarChart2, Megaphone, Image as ImageIcon,
} from 'lucide-react'
import { submitSubscriptionPayment } from '@/lib/actions/campaigns'
import { PAYMENT_METHOD_CONFIG, NOVARA_PAYMENT_DETAILS } from '@/lib/config/currencies'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils/cn'

const PLAN_BENEFITS = [
  { icon: BarChart2, text: 'Create discount & promo code campaigns' },
  { icon: Zap,       text: 'Run flash sales with countdown timers'  },
  { icon: ImageIcon, text: 'Place products on the Hero Banner carousel' },
  { icon: Megaphone, text: 'Broadcast campaigns to circle members'  },
  { icon: Star,      text: 'Sponsored video boosts in the feed'     },
  { icon: Shield,    text: 'Campaign analytics & ROI tracking'      },
]

function PlanCard({ plan, price, symbol, period, savings, selected, onSelect }) {
  return (
    <button type="button" onClick={onSelect}
      className={cn(
        'relative w-full text-left rounded-2xl border-2 p-5 transition-all',
        selected ? 'border-brand bg-brand-50 ring-2 ring-brand/20' : 'border-neutral-200 hover:border-brand-300 bg-white',
      )}>
      {savings && (
        <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
          Save {savings}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn('text-base font-bold', selected ? 'text-brand-900' : 'text-neutral-800')}>{period}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{plan === 'monthly' ? 'Renew monthly' : 'One payment, 6 months access'}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-2xl font-bold tabular-nums', selected ? 'text-brand' : 'text-neutral-800')}>
            {symbol}{price.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-400">{plan === 'monthly' ? '/month' : 'total'}</p>
        </div>
      </div>
      <div className={cn(
        'absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center',
        selected ? 'border-brand bg-brand' : 'border-neutral-300',
      )}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </button>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 text-brand hover:text-brand-700 transition-colors"
    >
      {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
      <span className="text-xs font-semibold">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

export default function SubscribeClient({ subscription }) {
  if (!subscription) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-neutral-400">Unable to load subscription details. Please refresh.</p>
      </div>
    )
  }

  const { currency, isActive, status, daysLeft, pendingPayment } = subscription

  const [plan,       setPlan]       = useState('six_month')
  const [method,     setMethod]     = useState('')
  const [txRef,      setTxRef]      = useState('')
  const [note,       setNote]       = useState('')
  const [proofUrl,   setProofUrl]   = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState(null)
  const [step,       setStep]       = useState(1)  // 1=plans, 2=payment, 3=confirm
  const fileRef = useRef(null)

  const availableMethods = currency.methods ?? ['bank']
  const price  = plan === 'monthly' ? currency.monthly  : currency.sixMonth
  const amount = price
  const sym    = currency.symbol

  const handleUploadProof = async (file) => {
    if (!file.type.startsWith('image/')) { setError('Proof must be an image'); return }
    setUploading(true)
    const supabase = createClient()
    const path     = `subscriptions/${Date.now()}-proof.${file.name.split('.').pop()}`
    const { data, error: upErr } = await supabase.storage
      .from('vendor-documents').upload(path, file, { contentType: file.type })
    if (upErr) { setError(upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('vendor-documents').getPublicUrl(data.path)
    setProofUrl(publicUrl)
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!method)  { setError('Select a payment method'); return }
    if (!txRef.trim() && !proofUrl) { setError('Provide a transaction reference or screenshot'); return }
    setSubmitting(true)
    setError(null)
    const res = await submitSubscriptionPayment({
      plan, paymentMethod: method, transactionRef: txRef,
      proofNote: note, proofImageUrl: proofUrl, amount, currency: currency.currency,
    })
    setSubmitting(false)
    if (res?.error) { setError(res.error); return }
    setDone(true)
  }

  const paymentDetails = NOVARA_PAYMENT_DETAILS[method] ?? NOVARA_PAYMENT_DETAILS.bank

  // ── Already subscribed ────────────────────────────────────────────────────
  if (isActive) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Crown size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-brand-800 text-lg">Pro Subscription Active</p>
              <p className="text-sm text-emerald-600 font-semibold mt-0.5">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining · {subscription.plan === 'monthly' ? 'Monthly' : '6-Month'} plan
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PLAN_BENEFITS.map(b => (
              <div key={b.text} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-600">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Pending verification ──────────────────────────────────────────────────
  if (pendingPayment || done) {
    return (
      <div className="max-w-xl">
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center mx-auto">
            <Clock size={28} className="text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-brand-800 text-xl">Payment Under Review</p>
            <p className="text-sm text-neutral-500 mt-2 max-w-xs mx-auto">
              Our team verifies payments within <span className="font-semibold text-amber-700">24 hours</span>. You'll be notified as soon as your subscription is activated.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 text-left space-y-1">
            <p className="font-bold">What happens next:</p>
            <p>1. Admin reviews your payment proof</p>
            <p>2. Subscription activated within 24 hours</p>
            <p>3. You'll receive a notification to start campaigns</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Upgrade to Pro</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Unlock campaigns, hero banner placement, and promotional tools
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between px-2 sm:px-0">
        {['Plans', 'Pay', 'Confirm'].map((label, i) => {
          const s    = i + 1
          const done = step > s
          const curr = step === s
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none group">
              <div className="flex flex-col items-center relative">
                <div className={cn(
                  'w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all z-10',
                  done ? 'bg-brand text-white shadow-lg' : curr ? 'bg-brand-900 text-white ring-4 ring-brand/10' : 'bg-neutral-100 text-neutral-400 border border-neutral-200',
                )}>
                  {done ? '✓' : s}
                </div>
                <span className={cn(
                  'absolute -bottom-6 text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors',
                  curr ? 'text-brand-900' : done ? 'text-brand' : 'text-neutral-400'
                )}>
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div className="flex-1 px-2">
                  <div className={cn('h-1 rounded-full transition-colors', done ? 'bg-brand' : 'bg-neutral-100')} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="h-6 sm:hidden" /> {/* Spacer for labels */}

      {/* ── STEP 1: Plans ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Benefits */}
          <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={20} className="text-amber-400" />
              <p className="font-bold text-lg">Pro Benefits</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLAN_BENEFITS.map(b => (
                <div key={b.text} className="flex items-start gap-2.5">
                  <b.icon size={14} className="text-brand-300 shrink-0 mt-0.5" />
                  <p className="text-sm text-white/85">{b.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-brand-800">Select a Plan</p>
            <PlanCard
              plan="monthly"
              price={currency.monthly}
              symbol={sym}
              period="Monthly"
              selected={plan === 'monthly'}
              onSelect={() => setPlan('monthly')}
            />
            <PlanCard
              plan="six_month"
              price={currency.sixMonth}
              symbol={sym}
              period="6 Months"
              savings={`${sym}${((currency.monthly * 6) - currency.sixMonth).toLocaleString()}`}
              selected={plan === 'six_month'}
              onSelect={() => setPlan('six_month')}
            />
            <p className="text-xs text-neutral-400 text-center">
              Prices shown in {currency.currency}. Base prices: $32/month or $100/6-months USD.
            </p>
          </div>

          <button onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-3 py-4.5 sm:py-4 rounded-2xl bg-brand hover:bg-brand-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 transition-all active:scale-[0.98]">
            Proceed to Payment <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* ── STEP 2: Payment method + details ───────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <button onClick={() => setStep(1)} className="text-xs font-semibold text-brand hover:text-brand-700">
            ← Back
          </button>

          {/* Selected plan summary */}
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-brand-800">{plan === 'monthly' ? 'Monthly Plan' : '6-Month Plan'}</p>
              <p className="text-xs text-neutral-500">{plan === 'monthly' ? '30 days access' : '6 months access'}</p>
            </div>
            <p className="text-xl font-bold text-brand tabular-nums">{sym}{price.toLocaleString()}</p>
          </div>

          {/* Payment methods */}
          <div className="space-y-3">
            <p className="text-sm font-black text-brand-900 uppercase tracking-tight">Payment Method</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableMethods.map(m => {
                const cfg = PAYMENT_METHOD_CONFIG[m]
                if (!cfg) return null
                return (
                  <button key={m} type="button" onClick={() => setMethod(m)}
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98]',
                      method === m ? 'border-brand bg-brand-50 shadow-sm' : 'border-neutral-100 hover:border-brand-100 bg-white',
                    )}>
                    <span className="text-3xl leading-none">{cfg.icon}</span>
                    <div className="min-w-0">
                      <p className={cn('text-xs font-black uppercase tracking-tight', method === m ? 'text-brand-900' : 'text-neutral-800')}>{cfg.label}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">{cfg.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Payment instructions */}
          {method && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-bold text-brand-800">
                {PAYMENT_METHOD_CONFIG[method]?.icon} Send {sym}{price.toLocaleString()} via {PAYMENT_METHOD_CONFIG[method]?.label}
              </p>
              {Object.entries(paymentDetails).filter(([k]) => k !== 'note').map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500 capitalize">{key.replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-brand-800 font-mono">{val}</p>
                    <CopyButton text={val} />
                  </div>
                </div>
              ))}
              {paymentDetails.note && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{paymentDetails.note}</p>
                </div>
              )}
            </div>
          )}

          <button onClick={() => { if (!method) { setError('Select a payment method'); return }; setError(null); setStep(3) }}
            className="w-full flex items-center justify-center gap-3 py-4.5 sm:py-4 rounded-2xl bg-brand hover:bg-brand-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 transition-all active:scale-[0.98]">
            I've Made the Payment <ChevronRight size={18} strokeWidth={3} />
          </button>
          {error && <p className="text-[11px] text-danger font-black uppercase tracking-widest text-center">{error}</p>}
        </div>
      )}

      {/* ── STEP 3: Upload proof ───────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <button onClick={() => setStep(2)} className="text-xs font-semibold text-brand hover:text-brand-700">
            ← Back
          </button>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5">
            <div>
              <p className="text-sm font-bold text-brand-800">Confirm Your Payment</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Provide your transaction reference and/or a screenshot. Our team will verify within 24 hours.
              </p>
            </div>

            {/* Transaction ref */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-800">Transaction Reference / ID</label>
              <input
                type="text"
                placeholder="e.g. TXN-123456789 or MPesa confirmation code"
                value={txRef}
                onChange={e => setTxRef(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>

            {/* Screenshot upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-800">Payment Screenshot <span className="text-neutral-400 font-normal">(optional but recommended)</span></label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleUploadProof(e.target.files[0])} />
              <div onClick={() => fileRef.current?.click()}
                className={cn(
                  'relative h-32 border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden transition-all',
                  proofUrl ? 'border-emerald-300' : 'border-neutral-200 hover:border-brand-300 hover:bg-brand-50/30',
                )}>
                {proofUrl ? (
                  <img src={proofUrl} alt="proof" className="w-full h-full object-cover" />
                ) : uploading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Loader2 size={22} className="text-brand animate-spin" />
                    <p className="text-xs text-neutral-500">Uploading…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-400">
                    <Upload size={22} />
                    <p className="text-xs font-semibold">Upload screenshot</p>
                  </div>
                )}
              </div>
              {proofUrl && (
                <button onClick={() => setProofUrl(null)} className="text-xs text-danger hover:text-danger/70">Remove</button>
              )}
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-800">Additional Note <span className="text-neutral-400 font-normal">(optional)</span></label>
              <textarea rows={2} placeholder="Any additional info for the admin…" value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none" />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || (!txRef.trim() && !proofUrl)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-brand transition-all active:scale-[0.98]">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Submit for Verification</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}