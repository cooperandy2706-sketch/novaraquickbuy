'use client'
// FILE: src/components/novapay/VendorPayoutComponents.jsx
// Two components:
//   VendorBalanceDashboard  — escrowed / available / lifetime earnings
//   VendorPayoutForm        — request withdrawal

import { useState } from 'react'
import { useVendorBalance } from '@/hooks/useVendorBalance'
import { cn } from '@/utils/cn'
import {
  Wallet, Lock, TrendingUp, ArrowUpRight,
  Loader2, CheckCircle2, AlertCircle,
  Package, Clock, ChevronRight,
  Info, BadgeCheck,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

const getCurrencySymbol = (cur = 'GHS') => {
  if (cur === 'GHS') return '₵'
  if (cur === 'NGN') return '₦'
  if (cur === 'KES') return 'KSh'
  return '$'
}

// ─────────────────────────────────────────────────────────────
// PAYOUT STATUS CONFIG
// ─────────────────────────────────────────────────────────────

const PAYOUT_STATUS = {
  requested:  { label: 'Requested',  color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  approved:   { label: 'Approved',   color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'  },
  processing: { label: 'Processing', color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200'},
  paid:       { label: 'Paid',       color: 'text-brand',       bg: 'bg-brand-50',   border: 'border-brand-200' },
  failed:     { label: 'Failed',     color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200'   },
  rejected:   { label: 'Rejected',   color: 'text-neutral-600', bg: 'bg-neutral-50', border: 'border-neutral-200'},
}

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─────────────────────────────────────────────────────────────
// BALANCE STAT CARD
// ─────────────────────────────────────────────────────────────

function BalanceStat({ label, value, icon: Icon, color, bg, tooltip }) {
  return (
    <div className={cn('rounded-2xl p-4 flex flex-col gap-2', bg)}>
      <div className="flex items-center justify-between">
        <Icon size={16} style={{ color }} />
        {tooltip && (
          <div className="group relative">
            <Info size={11} className="text-neutral-400 cursor-help" />
            <div className="absolute right-0 top-5 bg-neutral-800 text-white text-[10px] rounded-xl px-2.5 py-1.5 w-44 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black mt-0.5 leading-none" style={{ color }}>{value}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VENDOR BALANCE DASHBOARD
// ─────────────────────────────────────────────────────────────

export function VendorBalanceDashboard({ onRequestPayout }) {
  const {
    availableBalance, escrowedBalance, pendingPayout,
    lifetimeEarned, lifetimeWithdrawn,
    currency, payouts, escrows, loading,
  } = useVendorBalance()

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-28 bg-neutral-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Main balance card */}
      <div
        className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} className="text-slate-400" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              NovaPay Vendor Account
            </p>
          </div>
          <p className="text-3xl font-black tracking-tight">{fmt(availableBalance, currency)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Available to withdraw</p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onRequestPayout}
              disabled={availableBalance <= 0}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-neutral-800 text-xs font-black rounded-xl disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ArrowUpRight size={13} /> Withdraw
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl border border-white/10">
              <Lock size={12} className="text-slate-400" />
              <span className="text-[11px] text-slate-300 font-semibold">
                {fmt(escrowedBalance, currency)} in escrow
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <BalanceStat
          label="In Escrow"
          value={fmt(escrowedBalance, currency)}
          icon={Lock}
          color="#D97706"
          bg="bg-amber-50"
          tooltip="Funds locked pending buyer delivery confirmation. You can see this amount but cannot withdraw it yet."
        />
        <BalanceStat
          label="Pending Payout"
          value={fmt(pendingPayout, currency)}
          icon={Clock}
          color="#7C3AED"
          bg="bg-violet-50"
          tooltip="Withdrawal requested and being processed."
        />
        <BalanceStat
          label="Lifetime Earned"
          value={fmt(lifetimeEarned, currency)}
          icon={TrendingUp}
          color="#16A34A"
          bg="bg-brand-50"
        />
        <BalanceStat
          label="Total Withdrawn"
          value={fmt(lifetimeWithdrawn, currency)}
          icon={ArrowUpRight}
          color="#64748b"
          bg="bg-neutral-50"
        />
      </div>

      {/* Escrow note */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
        <Lock size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800">About Escrow</p>
          <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
            Escrowed funds are visible but not withdrawable until the buyer confirms delivery or the 48h dispute window expires. This protects both parties.
          </p>
        </div>
      </div>

      {/* Active escrows */}
      {escrows.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
            Active Escrows ({escrows.length})
          </p>
          <div className="space-y-2">
            {escrows.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 px-3.5 py-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Package size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-800 truncate">
                    {e.order?.order_number ?? 'Order'}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Held {timeAgo(e.held_at)}
                    {e.release_deadline && ` · Releases ${timeAgo(e.release_deadline)}`}
                  </p>
                </div>
                <span className="text-xs font-black text-amber-600 shrink-0">
                  {fmt(e.vendor_net, e.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout history */}
      {payouts.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
            Payout History
          </p>
          <div className="space-y-2">
            {payouts.slice(0, 5).map(p => {
              const cfg = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.requested
              return (
                <div key={p.id} className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 px-3.5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-800 font-mono">{p.payout_number}</span>
                      <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {p.destination_account} · {timeAgo(p.requested_at)}
                    </p>
                  </div>
                  <span className="text-sm font-black text-neutral-800 shrink-0">
                    {fmt(p.amount, p.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VENDOR PAYOUT FORM
// ─────────────────────────────────────────────────────────────

const PAYOUT_NETWORKS = [
  { id: 'mtn',       label: 'MTN MoMo',       prefix: '024/025/054' },
  { id: 'vodafone',  label: 'Vodafone Cash',  prefix: '020/050' },
  { id: 'airteltigo',label: 'AirtelTigo',     prefix: '027/057' },
]

export function VendorPayoutForm({ onSuccess, onCancel }) {
  const { availableBalance, currency, requestPayout, payoutLoading, error } = useVendorBalance()

  const [payoutMethod, setPayoutMethod] = useState('momo')
  const [network,      setNetwork]      = useState('mtn')
  const [accountName,  setAccountName]  = useState('')
  const [accountNum,   setAccountNum]   = useState('')
  const [amount,       setAmount]       = useState('')
  const [step,         setStep]         = useState('form')  // form | confirm | success

  const reqAmount = parseInt(amount || '0') * 100

  const networkLabel = PAYOUT_NETWORKS.find(n => n.id === network)?.label ?? ''

  const handleSubmit = async () => {
    if (reqAmount < 100 || reqAmount > availableBalance) return
    if (!accountNum || !accountName) return

    setStep('confirm')
  }

  const handleConfirm = async () => {
    const result = await requestPayout({
      amount:              reqAmount,
      payoutMethod,
      destinationName:     accountName,
      destinationAccount:  payoutMethod === 'momo' ? `+233${accountNum}` : accountNum,
      destinationNetwork:  payoutMethod === 'momo' ? network : undefined,
    })

    if (result) {
      setStep('success')
      setTimeout(() => onSuccess?.(), 2500)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center">
          <ArrowUpRight size={15} className="text-neutral-600" />
        </div>
        <p className="text-sm font-black text-neutral-800 flex-1">Withdraw Funds</p>
        <button onClick={onCancel} className="text-xs text-neutral-400 hover:text-neutral-700 font-semibold">Cancel</button>
      </div>

      <div className="px-5 py-5 space-y-4">

        {step === 'success' && (
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center">
              <CheckCircle2 size={28} className="text-white" />
            </div>
            <h3 className="text-base font-black text-neutral-800">Withdrawal Requested!</h3>
            <p className="text-sm text-neutral-500">{fmt(reqAmount, currency)} will be sent to {accountNum}</p>
            <p className="text-xs text-neutral-400">Processing within 1–2 business days.</p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-2xl p-4 space-y-2.5 border border-neutral-200">
              {[
                ['Amount',      fmt(reqAmount, currency)],
                ['Method',      payoutMethod === 'momo' ? `${networkLabel} MoMo` : 'Bank Transfer'],
                ['Account',     accountNum],
                ['Name',        accountName],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-neutral-500 font-medium">{l}</span>
                  <span className="font-bold text-neutral-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">Please verify the details above. Payouts cannot be reversed once processed.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-600 text-sm font-bold hover:bg-neutral-200 transition-colors">
                Edit
              </button>
              <button
                onClick={handleConfirm}
                disabled={payoutLoading}
                className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-black hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {payoutLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Confirm
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <>
            {/* Available balance */}
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3 flex items-center gap-2">
              <Wallet size={14} className="text-brand" />
              <p className="text-xs text-brand-700">
                Available: <strong>{fmt(availableBalance, currency)}</strong>
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Amount to withdraw
              </label>
              <div className="flex items-center gap-0 border-2 border-neutral-200 rounded-2xl overflow-hidden focus-within:border-brand transition-colors">
                <span className="px-4 text-sm font-bold text-neutral-500 bg-neutral-50 border-r border-neutral-200 py-3 min-w-[3rem] text-center">
                  {getCurrencySymbol(currency)}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  max={availableBalance / 100}
                  className="flex-1 px-3 py-3 text-sm font-semibold outline-none"
                />
                <button
                  onClick={() => setAmount((availableBalance / 100).toString())}
                  className="px-3 text-[10px] font-black text-brand bg-brand-50 border-l border-neutral-200 py-3 hover:bg-brand-100 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Payout method */}
            <div className="flex gap-2">
              {[{id:'momo',label:'MoMo'},{id:'bank',label:'Bank'}].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPayoutMethod(m.id)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all',
                    payoutMethod === m.id
                      ? 'border-brand bg-brand-50 text-brand'
                      : 'border-neutral-200 text-neutral-500',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* MoMo network */}
            {payoutMethod === 'momo' && (
              <div className="grid grid-cols-3 gap-2">
                {PAYOUT_NETWORKS.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setNetwork(n.id)}
                    className={cn(
                      'py-2 rounded-xl text-[11px] font-bold border-2 transition-all',
                      network === n.id ? 'border-brand bg-brand-50 text-brand' : 'border-neutral-200 text-neutral-500',
                    )}
                  >
                    {n.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Account number */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                {payoutMethod === 'momo' ? 'MoMo number' : 'Bank account number'}
              </label>
              {payoutMethod === 'momo' ? (
                <div className="flex items-center gap-0 border-2 border-neutral-200 rounded-2xl overflow-hidden focus-within:border-brand transition-colors">
                  <span className="bg-neutral-50 px-3 py-3 text-xs font-bold text-neutral-500 border-r border-neutral-200">+233</span>
                  <input
                    type="tel"
                    value={accountNum}
                    onChange={e => setAccountNum(e.target.value.replace(/\D/g,'').slice(0,9))}
                    placeholder="XXXXXXXXX"
                    className="flex-1 px-3 py-3 text-sm font-semibold outline-none"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={accountNum}
                  onChange={e => setAccountNum(e.target.value)}
                  placeholder="Account number"
                  className="w-full border-2 border-neutral-200 rounded-2xl px-3 py-3 text-sm font-semibold outline-none focus:border-brand transition-colors"
                />
              )}
            </div>

            {/* Account name */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Account name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="Full name on account"
                className="w-full border-2 border-neutral-200 rounded-2xl px-3 py-3 text-sm font-semibold outline-none focus:border-brand transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle size={13} className="text-red-500" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!reqAmount || reqAmount > availableBalance || !accountNum || !accountName}
              className="w-full py-3.5 rounded-2xl bg-brand text-white text-sm font-black disabled:opacity-40 hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronRight size={15} />
              Review Withdrawal
            </button>
          </>
        )}
      </div>
    </div>
  )
}