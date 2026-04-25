'use client'
// FILE: src/app/(customer)/orders/page.jsx

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useOrders } from '@/hooks/useOrders'
import OrderCard from '@/components/order/OrderCard'
import OrderFilter, { DEFAULT_ORDER_TABS } from '@/components/order/OrderFilters'
import { cn } from '@/utils/cn'
import {
  ShieldCheck, ShoppingBag, Flame, TrendingUp,
  CheckCircle2, Package, ArrowRight, Zap,
  Gift, RotateCcw,
} from 'lucide-react'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
// DEMO ORDER
// ─────────────────────────────────────────────────────────────

const DEMO_ORDER = {
  id:              '__demo__',
  is_demo:         true,
  order_number:    'NQ-7821',
  status:          'pending',
  escrow_stage:    'payment_secured',
  total_amount:    128500,
  currency:        'GHS',
  tracking_number: 'GH-DHL-48291022',
  delivery_method: 'courier_shipping',
  estimated_delivery:  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  dispute_window_ends: null,
  otp_code:        null,
  created_at:      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  vendor: {
    id: 'v-demo', store_name: 'Kojo Tech Hub',
    initial: 'K', avatar_url: null, avatar_color: '#16A34A',
    trust_score: 98, badges: ['Verified', 'Top Seller', 'Fast Delivery'],
    response_time: '~12 min',
    business_address: '42 Independence Avenue',
    business_city: 'Accra',
    business_country: 'Ghana',
  },
  items: [
    { id: 'i1', name: 'Wireless Noise-Cancelling Headphones Pro', variant: 'Midnight Black', qty: 1, price: 98500, image_url: null, color: '#1e293b' },
    { id: 'i2', name: 'Premium Braided USB-C Cable 2m',           variant: 'Space Grey',    qty: 2, price: 15000, image_url: null, color: '#64748b' },
  ],
  address: { label: 'Home', line: 'Adum, Near Kejetia Market, Kumasi, Ashanti' },
  timeline: [
    { event: 'Order placed',              at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),              done: true  },
    { event: 'Payment secured in escrow', at: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 3 * 60000).toISOString(),  done: true  },
    { event: 'Vendor confirmed order',    at: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 2 * 3600000).toISOString(), done: true  },
    { event: 'Order packaged & sealed',   at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),              done: true  },
    { event: 'Handed to courier (DHL)',   at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),                  done: true  },
    { event: 'Out for delivery',          at: null, done: false },
    { event: 'Delivered to your address', at: null, done: false },
  ],
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

const isActive = s => ['pending', 'confirmed', 'preparing', 'shipped'].includes(s)

// ─────────────────────────────────────────────────────────────
// STATS STRIP
// ─────────────────────────────────────────────────────────────

