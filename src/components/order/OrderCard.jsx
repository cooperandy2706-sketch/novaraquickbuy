'use client'
// FILE: src/components/order/OrderCard.jsx
// Collapsible order card. Shows status badge, item list, vendor trust panel,
// tracking info, OTP reveal, and context-aware action buttons.
// Used in the orders list page.

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import {
  Package, Truck, CheckCircle2, Clock,
  XCircle, ChevronDown, MessageCircle,
  AlertCircle, Star, RotateCcw, MapPin,
  Copy, Eye, EyeOff, BadgeCheck, QrCode,
  Gift, Sparkles,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: Clock        },
  confirmed: { label: 'Confirmed', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: BadgeCheck   },
  preparing: { label: 'Preparing', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: Package      },
  shipped:   { label: 'Shipped',   color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: Truck        },
  delivered: { label: 'Delivered', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle2 },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: XCircle      },
  disputed:  { label: 'Disputed',  color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', icon: AlertCircle  },
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

function timeAgo(iso) {
  if (!iso) return '—'
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────
// TRACKING + OTP ROW
// ─────────────────────────────────────────────────────────────

function TrackingRow({ trackingNumber }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(trackingNumber).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-100">
      <Truck size={13} className="text-brand shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">
          Tracking
        </p>
        <p className="text-xs font-bold text-neutral-700 font-mono truncate">
          {trackingNumber}
        </p>
      </div>
      <button
        onClick={copy}
        className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-brand hover:border-brand-200 transition-all"
      >
        {copied
          ? <CheckCircle2 size={12} className="text-brand" />
          : <Copy size={12} />
        }
      </button>
    </div>
  )
}

function OtpRow({ otp }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
      <QrCode size={13} className="text-violet-500 shrink-0" />
      <div className="flex-1">
        <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">
          Delivery OTP
        </p>
        <p className={cn(
          'text-sm font-black tracking-[0.3em] text-violet-700 transition-all select-none',
          !visible && 'blur-sm',
        )}>
          {visible ? otp : '••••••'}
        </p>
      </div>
      <button
        onClick={() => setVisible(p => !p)}
        className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-500 hover:bg-violet-200 transition-all"
      >
        {visible ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VENDOR PANEL
// ─────────────────────────────────────────────────────────────

function VendorPanel({ vendor, orderId }) {
  return (
    <div className="flex items-center gap-3 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 overflow-hidden"
        style={{ background: vendor.avatar_color ?? '#16A34A' }}
      >
        {vendor.avatar_url
          ? <img src={vendor.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
          : vendor.initial
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-neutral-800">{vendor.store_name}</span>
          {(vendor.badges ?? []).map(b => (
            <span
              key={b}
              className="text-[8px] font-bold bg-brand-50 text-brand px-1.5 py-0.5 rounded-full border border-brand-100"
            >
              {b}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-neutral-400">
            Trust: <strong className="text-emerald-600">{vendor.trust_score ?? 0}%</strong>
          </span>
          {vendor.response_time && (
            <span className="text-[10px] text-neutral-400">
              Replies in {vendor.response_time}
            </span>
          )}
        </div>
        {vendor.business_address && (
          <div className="flex items-start gap-1.5 mt-2">
            <MapPin size={10} className="text-neutral-300 mt-0.5 shrink-0" />
            <p className="text-[10px] text-neutral-500 leading-tight">
              {vendor.business_address}, {vendor.business_city}
            </p>
          </div>
        )}
      </div>
      <Link
        href={`/chat?vendor=${vendor.id}&order=${orderId}`}
        className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-[11px] font-bold rounded-xl hover:bg-brand-600 transition-colors shrink-0"
      >
        <MessageCircle size={12} /> Chat
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ACTION BUTTONS
// ─────────────────────────────────────────────────────────────

function ActionButtons({ order, onConfirmDelivery }) {
  const { status } = order
  const hasActions = ['pending','delivered','completed','confirmed','preparing','shipped','disputed'].includes(status)
  if (!hasActions) return null

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Manage / Detail link */}
      {['pending', 'confirmed', 'preparing'].includes(status) && (
        <Link 
          href={`/orders/${order.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-bold hover:bg-neutral-200 transition-all"
        >
          Manage Order
        </Link>
      )}

      {/* Confirm delivery — triggers escrow release */}
      {status === 'delivered' && (
        <button
          onClick={() => onConfirmDelivery?.(order.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-600 transition-all active:scale-[0.98]"
        >
          <CheckCircle2 size={13} />
          Confirm Delivery &amp; Release Payment
        </button>
      )}

      {status === 'completed' && (
        <>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-all">
            <Star size={13} /> Leave Review
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-50 text-brand border border-brand-200 text-xs font-bold hover:bg-brand-100 transition-all">
            <RotateCcw size={13} /> Reorder
          </button>
        </>
      )}

      {['confirmed','preparing'].includes(status) && (
        <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-50 text-neutral-500 border border-neutral-200 text-xs font-semibold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
          <XCircle size={12} /> Request Cancellation
        </button>
      )}

      {['shipped','delivered'].includes(status) && (
        <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-50 text-orange-500 border border-orange-200 text-xs font-semibold hover:bg-orange-100 transition-all">
          <AlertCircle size={12} /> Raise Dispute
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

/**
 * OrderCard
 *
 * Props:
 *   order             object  — mapped order from useOrders
 *   defaultOpen       bool    — expand on mount (true for demo)
 *   onConfirmDelivery fn      — (orderId) => void  — triggers escrow release
 */
export default function OrderCard({ order, defaultOpen = false, onConfirmDelivery }) {
  const [open, setOpen] = useState(defaultOpen)
  const cfg        = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  return (
    <div className={cn(
      'bg-white rounded-2xl border transition-all duration-300',
      order.is_demo
        ? 'border-brand-200 ring-1 ring-brand-100 shadow-md shadow-brand-100/30'
        : 'border-neutral-200',
      open && 'shadow-lg shadow-neutral-100/80',
    )}>

      {/* Demo strip */}
      {order.is_demo && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-t-2xl bg-gradient-to-r from-brand-50 to-emerald-50 border-b border-brand-100">
          <Sparkles size={11} className="text-brand" />
          <span className="text-[10px] font-bold text-brand-700">
            Demo order — explore all features. Your real orders appear below in realtime.
          </span>
        </div>
      )}

      {/* ── Header toggle ──────────────────────────────────── */}
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setOpen(p => !p)}
      >
        {/* Status icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          <StatusIcon size={18} style={{ color: cfg.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-neutral-800 font-mono">
              {order.order_number}
            </span>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
              style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
            >
              {cfg.label.toUpperCase()}
            </span>
            {order.is_demo && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand border border-brand-200">
                DEMO
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''} ·{' '}
            <span className="font-bold text-neutral-700">
              {fmt(order.total_amount ?? 0, order.currency)}
            </span>
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            {order.vendor?.store_name} · {timeAgo(order.created_at)}
          </p>
        </div>

        <ChevronDown
          size={15}
          className={cn(
            'text-neutral-400 shrink-0 mt-1 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* ── Expanded body ──────────────────────────────────── */}
      {open && (
        <div className="px-4 pb-4 space-y-3.5 border-t border-neutral-100 pt-4">

          {/* Items */}
          <div className="space-y-2.5">
            {(order.items ?? []).map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: item.color ?? '#e5e7eb' }}
                >
                  {item.image_url
                    ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    : <Package size={16} className="text-white/60" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-800 truncate leading-snug">
                    {item.name}
                  </p>
                  {item.variant && (
                    <p className="text-[10px] text-neutral-400 mt-0.5">{item.variant}</p>
                  )}
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Qty: {item.qty} · {fmt(item.price, order.currency)} each
                  </p>
                </div>
                <span className="text-xs font-black text-neutral-700 shrink-0">
                  {fmt(item.price * item.qty, order.currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery address */}
          {order.address && (
            <div className="flex items-start gap-2.5 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
              <MapPin size={13} className="text-neutral-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  Delivery Address
                </p>
                <div className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                  {typeof order.address === 'string' ? (
                    <p>{order.address}</p>
                  ) : order.address.line ? (
                    <p>{order.address.line}</p>
                  ) : (
                    <>
                      <p className="font-bold">{order.address.street}</p>
                      <p>{[order.address.city, order.address.region].filter(Boolean).join(', ')}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estimated delivery */}
          {order.estimated_delivery && !['delivered','completed','cancelled'].includes(order.status) && (
            <div className="flex items-center gap-2.5 bg-brand-50 rounded-xl p-3 border border-brand-100">
              <Clock size={13} className="text-brand shrink-0" />
              <div>
                <p className="text-[9px] font-bold text-brand-500 uppercase tracking-wider">
                  Estimated Delivery
                </p>
                <p className="text-xs font-bold text-brand-700 mt-0.5">
                  {fmtDate(order.estimated_delivery)}
                </p>
              </div>
            </div>
          )}

          {/* Tracking & OTP */}
          {order.tracking_number && (
            <TrackingRow trackingNumber={order.tracking_number} />
          )}
          {order.otp_code && ['shipped','delivered'].includes(order.status) && (
            <OtpRow otp={order.otp_code} />
          )}

          {/* Vendor panel */}
          {order.vendor && (
            <VendorPanel vendor={order.vendor} orderId={order.id} />
          )}

          {/* Action buttons */}
          <ActionButtons order={order} onConfirmDelivery={onConfirmDelivery} />
        </div>
      )}
    </div>
  )
}