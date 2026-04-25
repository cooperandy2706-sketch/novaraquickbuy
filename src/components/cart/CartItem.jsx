'use client'
// FILE: src/components/cart/CartItem.jsx
// Individual cart row.
// Qty stepper, remove, save-to-wishlist.
// Locks when disabled (NovaPay modal is open).

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import {
  Minus, Plus, Trash2, Heart,
  Package, AlertTriangle, Store,
  CheckCircle2,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

// ─────────────────────────────────────────────────────────────
// QTY STEPPER
// ─────────────────────────────────────────────────────────────

function QtyStepper({ qty, max = 99, onChange, disabled }) {
  return (
    <div className="flex items-center gap-0 rounded-xl border border-border bg-surface-3 overflow-hidden">
      <button
        onClick={() => onChange(qty - 1)}
        disabled={disabled || qty <= 1}
        className={cn(
          'w-8 h-8 flex items-center justify-center text-muted',
          'hover:bg-surface-2 hover:text-primary transition-colors',
          'disabled:opacity-30 disabled:cursor-not-allowed',
        )}
      >
        <Minus size={12} strokeWidth={2.5} />
      </button>
      <span className="w-8 text-center text-xs font-black text-primary tabular-nums select-none">
        {qty}
      </span>
      <button
        onClick={() => onChange(qty + 1)}
        disabled={disabled || qty >= max}
        className={cn(
          'w-8 h-8 flex items-center justify-center text-muted',
          'hover:bg-surface-2 hover:text-primary transition-colors',
          'disabled:opacity-30 disabled:cursor-not-allowed',
        )}
      >
        <Plus size={12} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WISHLIST SAVE ANIMATION
// ─────────────────────────────────────────────────────────────

function WishlistBtn({ onToggle, active, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
        active
          ? 'text-rose-500 bg-rose-500/10'
          : 'text-muted hover:text-rose-500 hover:bg-rose-500/10',
      )}
      title={active ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={13}
        fill={active ? 'currentColor' : 'none'}
        className={cn(active && 'animate-pop-in')}
      />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

/**
 * CartItem
 *
 * Props:
 *   item           object  — from useCart
 *   onUpdateQty    fn      — (id, qty) => void
 *   onRemove       fn      — (id) => void
 *   onSaveWishlist fn      — (item) => void (optional)
 *   disabled       bool    — locks all controls (during payment)
 */
export default function CartItem({
  item,
  onUpdateQty,
  onRemove,
  onToggleWishlist,
  isWishlisted = false,
  disabled = false,
}) {
  const [removing, setRemoving] = useState(false)
  const lowStock   = item.max_qty != null && item.max_qty <= 5
  const lineTotal  = item.price * item.qty

  const handleRemove = async () => {
    setRemoving(true)
    await onRemove(item.id)
  }

  return (
    <div className={cn(
      'group relative flex gap-3 p-3.5 rounded-2xl bg-surface-2 border border-border',
      'transition-all duration-300',
      removing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100',
      disabled && 'opacity-60 pointer-events-none',
    )}>

      {/* Product image */}
      <Link href={`/product/${item.product_id}`} className="shrink-0">
        <div
          className="w-[72px] h-[72px] rounded-xl overflow-hidden flex items-center justify-center bg-surface-3 hover:scale-105 transition-transform duration-200"
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={22} className="text-muted/30" />
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">

        {/* Vendor label */}
        <div className="flex items-center gap-1.5">
          <Store size={9} className="text-muted/50 shrink-0" />
          <span className="text-[10px] text-muted font-medium truncate">
            {item.vendor_name}
          </span>
        </div>

        {/* Name */}
        <Link href={`/product/${item.product_id}`}>
          <p className="text-sm font-semibold text-primary leading-snug line-clamp-2 hover:text-brand transition-colors">
            {item.name}
          </p>
        </Link>

        {/* Variant badge */}
        {item.variant_label && (
          <span className="self-start text-[10px] font-medium text-secondary bg-surface-3 rounded-lg px-2 py-0.5">
            {item.variant_label}
          </span>
        )}

        {/* Low stock */}
        {lowStock && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
            <AlertTriangle size={9} />
            Only {item.max_qty} left
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center gap-2 mt-auto pt-0.5 flex-wrap">
          <QtyStepper
            qty={item.qty}
            max={item.max_qty}
            onChange={(q) => onUpdateQty(item.id, q)}
            disabled={disabled}
          />

          <span className="text-sm font-black text-primary ml-1 tabular-nums">
            {fmt(lineTotal, item.currency)}
          </span>

            <div className="ml-auto flex items-center gap-1">
              {onToggleWishlist && (
                <WishlistBtn
                  onToggle={() => onToggleWishlist(item)}
                  active={isWishlisted}
                  disabled={disabled}
                />
              )}
              <button
              onClick={handleRemove}
              disabled={disabled}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
              title="Remove from cart"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}