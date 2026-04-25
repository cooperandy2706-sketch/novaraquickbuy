'use client'
// FILE: src/components/order/OrderSummary.jsx
// Order price breakdown + the critical "Confirm Delivery" CTA.
// Confirming delivery releases the escrowed payment to the vendor.
// Used on both the checkout page (before order) and order detail (after delivery).

import { useState } from 'react'
import { cn } from '@/utils/cn'
import {
  ShieldCheck, CheckCircle2, ChevronDown,
  Tag, Truck, Receipt, AlertCircle, Loader2,
  BadgeCheck, Star, ChevronUp,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

// ─────────────────────────────────────────────────────────────
// LINE ITEM ROW
// ─────────────────────────────────────────────────────────────

function LineRow({ label, value, sub, bold, muted, accent, strikethrough }) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-4',
      muted && 'opacity-60',
    )}>
      <span className={cn(
        'text-xs leading-snug',
        bold ? 'font-bold text-neutral-800' : 'font-medium text-neutral-500',
      )}>
        {label}
        {sub && <span className="block text-[10px] font-normal text-neutral-400 mt-0.5">{sub}</span>}
      </span>
      <span className={cn(
        'text-xs font-bold shrink-0',
        bold    ? 'text-neutral-900 text-sm' : '',
        accent  ? 'text-brand'              : 'text-neutral-700',
        strikethrough ? 'line-through text-neutral-400' : '',
      )}>
        {value}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONFIRM DELIVERY MODAL / INLINE
// ─────────────────────────────────────────────────────────────

