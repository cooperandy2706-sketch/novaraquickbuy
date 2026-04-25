'use client'
// FILE: src/components/novapay/WalletComponents.jsx
// Three wallet components:
//   WalletBalance        — balance card with topup CTA
//   WalletTopupForm      — add funds flow
//   TransactionHistory   — full ledger list

import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { getAvailableMethods, isMoMoMethod } from '@/lib/novapay/processor-router'
import { cn } from '@/utils/cn'
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft,
  Loader2, RefreshCw, ShieldCheck, TrendingUp,
  CreditCard, Smartphone, AlertCircle, Info, ExternalLink,
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

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─────────────────────────────────────────────────────────────
// TX TYPE CONFIG
// ─────────────────────────────────────────────────────────────

const TX_CONFIG = {
  payment:        { label: 'Payment',        color: 'text-red-600',    bg: 'bg-red-50',    icon: ArrowUpRight,   sign: '-' },
  wallet_topup:   { label: 'Topup',          color: 'text-brand',      bg: 'bg-brand-50',  icon: ArrowDownLeft,  sign: '+' },
  wallet_payment: { label: 'Wallet Pay',     color: 'text-red-600',    bg: 'bg-red-50',    icon: ArrowUpRight,   sign: '-' },
  escrow_hold:    { label: 'Escrow Hold',    color: 'text-amber-600',  bg: 'bg-amber-50',  icon: Lock,           sign: '~' },
  escrow_release: { label: 'Released',       color: 'text-brand',      bg: 'bg-brand-50',  icon: CheckCircle2,   sign: '+' },
  escrow_refund:  { label: 'Refund',         color: 'text-brand',      bg: 'bg-brand-50',  icon: ArrowDownLeft,  sign: '+' },
  payout:         { label: 'Payout',         color: 'text-neutral-600',bg: 'bg-neutral-50',icon: ArrowUpRight,   sign: '-' },
  refund:         { label: 'Refund',         color: 'text-brand',      bg: 'bg-brand-50',  icon: ArrowDownLeft,  sign: '+' },
}

// ─────────────────────────────────────────────────────────────
// WALLET BALANCE CARD
// ─────────────────────────────────────────────────────────────

