'use client'
// FILE: src/app/(customer)/orders/[id]/page.jsx

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

import OrderStatusTimeline from '@/components/order/OrderStatusTimeline'
import OrderSummary        from '@/components/order/OrderSummary'
import { STATUS_CONFIG }   from '@/components/order/OrderCard'
import OrderReceipt        from '@/components/vendor/orders/OrderReceipt'
import { cn } from '@/utils/cn'
import {
  ArrowLeft, Package, Truck, MapPin, Clock,
  MessageCircle, Copy, CheckCircle2, Eye, EyeOff,
  QrCode, AlertCircle, BadgeCheck, Sparkles,
  ExternalLink, Loader2,
} from 'lucide-react'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { buyerCancelOrder, buyerUpdateAddress } from '@/lib/actions/buyerOrders'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────
// DEMO ORDER  (shown when id === '__demo__')
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
  estimated_delivery:  new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  dispute_window_ends: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
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
  address: { street: 'Adum, Near Kejetia Market', city: 'Kumasi', region: 'Ashanti', landmark: 'Old Post Office', phone: '024 123 4567' },
  timeline: [
    { event: 'Order placed',              at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),              done: true },
    { event: 'Payment secured in escrow', at: new Date(Date.now() - 2 * 24 * 3600000 + 180000).toISOString(),     done: true },
    { event: 'Vendor confirmed order',    at: new Date(Date.now() - 2 * 24 * 3600000 + 7200000).toISOString(),    done: true },
    { event: 'Order packaged & sealed',   at: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),              done: true },
    { event: 'Handed to courier (DHL)',   at: new Date(Date.now() - 18 * 3600000).toISOString(),                  done: true },
    { event: 'Out for delivery',          at: new Date(Date.now() - 4 * 3600000).toISOString(),                   done: true },
    { event: 'Delivered to your address', at: new Date(Date.now() - 1 * 3600000).toISOString(),                   done: true },
  ],
}

// ─────────────────────────────────────────────────────────────
// MAP RAW DB ROW → UI SHAPE
// ─────────────────────────────────────────────────────────────

