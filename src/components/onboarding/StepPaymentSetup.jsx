'use client'

import { useState }          from 'react'
import { CreditCard, Smartphone, Landmark, User, Hash, ChevronRight, ChevronLeft, ShieldCheck, Info, AtSign } from 'lucide-react'
import { savePaymentSetup }  from '@/lib/actions/onboarding'
import { cn }                from '@/utils/cn'

const PAYMENT_METHODS = [
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    desc:  'Direct deposit to your local or international bank account',
    emoji: '🏦',
    popular: true,
  },
  {
    value: 'mobile_money',
    label: 'Mobile Money',
    desc:  'M-Pesa, MTN MoMo, Wave, or any mobile wallet',
    emoji: '📲',
    popular: false,
  },
  {
    value: 'paypal',
    label: 'PayPal',
    desc:  'Receive payouts to your PayPal account',
    emoji: '🅿️',
    popular: false,
  },
  {
    value: 'stripe',
    label: 'Stripe / Card',
    desc:  'Payouts via Stripe to your debit or bank card',
    emoji: '💳',
    popular: false,
  },
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

export default function StepPaymentSetup({ vendor, onNext, onBack }) {
  const [form, setForm] = useState({
    payment_method:       vendor?.payment_method       ?? '',
    payment_account_name: vendor?.payment_account_name ?? '',
    payment_account_num:  vendor?.payment_account_num  ?? '',
    payment_bank_name:    vendor?.payment_bank_name    ?? '',
    payment_mobile_num:   vendor?.payment_mobile_num   ?? '',
    paypal_email:         vendor?.paypal_email         ?? '',
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.payment_method)              e.payment_method       = 'Select a payout method'
    if (!form.payment_account_name.trim()) e.payment_account_name = 'Account name is required'

    if (form.payment_method === 'bank_transfer') {
      if (!form.payment_bank_name.trim())  e.payment_bank_name   = 'Bank name is required'
      if (!form.payment_account_num.trim())e.payment_account_num = 'Account number is required'
    }
    if (form.payment_method === 'mobile_money') {
      if (!form.payment_mobile_num.trim()) e.payment_mobile_num  = 'Mobile number is required'
    }
    if (form.payment_method === 'paypal') {
      if (!form.paypal_email.trim())       e.paypal_email        = 'PayPal email is required'
      if (!/\S+@\S+\.\S+/.test(form.paypal_email)) e.paypal_email = 'Enter a valid email'
    }
    if (form.payment_method === 'stripe') {
      if (!form.payment_account_num.trim())e.payment_account_num = 'Stripe account ID is required'
    }
    return e
  }

  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    const res = await savePaymentSetup(form)
    setLoading(false)
    if (res?.error) { setErrors({ _form: res.error }); return }
    onNext(res.data)
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-600 p-5 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <CreditCard size={20} className="sm:hidden" />
            <CreditCard size={22} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="font-bold text-lg sm:text-xl leading-tight">Payment setup</h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Tell us where to send your earnings after each successful sale.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-5 flex items-start gap-2.5 bg-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-sm">
          <ShieldCheck size={14} className="text-emerald-200 shrink-0 mt-0.5" />
          <span className="text-emerald-100">Payouts are secured via escrow and released <span className="font-bold text-white">48 hours</span> after delivery confirmation.</span>
        </div>
      </div>

      {/* Method Selection */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
          <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
            <CreditCard size={14} className="text-brand" /> Payout Method *
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-3">
          {errors.payment_method && <p className="text-xs text-danger font-medium">{errors.payment_method}</p>}
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.value}
              type="button"
              onClick={() => set('payment_method', pm.value)}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all duration-150',
                form.payment_method === pm.value
                  ? 'border-brand bg-brand-50 ring-2 ring-brand/20'
                  : 'border-neutral-200 hover:border-brand-200 hover:bg-neutral-50',
              )}
            >
              <span className="text-2xl leading-none">{pm.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-semibold', form.payment_method === pm.value ? 'text-brand-800' : 'text-neutral-700')}>
                    {pm.label}
                  </p>
                  {pm.popular && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand text-[10px] font-bold uppercase tracking-wide">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-tight sm:leading-normal">{pm.desc}</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                form.payment_method === pm.value ? 'border-brand bg-brand' : 'border-neutral-300',
              )}>
                {form.payment_method === pm.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bank Transfer */}
      {form.payment_method === 'bank_transfer' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
            <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
              <Landmark size={14} className="text-brand" /> Bank Account Details
            </h3>
          </div>
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
            <Field label="Account Holder Name" required error={errors.payment_account_name}
              hint="Full name on the bank account — must match your registered name">
              <TextInput
                icon={User}
                placeholder="e.g. John Smith"
                value={form.payment_account_name}
                onChange={e => set('payment_account_name', e.target.value)}
                error={errors.payment_account_name}
              />
            </Field>
            <Field label="Bank Name" required error={errors.payment_bank_name}
              hint="Enter your bank name as shown on your account statement">
              <TextInput
                icon={Landmark}
                placeholder="e.g. Chase Bank, Barclays, Zenith Bank…"
                value={form.payment_bank_name}
                onChange={e => set('payment_bank_name', e.target.value)}
                error={errors.payment_bank_name}
              />
            </Field>
            <Field label="Account Number / IBAN" required error={errors.payment_account_num}
              hint="Your account number, IBAN, or routing details">
              <TextInput
                icon={Hash}
                placeholder="e.g. GB29 NWBK 6016 1331 9268 19"
                value={form.payment_account_num}
                onChange={e => set('payment_account_num', e.target.value)}
                error={errors.payment_account_num}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Mobile Money */}
      {form.payment_method === 'mobile_money' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
            <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
              <Smartphone size={14} className="text-brand" /> Mobile Wallet Details
            </h3>
          </div>
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
            <Field label="Account Name" required error={errors.payment_account_name}
              hint="Name registered on the mobile wallet">
              <TextInput
                icon={User}
                placeholder="e.g. John Smith"
                value={form.payment_account_name}
                onChange={e => set('payment_account_name', e.target.value)}
                error={errors.payment_account_name}
              />
            </Field>
            <Field label="Wallet Provider" hint="e.g. M-Pesa, MTN MoMo, Wave, Orange Money">
              <TextInput
                icon={Smartphone}
                placeholder="e.g. M-Pesa"
                value={form.payment_bank_name}
                onChange={e => set('payment_bank_name', e.target.value)}
              />
            </Field>
            <Field label="Mobile Number" required error={errors.payment_mobile_num}
              hint="The number linked to your mobile wallet (include country code)">
              <TextInput
                icon={Smartphone}
                type="tel"
                placeholder="e.g. +254 712 345678"
                value={form.payment_mobile_num}
                onChange={e => set('payment_mobile_num', e.target.value)}
                error={errors.payment_mobile_num}
              />
            </Field>
          </div>
        </div>
      )}

      {/* PayPal */}
      {form.payment_method === 'paypal' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
            <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
              <AtSign size={14} className="text-brand" /> PayPal Details
            </h3>
          </div>
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
            <Field label="Account Name" required error={errors.payment_account_name}
              hint="Full name on your PayPal account">
              <TextInput
                icon={User}
                placeholder="e.g. John Smith"
                value={form.payment_account_name}
                onChange={e => set('payment_account_name', e.target.value)}
                error={errors.payment_account_name}
              />
            </Field>
            <Field label="PayPal Email" required error={errors.paypal_email}
              hint="The email address linked to your PayPal account">
              <TextInput
                icon={AtSign}
                type="email"
                placeholder="you@example.com"
                value={form.paypal_email}
                onChange={e => set('paypal_email', e.target.value)}
                error={errors.paypal_email}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Stripe */}
      {form.payment_method === 'stripe' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl overflow-hidden">
            <h3 className="font-bold text-brand-800 text-xs sm:text-sm flex items-center gap-2">
              <CreditCard size={14} className="text-brand" /> Stripe Details
            </h3>
          </div>
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
            <Field label="Account Name" required error={errors.payment_account_name}>
              <TextInput
                icon={User}
                placeholder="e.g. John Smith"
                value={form.payment_account_name}
                onChange={e => set('payment_account_name', e.target.value)}
                error={errors.payment_account_name}
              />
            </Field>
            <Field label="Stripe Account ID" required error={errors.payment_account_num}
              hint="Your Stripe account ID (starts with acct_)">
              <TextInput
                icon={Hash}
                placeholder="acct_1A2B3C4D5E6F"
                value={form.payment_account_num}
                onChange={e => set('payment_account_num', e.target.value)}
                error={errors.payment_account_num}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Escrow reminder */}
      {form.payment_method && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">How payouts work:</span> When a buyer pays, Novara holds the funds securely. Once delivery is confirmed and the 48-hour dispute window passes, your earnings are released automatically to the account above.
          </p>
        </div>
      )}

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