export function WalletBalance({ currency = 'GHS', onTopup }) {
  const { wallet, balance, isFrozen, loading } = useWallet(currency)

  return (
    <div
      className="rounded-3xl p-5 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #052E16 0%, #14532D 50%, #16A34A 100%)' }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 rounded-full border-2 border-white" />
        <div className="absolute bottom-[-30px] right-[40px] w-60 h-60 rounded-full border border-white" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-green-300 uppercase tracking-widest">
              NovaPay Wallet
            </p>
          </div>
          {isFrozen && (
            <span className="ml-auto text-[9px] font-black bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-1 rounded-full">
              FROZEN
            </span>
          )}
        </div>

        {/* Balance */}
        {loading ? (
          <div className="h-10 w-32 bg-white/10 rounded-xl animate-pulse mb-1" />
        ) : (
          <p className="text-3xl font-black tracking-tight leading-none mb-1">
            {fmt(balance, currency)}
          </p>
        )}
        <p className="text-[11px] text-green-300">Available balance</p>

        {/* CTA */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onTopup}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-brand text-xs font-black rounded-xl hover:bg-green-50 transition-colors"
          >
            <Plus size={13} /> Add Money
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20">
            <TrendingUp size={13} /> History
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WALLET TOPUP FORM
// ─────────────────────────────────────────────────────────────

const TOPUP_AMOUNTS = [500, 1000, 2000, 5000, 10000]  // in GHS (×100 pesewas)

export function WalletTopupForm({ currency = 'GHS', onSuccess, onCancel }) {
  const [amount,        setAmount]        = useState('')
  const [customAmount,  setCustomAmount]  = useState('')
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [momoNumber,    setMomoNumber]    = useState('')
  const [step,          setStep]          = useState('amount')  // amount | method | processing | success
  const [error,         setError]         = useState(null)

  const { topup, topupLoading } = useWallet(currency)
  const methods = getAvailableMethods(currency).filter(m => m.id !== 'wallet')

  const finalAmount = (parseInt(amount || customAmount || '0') * 100)
  const isMoMo      = isMoMoMethod(paymentMethod ?? '')

  const handleTopup = async () => {
    if (finalAmount < 100) { setError('Minimum topup is 1 GHS'); return }
    setError(null)
    setStep('processing')

    const result = await topup({
      amount:        finalAmount,
      paymentMethod,
      momoNumber:    isMoMo ? `+233${momoNumber}` : undefined,
    })

    if (result) {
      if (result.authorization_url) {
        window.location.href = result.authorization_url
      } else {
        setStep('success')
        setTimeout(() => onSuccess?.(), 2000)
      }
    } else {
      setStep('method')
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
          <Plus size={15} className="text-brand" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-neutral-800">Add Money to NovaPay</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Fund your wallet securely</p>
        </div>
        <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-700 text-xs font-semibold">
          Cancel
        </button>
      </div>

      <div className="px-5 py-5 space-y-5">

        {step === 'success' && (
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center">
              <CheckCircle2 size={28} className="text-white" />
            </div>
            <h3 className="text-base font-black text-neutral-800">Topup Successful!</h3>
            <p className="text-sm text-neutral-500">{fmt(finalAmount, currency)} added to your wallet</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 size={28} className="text-brand animate-spin" />
            <p className="text-sm text-neutral-600 font-semibold">Processing topup…</p>
          </div>
        )}

        {(step === 'amount' || step === 'method') && (
          <>
            {/* Amount selection */}
            {step === 'amount' && (
              <>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Select amount
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {TOPUP_AMOUNTS.map(a => (
                      <button
                        key={a}
                        onClick={() => { setAmount(a.toString()); setCustomAmount('') }}
                        className={cn(
                          'py-2.5 rounded-xl text-xs font-bold border-2 transition-all',
                          amount === a.toString()
                            ? 'border-brand bg-brand-50 text-brand'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300',
                        )}
                      >
                        {getCurrencySymbol(currency)}{a}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 border-2 border-neutral-200 rounded-xl overflow-hidden focus-within:border-brand transition-colors">
                    <span className="px-4 text-sm font-bold text-neutral-500 bg-neutral-50 border-r border-neutral-200 py-3 min-w-[3rem] text-center">
                      {getCurrencySymbol(currency)}
                    </span>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={e => { setCustomAmount(e.target.value); setAmount('') }}
                      className="flex-1 px-3 py-3 text-sm font-semibold outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep('method')}
                  disabled={!finalAmount}
                  className="w-full py-3.5 rounded-2xl bg-brand text-white text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-600 transition-colors"
                >
                  Continue → {finalAmount > 0 ? fmt(finalAmount, currency) : ''}
                </button>
              </>
            )}

            {/* Method selection */}
            {step === 'method' && (
              <>
                <button
                  onClick={() => setStep('amount')}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 font-semibold"
                >
                  ← Back · Adding {fmt(finalAmount, currency)}
                </button>

                <div className="space-y-2">
                  {methods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all',
                        paymentMethod === m.id
                          ? 'border-brand bg-brand-50'
                          : 'border-neutral-200 hover:border-neutral-300',
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                        paymentMethod === m.id ? 'bg-brand/10' : 'bg-neutral-100',
                      )}>
                        {m.icon === 'momo' ? <Smartphone size={16} className={paymentMethod === m.id ? 'text-brand' : 'text-neutral-500'} /> : <CreditCard size={16} className={paymentMethod === m.id ? 'text-brand' : 'text-neutral-500'} />}
                      </div>
                      <span className="text-sm font-semibold text-neutral-700">{m.label}</span>
                      {m.popular && <span className="ml-auto text-[9px] font-black text-brand bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-full">POPULAR</span>}
                    </button>
                  ))}
                </div>

                {isMoMo && paymentMethod && (
                  <div className="flex items-center gap-0 border-2 border-neutral-200 rounded-2xl overflow-hidden focus-within:border-brand transition-colors">
                    <span className="bg-neutral-50 px-3 py-3 text-xs font-bold text-neutral-500 border-r border-neutral-200">+233</span>
                    <input
                      type="tel"
                      value={momoNumber}
                      onChange={e => setMomoNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="XXXXXXXXX"
                      className="flex-1 px-3 py-3 text-sm font-semibold outline-none"
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle size={13} className="text-red-500" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleTopup}
                  disabled={!paymentMethod || topupLoading || (isMoMo && momoNumber.length < 9)}
                  className="w-full py-3.5 rounded-2xl bg-brand text-white text-sm font-black disabled:opacity-40 hover:bg-brand-600 transition-all flex items-center justify-center gap-2"
                >
                  {topupLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
                  {topupLoading ? 'Processing…' : `Add ${fmt(finalAmount, currency)}`}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TRANSACTION HISTORY
// ─────────────────────────────────────────────────────────────

export function TransactionHistory({ currency = 'GHS', limit = 20 }) {
  const { transactions, loading, refetch } = useWallet(currency)
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? transactions : transactions.slice(0, limit)

  if (loading) {
    return (
      <div className="space-y-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-16 bg-neutral-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-700">Transactions</h3>
        <button
          onClick={refetch}
          className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-brand hover:bg-brand-50 transition-all"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Wallet size={28} className="text-neutral-200 mb-3" />
          <p className="text-xs text-neutral-400">No transactions yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {shown.map(tx => {
              const cfg       = TX_CONFIG[tx.tx_type] ?? TX_CONFIG.payment
              const TxIcon    = cfg.icon
              const isCredit  = ['+'].includes(cfg.sign)

              return (
                <div key={tx.id} className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-100 px-3.5 py-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                    <TxIcon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-neutral-800 truncate">{tx.description ?? cfg.label}</p>
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                        tx.status === 'completed' ? 'bg-brand-50 text-brand' :
                        tx.status === 'pending'   ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600',
                      )}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-neutral-400">{timeAgo(tx.created_at)}</p>
                      <span className="text-[10px] text-neutral-300 font-mono">{tx.reference}</span>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-black shrink-0',
                    isCredit ? 'text-brand' : 'text-neutral-700',
                  )}>
                    {cfg.sign}{fmt(tx.amount, tx.currency)}
                  </span>
                </div>
              )
            })}
          </div>

          {transactions.length > limit && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 transition-all"
            >
              {expanded ? 'Show less' : `Show all ${transactions.length} transactions`}
              <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
            </button>
          )}
        </>
      )}
    </div>
  )
}