function mapOrder(o) {
  return {
    id:                  o.id,
    order_number:        o.order_number  ?? `NQ-${o.id.slice(-5).toUpperCase()}`,
    status:              o.status,
    escrow_stage:        o.escrow_stage        ?? 'payment_secured',
    total_amount:        o.total_amount        ?? 0,
    currency:            o.currency            ?? 'GHS',
    tracking_number:     o.tracking_number     ?? null,
    delivery_method:     o.delivery_method     ?? null,
    estimated_delivery:  o.estimated_delivery  ?? null,
    dispute_window_ends: o.dispute_window_ends ?? null,
    otp_code:            o.otp_code            ?? null,
    created_at:          o.created_at,
    address:             o.delivery_address    ?? null,
    vendor: {
      id:            o.vendor?.id            ?? '',
      store_name:    o.vendor?.store_name    ?? 'Unknown Vendor',
      initial:       (o.vendor?.store_name   ?? 'V')[0].toUpperCase(),
      avatar_url:    o.vendor?.avatar_url    ?? null,
      avatar_color:  '#16A34A',
      trust_score:   o.vendor?.trust_score   ?? 0,
      badges:        o.vendor?.badges        ?? [],
      response_time: o.vendor?.response_time ?? null,
      business_phone:o.vendor?.business_phone?? null,
    },
    items: (o.order_items ?? []).map(item => ({
      id:        item.id,
      name:      item.product?.name       ?? 'Product',
      variant:   item.variant_label       ?? '',
      qty:       item.quantity            ?? 1,
      price:     item.unit_price          ?? 0,
      image_url: item.product?.images?.[0] ?? null,
      color:     '#64748b',
    })),
    timeline: (o.order_timeline ?? [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(t => ({ event: t.event, at: t.created_at, done: true, note: t.note })),
  }
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ─────────────────────────────────────────────────────────────
// TRACKING ROW
// ─────────────────────────────────────────────────────────────

function TrackingRow({ trackingNumber }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(trackingNumber).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3.5 py-3 border border-neutral-100">
      <Truck size={14} className="text-brand shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Tracking Number</p>
        <p className="text-sm font-bold text-neutral-800 font-mono truncate mt-0.5">{trackingNumber}</p>
      </div>
      <button
        onClick={copy}
        className="w-8 h-8 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-brand hover:border-brand-200 transition-all"
      >
        {copied ? <CheckCircle2 size={13} className="text-brand" /> : <Copy size={13} />}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// OTP ROW
// ─────────────────────────────────────────────────────────────

function OtpRow({ otp }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-3">
      <QrCode size={14} className="text-violet-500 shrink-0" />
      <div className="flex-1">
        <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">Delivery OTP</p>
        <p className={cn('text-lg font-black tracking-[0.35em] text-violet-700 mt-0.5 transition-all select-none', !visible && 'blur-sm')}>
          {visible ? otp : '••••••'}
        </p>
      </div>
      <button
        onClick={() => setVisible(p => !p)}
        className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-500 hover:bg-violet-200 transition-all"
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VENDOR CARD
// ─────────────────────────────────────────────────────────────

function VendorCard({ vendor, orderId }) {
  const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
  const targetPhone = vendor.business_phone ?? SUPPORT_WHATSAPP
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(`Hi ${vendor.store_name}, I have a question regarding my order #${orderId}.`)}`

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-black shrink-0 overflow-hidden"
          style={{ background: vendor.avatar_color ?? '#16A34A' }}
        >
          {vendor.avatar_url
            ? <img src={vendor.avatar_url} alt="" className="w-full h-full object-cover" />
            : vendor.initial
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-neutral-800">{vendor.store_name}</span>
            {(vendor.badges ?? []).map(b => (
              <span key={b} className="text-[8px] font-bold bg-brand-50 text-brand px-1.5 py-0.5 rounded-full border border-brand-100">{b}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-neutral-400">
              Trust score: <strong className="text-emerald-600">{vendor.trust_score}%</strong>
            </span>
            {vendor.response_time && (
              <span className="text-[10px] text-neutral-400">Replies {vendor.response_time}</span>
            )}
          </div>
          {vendor.business_address && (
            <div className="flex items-start gap-1.5 mt-2">
              <MapPin size={10} className="text-neutral-300 mt-0.5 shrink-0" />
              <p className="text-[10px] text-neutral-500 leading-tight">
                {vendor.business_address}, {vendor.business_city}, {vendor.business_country}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#20bd5a] transition-colors"
        >
          <MessageCircle size={13} /> Chat on WhatsApp
        </a>
        <Link
          href={`/store/${vendor.id}`}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-neutral-50 text-neutral-600 border border-neutral-200 text-xs font-bold rounded-xl hover:bg-neutral-100 transition-colors"
        >
          <ExternalLink size={13} /> View Store
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ITEMS LIST
// ─────────────────────────────────────────────────────────────

function ItemsList({ items, currency }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          Items ({items.length})
        </p>
      </div>
      <div className="divide-y divide-neutral-100">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
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
              <p className="text-sm font-semibold text-neutral-800 leading-snug">{item.name}</p>
              {item.variant && <p className="text-[10px] text-neutral-400 mt-0.5">{item.variant}</p>}
              <p className="text-[11px] text-neutral-500 mt-1">
                {fmt(item.price, currency)} × {item.qty}
              </p>
            </div>
            <span className="text-sm font-black text-neutral-800 shrink-0">
              {fmt(item.price * item.qty, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS HEADER BANNER
// ─────────────────────────────────────────────────────────────

function StatusBanner({ order }) {
  const cfg        = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const StatusIcon = cfg.icon
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3 border"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border"
        style={{ background: 'white', borderColor: cfg.border }}
      >
        <StatusIcon size={20} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
          {cfg.label}
        </p>
        <p className="text-sm font-black text-neutral-800 mt-0.5">{order.order_number}</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">
          Placed {fmtDate(order.created_at)} at {fmtTime(order.created_at)}
          {order.vendor?.store_name ? ` · ${order.vendor.store_name}` : ''}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id }     = useParams()
  const router     = useRouter()
  const { user }   = useAuthStore()
  const supabase   = createClient()

  const [order,          setOrder]          = useState(id === '__demo__' ? DEMO_ORDER : null)
  const [loading,        setLoading]        = useState(id !== '__demo__')
  const [notFound,       setNotFound]       = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [showReceipt,    setShowReceipt]    = useState(false)
  const [showCancel,     setShowCancel]     = useState(false)
  const [showAddress,    setShowAddress]    = useState(false)
  const [cancelReason,   setCancelReason]   = useState('')
  const [newAddr,        setNewAddr]        = useState(order?.address ?? {})
  const [actionLoading,  setActionLoading]  = useState(false)

  // Sync newAddr with order address when it loads
  useEffect(() => { if (order?.address) setNewAddr(order.address) }, [order?.address])

  // ── Fetch single order ─────────────────────────────────────
  useEffect(() => {
    if (id === '__demo__') return
    if (!user) return

    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, escrow_stage,
          total_amount, currency, tracking_number,
          delivery_method, estimated_delivery,
          dispute_window_ends, otp_code, created_at,
          delivery_address,
          vendor:vendors ( id, store_name, avatar_url, trust_score, badges, response_time, business_phone, business_address, business_city, business_country ),
          order_items (
            id, quantity, unit_price, variant_label,
            product:products ( id, name, images )
          ),
          order_timeline ( event, created_at )
        `)
        .eq('id', id)
        .eq('buyer_id', user.id)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }
      setOrder(mapOrder(data))
      setLoading(false)
    }

    fetch()

    // ── Realtime: subscribe to this specific order ───────────
    const channel = supabase
      .channel(`order-detail-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${id}`,
      }, (payload) => {
        setOrder(prev => prev ? {
          ...prev,
          status:              payload.new.status,
          escrow_stage:        payload.new.escrow_stage,
          tracking_number:     payload.new.tracking_number,
          dispute_window_ends: payload.new.dispute_window_ends,
          otp_code:            payload.new.otp_code,
        } : prev)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'order_timeline',
        filter: `order_id=eq.${id}`,
      }, (payload) => {
        setOrder(prev => prev ? {
          ...prev,
          timeline: [
            ...prev.timeline,
            { event: payload.new.event, at: payload.new.created_at, done: true },
          ],
        } : prev)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id, user?.id])

  // ── Confirm delivery → release escrow ─────────────────────
  const handleConfirmDelivery = useCallback(async (orderId) => {
    if (orderId === '__demo__') {
      setConfirmLoading(true)
      await new Promise(r => setTimeout(r, 1800))
      setConfirmLoading(false)
      // Simulate the state change locally for the demo
      setOrder(prev => prev ? { ...prev, status: 'completed', escrow_stage: 'released' } : prev)
      setShowReceipt(true)
      return
    }

    setConfirmLoading(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status:       'completed',
          escrow_stage: 'released',
          completed_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('buyer_id', user.id)

      if (error) throw error
      // Realtime subscription above will patch the local state automatically
      setShowReceipt(true)
    } catch (err) {
      console.error('Confirm delivery failed:', err)
    } finally {
      setConfirmLoading(false)
    }
  }, [user?.id, supabase])

  const handleCancel = async () => {
    if (id === '__demo__') { toast.success('Demo: Order cancelled'); setOrder(o => ({...o, status: 'cancelled'})); setShowCancel(false); return }
    setActionLoading(true)
    const res = await buyerCancelOrder(id, cancelReason || 'Cancelled by buyer')
    setActionLoading(false)
    if (res.error) toast.error(res.error)
    else { toast.success('Order cancelled'); setShowCancel(false) }
  }

  const handleUpdateAddress = async () => {
    if (id === '__demo__') { toast.success('Demo: Address updated'); setOrder(o => ({...o, address: newAddr})); setShowAddress(false); return }
    if (!newAddr.phone) { toast.error('Phone number is required'); return }
    setActionLoading(true)
    const res = await buyerUpdateAddress(id, newAddr)
    setActionLoading(false)
    if (res.error) toast.error(res.error)
    else { toast.success('Address updated'); setShowAddress(false) }
  }

  // ── States ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 space-y-4">
        <div className="h-8 bg-neutral-100 rounded-full w-32 animate-pulse" />
        <div className="h-20 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
        <div className="h-48 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
        <div className="h-64 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <Package size={28} className="text-neutral-300" />
        </div>
        <h2 className="text-lg font-bold text-neutral-700 mb-1">Order not found</h2>
        <p className="text-xs text-neutral-400 mb-6">This order doesn't exist or doesn't belong to your account.</p>
        <Link href="/orders" className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-colors">
          <ArrowLeft size={13} /> Back to Orders
        </Link>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-12 space-y-4">

      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft size={14} /> All Orders
        </Link>
        {order.is_demo && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Sparkles size={11} className="text-brand" />
            <span className="text-[10px] font-bold text-brand-600">Demo Order</span>
          </div>
        )}
      </div>

      {/* Status banner */}
      <StatusBanner order={order} />

      {/* Quick Actions (Cancel / Edit Address) */}
      {!['completed', 'cancelled', 'disputed'].includes(order.status) && (
        <div className="flex gap-2">
          {order.status === 'pending' && (
            <button 
              onClick={() => setShowCancel(true)}
              className="flex-1 py-2.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
            >
              Cancel Order
            </button>
          )}
          {!['shipped', 'delivered'].includes(order.status) && (
            <button 
              onClick={() => setShowAddress(true)}
              className="flex-1 py-2.5 rounded-xl border border-neutral-100 bg-neutral-50 text-neutral-500 text-[11px] font-black uppercase tracking-widest hover:bg-neutral-100 transition-all"
            >
              Edit Address
            </button>
          )}
        </div>
      )}

      {/* Items */}
      <ItemsList items={order.items} currency={order.currency} />

      {/* Delivery info */}
      <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
        {order.address && (
          <div className="flex items-start gap-3 px-4 py-3.5">
            <MapPin size={14} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                Delivery Address
              </p>
              <div className="text-sm font-medium text-neutral-700 mt-0.5 space-y-0.5">
                {typeof order.address === 'string' ? (
                  <p>{order.address}</p>
                ) : order.address.line ? (
                  <p>{order.address.line}</p>
                ) : (
                  <>
                    <p>{order.address.street}</p>
                    <p className="text-[11px] text-neutral-500">
                      {[order.address.city, order.address.region].filter(Boolean).join(', ')}
                    </p>
                    {order.address.landmark && (
                      <p className="text-[10px] text-neutral-400 italic">Landmark: {order.address.landmark}</p>
                    )}
                    {order.address.phone && (
                      <p className="text-[10px] text-brand-600 font-bold mt-1">📞 {order.address.phone}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {order.estimated_delivery && !['delivered','completed','cancelled'].includes(order.status) && (
          <div className="flex items-start gap-3 px-4 py-3.5">
            <Clock size={14} className="text-brand mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">
                Estimated Delivery
              </p>
              <p className="text-sm font-bold text-brand-700 mt-0.5">
                {fmtDate(order.estimated_delivery)}
              </p>
            </div>
          </div>
        )}

        {order.delivery_method && (
          <div className="flex items-start gap-3 px-4 py-3.5">
            <Truck size={14} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                Delivery Method
              </p>
              <p className="text-sm font-medium text-neutral-700 mt-0.5 capitalize">
                {order.delivery_method.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tracking / OTP */}
      {order.tracking_number && <TrackingRow trackingNumber={order.tracking_number} />}
      {order.otp_code && ['shipped','delivered'].includes(order.status) && (
        <OtpRow otp={order.otp_code} />
      )}

      {/* Status timeline + event log */}
      <OrderStatusTimeline
        escrowStage={order.escrow_stage}
        disputeWindowEnds={order.dispute_window_ends}
        timeline={order.timeline}
        showEscrow={false}
      />

      {/* Order summary + confirm delivery (escrow release) */}
      <OrderSummary
        order={order}
        showConfirm={['shipped', 'out_for_delivery', 'delivered'].includes(order.status)}
        onConfirm={handleConfirmDelivery}
        confirmLoading={confirmLoading}
        showItems={false}
      />

      {order.status === 'completed' && (
        <button onClick={() => setShowReceipt(true)} className="w-full flex items-center justify-center gap-2 py-3.5 bg-neutral-100 text-neutral-700 text-sm font-bold rounded-2xl hover:bg-neutral-200 transition-colors">
          <Printer size={15} /> View Final Receipt
        </button>
      )}

      {/* Vendor */}
      <VendorCard vendor={order.vendor} orderId={order.id} />

      {/* Cancel Modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-neutral-800 tracking-tight">Cancel Order?</h3>
                <p className="text-xs text-neutral-500 mt-1">Are you sure you want to cancel this order? This action cannot be undone.</p>
              </div>
              <textarea 
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-neutral-100 bg-neutral-50 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 transition-all resize-none"
                rows={3}
              />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCancel(false)} className="flex-1 py-3 rounded-xl bg-neutral-50 text-neutral-500 text-xs font-bold hover:bg-neutral-100 transition-all">
                  No, Keep It
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Edit Modal */}
      {showAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-neutral-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widest">Update Delivery Address</h3>
              <button onClick={() => setShowAddress(false)} className="p-2 hover:bg-neutral-50 rounded-xl transition-all">
                <EyeOff size={16} className="text-neutral-300" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Street / Area</label>
                <input 
                  type="text" value={newAddr.street || ''} 
                  onChange={e => setNewAddr({...newAddr, street: e.target.value})}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-100 bg-neutral-50 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                  placeholder="e.g. 123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">City</label>
                  <input 
                    type="text" value={newAddr.city || ''} 
                    onChange={e => setNewAddr({...newAddr, city: e.target.value})}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-100 bg-neutral-50 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                    placeholder="Accra"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Region</label>
                  <input 
                    type="text" value={newAddr.region || ''} 
                    onChange={e => setNewAddr({...newAddr, region: e.target.value})}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-100 bg-neutral-50 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                    placeholder="Greater Accra"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Nearest Landmark</label>
                <input 
                  type="text" value={newAddr.landmark || ''} 
                  onChange={e => setNewAddr({...newAddr, landmark: e.target.value})}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-100 bg-neutral-50 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                  placeholder="Behind the post office"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Contact Phone</label>
                <input 
                  type="tel" value={newAddr.phone || ''} 
                  onChange={e => setNewAddr({...newAddr, phone: e.target.value})}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-100 bg-neutral-50 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                  placeholder="024 000 0000"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowAddress(false)} className="flex-1 py-3.5 rounded-2xl bg-neutral-50 text-neutral-500 text-xs font-bold hover:bg-neutral-100 transition-all">
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateAddress}
                  disabled={actionLoading}
                  className="flex-1 py-3.5 rounded-2xl bg-brand text-white text-xs font-bold shadow-lg shadow-brand/20 hover:bg-brand-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Update Address'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <OrderReceipt order={order} vendor={order.vendor} onClose={() => setShowReceipt(false)} />
      )}

    </div>
  )
}