function StatsStrip({ orders }) {
  const stats = [
    { label: 'Total',    value: orders.length,                                      icon: ShoppingBag,  color: '#64748b', bg: '#F8FAFC' },
    { label: 'Active',   value: orders.filter(o => isActive(o.status)).length,     icon: Flame,        color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Spent',    value: fmt(orders.reduce((s,o) => s + o.total_amount, 0)), icon: TrendingUp,   color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Done',     value: orders.filter(o => o.status === 'completed').length,icon: CheckCircle2, color: '#059669', bg: '#ECFDF5' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {stats.map(s => (
        <div key={s.label} className="rounded-2xl p-3 flex items-center gap-2.5" style={{ background: s.bg }}>
          <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shrink-0">
            <s.icon size={15} style={{ color: s.color }} />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-black leading-tight" style={{ color: s.color }}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// QUICK REORDER
// ─────────────────────────────────────────────────────────────

function ReorderSuggestion({ orders }) {
  const last = orders.find(o => o.status === 'completed')
  if (!last?.items?.[0]) return null
  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5">
      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
        <Gift size={16} className="text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-amber-800">Buy again?</p>
        <p className="text-[10px] text-amber-600 truncate mt-0.5">
          <strong>{last.items[0].name}</strong> · {last.vendor.store_name}
        </p>
      </div>
      <button className="flex items-center gap-1 px-3 py-2 bg-amber-500 text-white text-[11px] font-bold rounded-xl hover:bg-amber-600 transition-colors shrink-0">
        <RotateCcw size={11} /> Reorder
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LIVE TOAST
// ─────────────────────────────────────────────────────────────

function LiveToast({ toast }) {
  if (!toast) return null
  return (
    <div
      key={toast.key}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      style={{ animation: 'toastIn .3s cubic-bezier(.16,1,.3,1) both' }}
    >
      <div className="flex items-center gap-2.5 bg-neutral-900 text-white px-4 py-2.5 rounded-full shadow-2xl text-xs font-semibold whitespace-nowrap">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
        </span>
        {toast.text}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SKELETONS
// ─────────────────────────────────────────────────────────────

function Skeletons() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-neutral-100 rounded-full w-2/5" />
              <div className="h-2 bg-neutral-100 rounded-full w-1/3" />
              <div className="h-2 bg-neutral-100 rounded-full w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState({ filter }) {
  return (
    <div className="flex flex-col items-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        <Package size={28} className="text-neutral-300" />
      </div>
      <h3 className="text-sm font-bold text-neutral-600 mb-1">
        {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
      </h3>
      <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-5">
        {filter === 'all'
          ? 'Browse the feed and explore page to find products you love.'
          : `You don't have any ${filter} orders right now.`}
      </p>
      {filter === 'all' && (
        <Link href="/explore" className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-colors">
          <Zap size={13} /> Start Shopping
        </Link>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [filter, setFilter] = useState('all')
  const { orders: liveOrders, loading, liveToast } = useOrders()

  // Confirm delivery → update DB → realtime subscription patches UI
  const handleConfirmDelivery = useCallback(async (orderId) => {
    if (orderId === '__demo__') return // handled inside [id] page
    const supabase = createClient()
    await supabase
      .from('orders')
      .update({ status: 'completed', escrow_stage: 'released', completed_at: new Date().toISOString() })
      .eq('id', orderId)
  }, [])

  // Merge: demo first, then real orders
  const allOrders = [DEMO_ORDER, ...liveOrders]

  // Filter
  const filtered = allOrders.filter(o => {
    if (filter === 'all')    return true
    if (filter === 'active') return isActive(o.status)
    return o.status === filter
  })

  // Tab counts — real orders only so numbers are honest
  const counts = DEFAULT_ORDER_TABS.reduce((acc, tab) => {
    if (tab.key === 'all')         acc[tab.key] = liveOrders.length
    else if (tab.key === 'active') acc[tab.key] = liveOrders.filter(o => isActive(o.status)).length
    else                           acc[tab.key] = liveOrders.filter(o => o.status === tab.key).length
    return acc
  }, {})

  return (
    <>
      <LiveToast toast={liveToast} />

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">My Orders</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand" />
              </span>
              <p className="text-[11px] text-neutral-400 font-medium">Synced in real-time</p>
            </div>
          </div>
          <Link href="/explore" className="flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-700 mt-1 transition-colors">
            Shop more <ArrowRight size={13} />
          </Link>
        </div>

        {/* Stats — real orders only */}
        <StatsStrip orders={liveOrders} />

        {/* Reorder suggestion */}
        <ReorderSuggestion orders={liveOrders} />

        {/* Escrow assurance */}
        <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-2xl p-3.5">
          <ShieldCheck size={15} className="text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-brand-800">Escrow-protected on every order</p>
            <p className="text-[10px] text-brand-600 mt-0.5 leading-relaxed">
              Your money is held securely by Novara until you confirm delivery.
              You have 48 hours after delivery to raise any dispute before funds release.
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <OrderFilter active={filter} onChange={setFilter} counts={counts} />

        {/* Order list */}
        {loading ? (
          <Skeletons />
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                defaultOpen={order.is_demo}
                onConfirmDelivery={handleConfirmDelivery}
                // Tap the card header → navigate to detail page (except demo)
                detailHref={`/orders/${order.id}`}
              />
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-neutral-400 pt-2">
          All orders update automatically · Payments protected by Novara Escrow
        </p>
      </div>

      <style jsx global>{`
        @keyframes toastIn {
          from { opacity:0; transform:translate(-50%,-12px) scale(.95); }
          to   { opacity:1; transform:translate(-50%,0)     scale(1); }
        }
      `}</style>
    </>
  )
}