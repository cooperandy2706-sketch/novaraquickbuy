'use client'
// FILE: src/components/novapay/NovaPayButton.jsx
// Drop-in NovaPay trigger button.
// Wraps NovaPayModal — just place this wherever you need a Pay button.
// Shows wallet balance inline if user has funds.

import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import NovaPayModal  from '@/components/novapay/NovaPayModal'
import { cn } from '@/utils/cn'
import { ShieldCheck, Wallet, Lock } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

/**
 * NovaPayButton
 *
 * Props:
 *   amount          number    — total in smallest unit (e.g. 5000 = ₵50)
 *   currency        string    — 'GHS' | 'USD' etc.
 *   items           array     — cart items
 *   vendorId        string
 *   vendorName      string
 *   deliveryMethod  string
 *   deliveryAddress object
 *   deliveryFee     number
 *   couponDiscount  number
 *   onSuccess       fn        — (orderId) => void
 *   disabled        bool
 *   className       string
 *   size            'sm' | 'md' | 'lg'
 *   variant         'primary' | 'outline' | 'ghost'
 */
export default function NovaPayButton({
  amount,
  currency     = 'GHS',
  items        = [],
  vendorId,
  vendorName,
  deliveryMethod,
  deliveryAddress,
  deliveryFee    = 0,
  couponDiscount = 0,
  onSuccess,
  disabled       = false,
  className,
  size           = 'lg',
  variant        = 'primary',
}) {
  const [open, setOpen] = useState(false)
  const { balance }     = useWallet(currency)
  const hasWalletFunds  = balance >= amount

  const sizeClasses = {
    sm: 'px-4 py-2.5 text-xs gap-1.5',
    md: 'px-5 py-3 text-sm gap-2',
    lg: 'px-6 py-4 text-sm gap-2',
  }

  const variantClasses = {
    primary: 'bg-brand text-white hover:bg-brand-600 shadow-md shadow-brand/20',
    outline: 'bg-white text-brand border-2 border-brand hover:bg-brand-50',
    ghost:   'bg-brand-50 text-brand hover:bg-brand-100',
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled || !amount}
        className={cn(
          'relative flex items-center justify-center font-black rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
      >
        {/* Wallet indicator */}
        {hasWalletFunds && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 items-center gap-0.5 bg-brand-700 text-white text-[8px] font-black px-1.5 rounded-full">
            <Wallet size={7} /> {fmt(balance, currency)}
          </span>
        )}

        <div
          className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: variant === 'primary' ? 'rgba(255,255,255,0.2)' : 'rgba(22,163,74,0.15)' }}
        >
          <ShieldCheck size={12} />
        </div>

        <span>Pay with NovaPay</span>

        {amount > 0 && (
          <>
            <span className={cn(
              'h-4 w-px',
              variant === 'primary' ? 'bg-white/30' : 'bg-brand/30',
            )} />
            <span className="tabular-nums">{fmt(amount, currency)}</span>
          </>
        )}

        <Lock size={12} className="opacity-60" />
      </button>

      <NovaPayModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={(orderId) => {
          setOpen(false)
          onSuccess?.(orderId)
        }}
        amount={amount}
        currency={currency}
        items={items}
        vendorId={vendorId}
        vendorName={vendorName}
        deliveryMethod={deliveryMethod}
        deliveryAddress={deliveryAddress}
        deliveryFee={deliveryFee}
        couponDiscount={couponDiscount}
      />
    </>
  )
}