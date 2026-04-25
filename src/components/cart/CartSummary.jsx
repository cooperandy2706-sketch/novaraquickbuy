'use client'
// FILE: src/components/cart/CartSummary.jsx
// Rebuilt fully for NovaPay.
// Displays price breakdown, coupon, wallet shortcut,
// escrow badge, and opens NovaPayModal directly — no
// redirect to a separate checkout page for authed users.

import { useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@/hooks/useWallet'
import { cn } from '@/utils/cn'
import {
  ShieldCheck, Tag, Loader2, Lock,
  AlertCircle, Wallet, Smartphone,
  CreditCard, Zap, Sparkles, ArrowRight, HandCoins
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { useUiStore } from '@/store/uiStore'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

// ─────────────────────────────────────────────────────────────
// COUPON INPUT
// ─────────────────────────────────────────────────────────────

function CouponInput({ onApply, applied, disabled }) {
  const [code,    setCode]    = useState(applied?.code ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleApply = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      await onApply(code.trim().toUpperCase())
    } catch (e) {
      setError(e.message ?? 'Invalid coupon code')
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-2xl px-3.5 py-2.5">
        <Tag size={12} className="text-brand shrink-0" />
        <span className="text-xs font-bold text-brand flex-1">{applied.code}</span>
        <span className="text-xs font-black text-brand">−{formatCurrency(applied.discount)}</span>
        <button
          onClick={() => onApply(null)}
          className="text-[10px] text-muted hover:text-red-500 font-semibold transition-colors ml-1"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder="Coupon code"
          disabled={disabled || loading}
          className={cn(
            'flex-1 text-xs px-3.5 py-2.5 rounded-xl border bg-surface outline-none text-primary',
            'focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all',
            'placeholder:text-muted',
            error ? 'border-red-300' : 'border-border',
          )}
        />
        <button
          onClick={handleApply}
          disabled={!code.trim() || disabled || loading}
          className="px-4 py-2.5 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand-600 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
        >
          {loading && <Loader2 size={11} className="animate-spin" />}
          Apply
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-medium">
          <AlertCircle size={10} />
          {error}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRICE LINE
// ─────────────────────────────────────────────────────────────

function PriceLine({ label, value, sub, muted, accent, large }) {
  return (
    <div className={cn('flex items-start justify-between gap-3', muted && 'opacity-40')}>
      <span className={cn(
        'leading-snug',
        large ? 'text-sm font-black text-primary' : 'text-xs font-medium text-secondary',
      )}>
        {label}
        {sub && <span className="block text-[10px] text-muted mt-0.5 font-normal">{sub}</span>}
      </span>
      <span className={cn(
        'font-black shrink-0 tabular-nums',
        large  ? 'text-xl text-primary' : 'text-xs text-secondary',
        accent ? 'text-brand' : '',
      )}>
        {value}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WALLET SHORTCUT STRIP
// ─────────────────────────────────────────────────────────────

function WalletStrip({ balance, total, currency, onTap }) {
  if (balance <= 0) return null
  const hasFunds = balance >= total

  return (
    <button
      onClick={hasFunds ? onTap : undefined}
      className={cn(
        'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border-2 text-left transition-all',
        hasFunds
          ? 'border-brand/40 bg-brand/10 hover:bg-brand/20 cursor-pointer'
          : 'border-border bg-surface-3 cursor-default',
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
        hasFunds ? 'bg-brand/15' : 'bg-surface-2',
      )}>
        <Wallet size={15} className={hasFunds ? 'text-brand' : 'text-muted'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-bold', hasFunds ? 'text-brand' : 'text-secondary')}>
          NovaPay Wallet · {formatCurrency(balance, currency)}
        </p>
        <p className={cn('text-[10px] mt-0.5', hasFunds ? 'text-brand/80' : 'text-muted')}>
          {hasFunds
            ? 'Tap Pay to use wallet for instant checkout'
            : `${formatCurrency(total - balance, currency)} more needed to pay with wallet`}
        </p>
      </div>
      {hasFunds && (
        <div className="flex items-center gap-1 shrink-0 bg-brand text-white rounded-lg px-2 py-1">
          <Zap size={10} />
          <span className="text-[9px] font-black">Instant</span>
        </div>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// PAYMENT METHOD ICONS ROW
// ─────────────────────────────────────────────────────────────

function MethodRow({ currency }) {
  const isGhana = currency === 'GHS'
  return (
    <div className="flex items-center justify-center gap-3">
      {isGhana ? (
        <>
          {['MTN MoMo', 'Vodafone', 'AirtelTigo'].map(m => (
            <div key={m} className="flex items-center gap-1">
              <Smartphone size={9} className="text-muted/50" />
              <span className="text-[9px] text-muted/50 font-semibold">{m}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <CreditCard size={9} className="text-muted/50" />
            <span className="text-[9px] text-muted/50 font-semibold">Card</span>
          </div>
        </>
      ) : (
        <>
          {['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'].map(m => (
            <span key={m} className="text-[9px] text-muted/50 font-semibold">{m}</span>
          ))}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

/**
 * CartSummary
 *
 * Props:
 *   items           array    — cart items from useCart
 *   currency        string   — 'GHS' | 'USD' etc.
 *   deliveryFee     number   — in smallest unit (0 = TBD)
 *   coupon          object   — { code, discount } | null
 *   onApplyCoupon   fn       — async (code | null) => void
 *   isAuthenticated bool
 *   vendorId        string
 *   vendorName      string
 *   deliveryMethod  string
 *   deliveryAddress object
 *   onSuccess       fn       — (orderId) => void
 */
export default function CartSummary({
  items           = [],
  currency        = 'GHS',
  deliveryFee     = 0,
  coupon          = null,
  onApplyCoupon,
  isAuthenticated = false,
  vendorId,
  vendorName      = 'Vendor',
  deliveryMethod,
  deliveryAddress = {},
  onSuccess,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const { balance: walletBalance } = useWallet(currency)
  const openAuthModal = useUiStore(s => s.openAuthModal)

  const subtotal  = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount  = coupon?.discount ?? 0
  const delivery  = deliveryFee ?? 0
  const total     = subtotal - discount + delivery
  const itemCount = items.reduce((s, i) => s + i.qty, 0)

  const primaryVendorId   = vendorId ?? items[0]?.vendor_id   ?? ''
  const primaryVendorName = vendorName ?? items[0]?.vendor_name ?? 'Vendor'
  const canPay            = isAuthenticated && items.length > 0 && total > 0

  return (
    <>
      {/* ── Summary card ── */}
      <div className="bg-surface-2 rounded-3xl border border-border overflow-hidden sticky top-24 shadow-sm">

        {/* Card header */}
        <div
          className="px-5 py-4 flex items-center gap-3 border-b border-border"
          style={{ background: 'linear-gradient(160deg, var(--color-surface-3) 0%, var(--color-surface-2) 100%)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
          >
            <ShieldCheck size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-primary leading-none tracking-tight">
              Order Summary
            </p>
            <p className="text-[10px] text-muted mt-0.5">
              {itemCount} item{itemCount !== 1 ? 's' : ''} · Direct Payment
            </p>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Price breakdown */}
          <div className="space-y-2.5">
            <PriceLine label="Subtotal" value={fmt(subtotal, currency)} />
            <PriceLine
              label="Delivery"
              value={delivery > 0 ? fmt(delivery, currency) : '—'}
              sub={delivery === 0 ? 'Calculated at checkout' : undefined}
              muted={delivery === 0}
            />
            {coupon && (
              <PriceLine
                label={`Coupon · ${coupon.code}`}
                value={`−${fmt(discount, currency)}`}
                accent
              />
            )}
          </div>

          <div className="h-px bg-border" />

          <PriceLine label="Total" value={fmt(total, currency)} large />

          {/* Coupon */}
          {onApplyCoupon && (
            <CouponInput
              onApply={onApplyCoupon}
              applied={coupon}
              disabled={!canPay}
            />
          )}

          <div className="h-px bg-border" />

          {/* Direct Payment Note */}
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5">
            <HandCoins size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-emerald-800">Direct Payment</p>
              <p className="text-[10px] text-emerald-600 mt-0.5 leading-relaxed">
                Coordinate payment directly with the vendor after checkout. No platform fees.
              </p>
            </div>
          </div>

          {/* Wallet shortcut */}
          {isAuthenticated && items.length > 0 && (
            <WalletStrip
              balance={walletBalance}
              total={total}
              currency={currency}
              onTap={() => setModalOpen(true)}
            />
          )}

          {/* Method row */}
          <MethodRow currency={currency} />

          {/* CTA Section */}
          <div className="space-y-2.5">
            {isAuthenticated ? (
              <>
                {/* Real Checkout Button */}
                <Link
                  href="/checkout"
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-4 rounded-2xl',
                    'text-sm font-black transition-all active:scale-[0.98]',
                    items.length > 0
                      ? 'text-white shadow-lg shadow-brand/25'
                      : 'bg-surface-3 text-muted cursor-not-allowed pointer-events-none',
                  )}
                  style={items.length > 0 ? { background: 'linear-gradient(135deg, #052E16 0%, #16A34A 100%)' } : {}}
                >
                  <ArrowRight size={16} />
                  <span>Go to Checkout</span>
                  {total > 0 && items.length > 0 && (
                    <>
                      <span className="h-4 w-px bg-white/25 mx-1" />
                      <span className="tabular-nums">{fmt(total, currency)}</span>
                    </>
                  )}
                </Link>

                {/* NovaPay Teaser Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('novapay-coming-soon')
                    if (el) {
                      el.classList.remove('hidden')
                      setTimeout(() => el.classList.add('hidden'), 3000)
                    }
                  }}
                  className="w-full group relative overflow-hidden p-4 rounded-2xl bg-neutral-900 text-white text-left transition-all active:scale-[0.98]"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-brand shrink-0" />
                      <div>
                        <p className="text-xs font-black leading-tight">Pay with NovaPay</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5 italic">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <div id="novapay-coming-soon" className="hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-neutral-800 text-white px-3 py-2 rounded-xl border border-neutral-700 flex items-center gap-2">
                    <AlertCircle size={12} className="text-brand" />
                    <p className="text-[10px] font-bold">MoMo &amp; Card payments coming soon!</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <button
                  onClick={() => openAuthModal('Sign in to complete your purchase.')}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-black"
                  style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
                >
                  <Lock size={14} /> Sign in to Checkout
                </button>
                <p className="text-center text-[10px] text-muted">
                  or{' '}
                  <Link href="/register" className="text-brand font-semibold hover:underline">
                    create a free account
                  </Link>
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-muted leading-relaxed">
            By paying you agree to Novara's{' '}
            <Link href="/terms" className="text-brand hover:underline">Terms</Link>.
          </p>

        </div>
      </div>


    </>
  )
}