function ConfirmDeliveryPanel({ order, onConfirm, loading }) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-b from-brand-50 to-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-brand-100">
        <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <ShieldCheck size={16} className="text-brand" />
        </div>
        <div>
          <p className="text-sm font-bold text-brand-800 leading-tight">
            Confirm Your Delivery
          </p>
          <p className="text-[10px] text-brand-500 mt-0.5">
            Confirming delivery marks the order as completed
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3.5">
        {/* What this means */}
        <div className="space-y-2">
          {[
            { icon: CheckCircle2, text: 'You\'ve received your order in good condition',     color: 'text-emerald-500' },
            { icon: BadgeCheck,   text: 'The order will be marked as completed',             color: 'text-brand'       },
            { icon: Star,         text: 'You\'ll be able to leave a review after confirming', color: 'text-amber-500'  },
            { icon: AlertCircle,  text: 'This action cannot be undone — confirm carefully',   color: 'text-orange-500' },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-start gap-2">
              <Icon size={13} className={cn('mt-0.5 shrink-0', color)} />
              <p className="text-[11px] text-neutral-600 leading-snug">{text}</p>
            </div>
          ))}
        </div>

        {/* Amount being released */}
        <div className="bg-white rounded-xl border border-brand-100 px-3.5 py-3">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            Order Total
          </p>
          <p className="text-2xl font-black text-brand-800 tracking-tight">
            {fmt(order?.total_amount ?? 0, order?.currency)}
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            from {order?.vendor?.store_name ?? 'vendor'}
          </p>
        </div>

        {/* Checkbox agreement */}
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="sr-only"
            />
            <div className={cn(
              'w-4.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all',
              checked
                ? 'bg-brand border-brand'
                : 'bg-white border-neutral-300 group-hover:border-brand-300',
            )}>
              {checked && <span className="text-white font-black" style={{ fontSize: 10 }}>✓</span>}
            </div>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            I confirm I have received this order in satisfactory condition and agree to mark it as completed.
          </p>
        </label>

        {/* CTA */}
        <button
          disabled={!checked || loading}
          onClick={() => onConfirm?.(order?.id)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
            'text-sm font-bold transition-all duration-200',
            checked && !loading
              ? 'bg-brand text-white hover:bg-brand-600 active:scale-[0.98] shadow-md shadow-brand/30'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
          )}
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Confirming…</>
            : <><CheckCircle2 size={15} /> Confirm Delivery</>
          }
        </button>

        {!checked && (
          <p className="text-center text-[10px] text-neutral-400">
            Tick the checkbox above to enable confirmation
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

/**
 * OrderSummary
 *
 * Props:
 *   order           object  — order with items, totals, status, vendor
 *   showConfirm     bool    — show confirm delivery panel (true when status === 'delivered')
 *   onConfirm       fn      — (orderId) => Promise<void>
 *   confirmLoading  bool    — loading state for the confirm action
 *   couponCode      string  — optional applied coupon
 *   couponDiscount  number  — discount amount in smallest unit (e.g. pesewas)
 *   deliveryFee     number  — delivery cost in smallest unit
 *   showItems       bool    — whether to show the items breakdown (default true)
 */
export default function OrderSummary({
  order,
  showConfirm    = false,
  onConfirm,
  confirmLoading = false,
  couponCode,
  couponDiscount = 0,
  deliveryFee    = 0,
  showItems      = true,
}) {
  const [itemsOpen, setItemsOpen] = useState(true)

  if (!order) return null

  const currency    = order.currency ?? 'GHS'
  const subtotal    = (order.items ?? []).reduce((s, i) => s + i.price * i.qty, 0)
  const discount    = couponDiscount ?? 0
  const delivery    = deliveryFee ?? 0
  const total       = subtotal - discount + delivery

  return (
    <div className="space-y-3">

      {/* ── Confirm Delivery (escrow release) ─────────────── */}
      {showConfirm && order.status === 'delivered' && (
        <ConfirmDeliveryPanel
          order={order}
          onConfirm={onConfirm}
          loading={confirmLoading}
        />
      )}

      {/* ── Price summary card ─────────────────────────────  */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-100">
          <Receipt size={14} className="text-neutral-400" />
          <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Order Summary
          </span>
          <span className="ml-auto text-[10px] font-mono text-neutral-400">
            {order.order_number}
          </span>
        </div>

        <div className="px-4 py-3 space-y-2.5">

          {/* Items toggle */}
          {showItems && (order.items ?? []).length > 0 && (
            <div>
              <button
                onClick={() => setItemsOpen(p => !p)}
                className="flex items-center justify-between w-full text-left mb-2"
              >
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Items ({order.items.length})
                </span>
                <ChevronDown
                  size={12}
                  className={cn('text-neutral-400 transition-transform', itemsOpen && 'rotate-180')}
                />
              </button>

              {itemsOpen && (
                <div className="space-y-2 mb-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-neutral-700 truncate">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-neutral-400 mt-0.5">
                          {item.variant && `${item.variant} · `}Qty {item.qty}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-neutral-600 shrink-0">
                        {fmt(item.price * item.qty, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-neutral-100" />

          {/* Subtotal */}
          <LineRow
            label="Subtotal"
            value={fmt(subtotal, currency)}
          />

          {/* Delivery fee */}
          {delivery > 0 ? (
            <LineRow
              label="Delivery"
              sub={order.delivery_method?.replace(/_/g, ' ')}
              value={fmt(delivery, currency)}
            />
          ) : (
            <LineRow
              label="Delivery"
              value="Calculated at checkout"
              muted
            />
          )}

          {/* Coupon */}
          {couponCode && discount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tag size={11} className="text-brand" />
                <span className="text-xs font-medium text-brand">{couponCode}</span>
              </div>
              <span className="text-xs font-bold text-brand">
                -{fmt(discount, currency)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-neutral-100" />

          {/* Total */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-black text-neutral-800">Total</span>
            <span className="text-lg font-black text-neutral-900">
              {fmt(total > 0 ? total : order.total_amount, currency)}
            </span>
          </div>
        </div>

        {/* Direct Payment assurance */}
        <div className="flex items-center gap-2 px-4 py-3 bg-brand-50 border-t border-brand-100">
          <ShieldCheck size={13} className="text-brand shrink-0" />
          <p className="text-[10px] text-brand-700 font-medium leading-snug">
            All payments are handled directly between you and the vendor.
          </p>
        </div>
      </div>
    </div>
  )
}