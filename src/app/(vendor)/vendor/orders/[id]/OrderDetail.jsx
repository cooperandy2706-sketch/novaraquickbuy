'use client'
// FILE: src/app/(vendor)/vendor/orders/[id]/OrderDetail.jsx

import { useState }  from 'react'
import { useRouter } from 'next/navigation'
import Link          from 'next/link'
import {
  ChevronLeft, Printer, CheckCircle2,
  Package, Truck, XCircle, RefreshCw,
  MessageSquare, Clock, User, MapPin,
  CreditCard, AlertCircle, Loader2, Phone,
} from 'lucide-react'
import { useRealtimeOrderDetail } from '@/hooks/useRealtimeOrders'
import { useAuth }                from '@/hooks/useAuth'
import OrderStatusBadge, { STATUS_CONFIG, ESCROW_CONFIG } from '@/components/vendor/orders/OrderStatusBadge'
import OrderTimeline    from '@/components/vendor/orders/OrderTimeline'
import EscrowPanel      from '@/components/vendor/orders/EscrowPanel'
import ComplaintPanel   from '@/components/vendor/orders/ComplaintPanel'
import OrderReceipt     from '@/components/vendor/orders/OrderReceipt'
import ShipmentModal    from '@/components/vendor/orders/ShipmentModal'
import { acceptOrder, updateOrderStatus, cancelOrder, markOutForDelivery } from '@/lib/actions/orders'
import { cn }           from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

export default function OrderDetail({ initialOrder, vendor }) {
  const currency = useLocaleStore(s => s.currency)
  const router      = useRouter()
  const { profile } = useAuth()
  const vendorId    = profile?.vendor?.id ?? vendor?.id ?? null

  const { order, setOrder } = useRealtimeOrderDetail(initialOrder, initialOrder?.id)

  const [showReceipt,  setShowReceipt]  = useState(false)
  const [showShipment, setShowShipment] = useState(false)
  const [showCancel,   setShowCancel]   = useState(false)
  const [showAccept,   setShowAccept]   = useState(false)
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [loading,      setLoading]      = useState(null)
  const [error,        setError]        = useState(null)

  if (!order) return null

  const buyer     = order.buyer
  const items     = order.order_items ?? []
  const payment   = order.payments?.[0]
  const delivery  = order.delivery
  const history   = order.order_history ?? []
  const orderId   = order.id.slice(0, 8).toUpperCase()
  const status    = order.status
  const isPending = status === 'pending'
  const isActive  = ['vendor_accepted', 'preparing', 'shipped'].includes(status)
  const isDone    = ['delivered', 'completed', 'cancelled', 'disputed'].includes(status)

  const act = async (fn, key) => {
    setLoading(key)
    setError(null)
    const res = await fn()
    setLoading(null)
    if (res?.error) setError(res.error)
  }

  const handleAccept   = async () => {
    if (!estimatedDelivery) return
    await act(() => acceptOrder(order.id, estimatedDelivery), 'accept')
    setShowAccept(false)
  }
  const handlePreparing = () => act(() => updateOrderStatus(order.id, 'preparing', 'Order is being prepared'), 'preparing')
  const handleCancel   = async () => {
    if (!cancelReason.trim()) return
    await act(() => cancelOrder(order.id, cancelReason), 'cancel')
    setShowCancel(false)
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-32 sm:pb-10">

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => router.push('/vendor/orders')}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted hover:text-brand hover:border-brand/40 transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-primary">Order #{orderId}</h1>
            <OrderStatusBadge status={status} size="md" />
          </div>
          <p className="text-xs text-muted mt-0.5">
            Placed {new Date(order.created_at).toLocaleString('en', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={() => setShowReceipt(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-secondary hover:border-brand hover:text-brand hover:bg-brand/10 transition-all shadow-sm">
          <Printer size={15} /> Receipt
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-danger shrink-0" />
          <p className="text-sm text-danger font-medium">{error}</p>
        </div>
      )}

      {/* Action bar (Fixed Bottom on Mobile) */}
      {!isDone && (
        <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto z-40 bg-surface-1 sm:bg-surface-2 sm:rounded-2xl border-t sm:border border-border shadow-[0_-8px_30px_rgb(0,0,0,0.08)] sm:shadow-sm p-4 flex gap-3 safe-bottom animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0">
          {isPending && (
            <>
              <button onClick={() => setShowCancel(true)}
                className="flex-[0.5] sm:flex-none flex items-center justify-center gap-2 py-3 sm:py-2.5 sm:px-4 rounded-xl border border-danger/30 text-danger font-semibold text-sm hover:bg-danger/5 transition-all">
                Decline
              </button>
              <button onClick={() => setShowAccept(true)} disabled={loading === 'accept'}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 sm:py-2.5 sm:px-4 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-700 disabled:opacity-50 shadow-brand transition-all active:scale-[0.98]">
                {loading === 'accept' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Accept Order
              </button>
            </>
          )}
          {status === 'vendor_accepted' && (
            <button onClick={handlePreparing} disabled={loading === 'preparing'}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 sm:py-2.5 sm:px-4 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-50 transition-all active:scale-[0.98]">
              {loading === 'preparing' ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
              Mark Preparing
            </button>
          )}
          {status === 'preparing' && (
            <button onClick={() => setShowShipment(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 sm:py-2.5 sm:px-4 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition-all active:scale-[0.98]">
              <Truck size={16} /> Mark Shipped
            </button>
          )}
          {status === 'shipped' && (
            <button onClick={() => act(() => markOutForDelivery(order.id), 'delivery')}
              disabled={loading === 'delivery'}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 sm:py-2.5 sm:px-4 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]">
              {loading === 'delivery' ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
              Out for Delivery
            </button>
          )}
          
          <div className="hidden sm:flex ml-auto items-center gap-3">
            {isActive && status !== 'vendor_accepted' && (
              <button onClick={() => setShowCancel(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-secondary font-semibold text-sm hover:bg-surface-3 transition-all">
                <XCircle size={15} /> Cancel Order
              </button>
            )}
            <Link href={`/vendor/chat/${order.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-secondary font-semibold text-sm hover:border-brand hover:text-brand hover:bg-brand/10 transition-all">
              <MessageSquare size={15} /> Message Buyer
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT (2/3) ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* Order items */}
          <div className="bg-surface-2 sm:rounded-2xl -mx-4 sm:mx-0 border-y sm:border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 bg-surface-3/30">
              <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                <Package size={14} className="text-brand" /> Items ({items.length})
              </h3>
            </div>
            <div className="divide-y divide-border/50">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-3 border border-border/50 overflow-hidden shrink-0">
                    {item.product?.thumbnail_url
                      ? <img src={item.product.thumbnail_url} alt={item.product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-muted"><Package size={16} /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/vendor/products/${item.product?.id}`}
                      className="text-sm font-semibold text-primary hover:text-brand truncate block transition-colors">
                      {item.product?.name ?? 'Product'}
                    </Link>
                    {item.product?.sku && (
                      <p className="text-xs text-muted mt-0.5 font-mono">SKU: {item.product.sku}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary tabular-nums">{formatCurrency(item.total_price ?? 0, currency)}</p>
                    <p className="text-xs text-muted">x{item.quantity} × {formatCurrency(item.unit_price ?? 0, currency)}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-5 py-4 border-t border-border/50 bg-surface-3/20 space-y-1.5">
              {order.subtotal > 0 && (
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span><span>{formatCurrency(order.subtotal, currency)}</span>
                </div>
              )}
              {order.shipping_fee > 0 && (
                <div className="flex justify-between text-sm text-muted">
                  <span>Shipping</span><span>{formatCurrency(order.shipping_fee, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-primary pt-1.5 border-t border-border/50">
                <span>Total</span><span>{formatCurrency(order.total_amount ?? 0, currency)}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          {delivery && (
            <div className="bg-surface-2 sm:rounded-2xl -mx-4 sm:mx-0 border-y sm:border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 bg-surface-3/30">
                <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                  <Truck size={14} className="text-brand" /> Delivery
                </h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted mb-0.5">Method</p>
                  <p className="font-medium text-primary capitalize">{order.delivery_method?.replace(/_/g,' ') ?? '—'}</p>
                </div>
                {delivery.courier_name && (
                  <div>
                    <p className="text-xs font-semibold text-muted mb-0.5">Courier</p>
                    <p className="font-medium text-primary">{delivery.courier_name}</p>
                  </div>
                )}
                {delivery.tracking_number && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-muted mb-0.5">Tracking Number</p>
                    <p className="font-mono font-bold text-primary text-base">{delivery.tracking_number}</p>
                  </div>
                )}
                {delivery.estimated_at && (
                  <div>
                    <p className="text-xs font-semibold text-muted mb-0.5">Est. Delivery</p>
                    <p className="font-medium text-primary">{new Date(delivery.estimated_at).toLocaleDateString()}</p>
                  </div>
                )}
                {delivery.delivered_at && (
                  <div>
                    <p className="text-xs font-semibold text-muted mb-0.5">Delivered</p>
                    <p className="font-medium text-emerald-600">{new Date(delivery.delivered_at).toLocaleString()}</p>
                  </div>
                )}
                {order.otp_code && (
                  <div>
                    <p className="text-xs font-semibold text-muted mb-0.5">OTP Code</p>
                    <p className="font-mono font-bold text-xl text-primary tracking-widest">{order.otp_code}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order timeline */}
          <div className="bg-surface-2 sm:rounded-2xl -mx-4 sm:mx-0 border-y sm:border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 bg-surface-3/30">
              <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                <Clock size={14} className="text-brand" /> Order History
              </h3>
            </div>
            <div className="p-5">
              <OrderTimeline history={history} />
            </div>
          </div>

          {/* Complaint panel */}
          <ComplaintPanel order={order} onUpdate={() => {}} />
        </div>

        {/* ── RIGHT (1/3) ────────────────────────────────────────────────── */}
        <div className="space-y-4 sm:space-y-5">

          {/* Buyer info */}
          <div className="bg-surface-2 sm:rounded-2xl -mx-4 sm:mx-0 border-y sm:border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 bg-surface-3/30">
              <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                <User size={14} className="text-brand" /> Buyer
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                {buyer?.avatar_url ? (
                  <img src={buyer.avatar_url} alt={buyer.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold shrink-0">
                    {buyer?.full_name?.charAt(0) ?? 'B'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{buyer?.full_name ?? 'Buyer'}</p>
                  <p className="text-[10px] text-muted font-medium uppercase tracking-wider">{buyer?.email ?? 'No email provided'}</p>
                </div>
              </div>

              {/* Order Specific Contact */}
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                      <Phone size={12} />
                    </div>
                    <span className="text-xs font-bold text-primary">{order.delivery_address?.phone || buyer?.phone || 'No phone provided'}</span>
                  </div>
                  {(order.delivery_address?.phone || buyer?.phone) && (
                    <a 
                      href={`https://wa.me/${(order.delivery_address?.phone || buyer?.phone).replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                    <MapPin size={12} />
                  </div>
                  <div className="flex-1">
                    {order.delivery_method === 'store_pickup' ? (
                      <p className="text-xs font-bold text-amber-700 italic">Store Pickup — No delivery address needed.</p>
                    ) : order.delivery_address?.street ? (
                      <div className="text-xs text-secondary leading-relaxed">
                        <p className="font-bold text-primary">{order.delivery_address.street}</p>
                        <p>{order.delivery_address.city}, {order.delivery_address.region}</p>
                        {order.delivery_address.landmark && <p className="text-[10px] italic mt-1 text-muted">Landmark: {order.delivery_address.landmark}</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">No delivery address provided.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link href={`/vendor/chat/${order.id}`}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-bold text-secondary hover:border-brand hover:text-brand hover:bg-brand/10 transition-all">
                  <MessageSquare size={13} /> Internal Chat
                </Link>
                {(order.delivery_address?.phone || buyer?.phone) && (
                  <a 
                    href={`https://wa.me/${(order.delivery_address?.phone || buyer?.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi! I am the vendor for your Novara QuickBuy order #${orderId}. I am reaching out to coordinate delivery.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold shadow-lg shadow-green-500/10 hover:brightness-95 active:scale-95 transition-all"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Payment */}
          {payment && (
            <div className="bg-surface-2 sm:rounded-2xl -mx-4 sm:mx-0 border-y sm:border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 bg-surface-3/30">
                <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                  <CreditCard size={14} className="text-brand" /> Payment
                </h3>
              </div>
              <div className="p-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Method</span>
                  <span className="font-medium text-primary capitalize">{payment.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <span className={cn('font-semibold capitalize', payment.status === 'success' ? 'text-emerald-600' : 'text-amber-600')}>
                    {payment.status}
                  </span>
                </div>
                {payment.transaction_ref && (
                  <div className="flex justify-between">
                    <span className="text-muted">Ref</span>
                    <span className="font-mono text-xs text-primary">{payment.transaction_ref.slice(0,16)}</span>
                  </div>
                )}
                {payment.verified_at && (
                  <div className="flex justify-between">
                    <span className="text-muted">Verified at</span>
                    <span className="text-xs text-secondary">{new Date(payment.verified_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Escrow panel */}
          <EscrowPanel order={order} onUpdate={() => {}} />
        </div>
      </div>

      {/* Modals */}
      {showReceipt && (
        <OrderReceipt order={order} vendor={vendor} onClose={() => setShowReceipt(false)} />
      )}
      {showShipment && (
        <ShipmentModal
          orderId={order.id}
          onClose={() => setShowShipment(false)}
          onSuccess={() => router.refresh()}
        />
      )}
      {showCancel && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCancel(false)} />
          <div className="relative bg-surface-2 rounded-t-[32px] sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-300 pb-safe">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto sm:hidden mb-2" />
            <div>
              <h3 className="text-xl font-bold text-primary">Cancel Order</h3>
              <p className="text-sm text-muted mt-1">Please provide a reason for cancellation. The buyer will be notified.</p>
            </div>
            <textarea rows={3} placeholder="Reason for cancellation…" value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-3 px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none transition-all" />
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)}
                className="flex-1 py-3.5 rounded-xl border border-border text-sm font-bold text-secondary hover:bg-surface-3 transition-all">
                Back
              </button>
              <button onClick={handleCancel} disabled={!cancelReason.trim() || loading === 'cancel'}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-danger text-white font-bold text-sm disabled:opacity-50 hover:bg-red-700 transition-all active:scale-[0.98]">
                {loading === 'cancel' ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Confirm Cancel</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccept && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowAccept(false)} />
          <div className="relative bg-surface-2 rounded-t-[32px] sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-300 pb-safe">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto sm:hidden mb-2" />
            <div>
              <h3 className="text-xl font-bold text-primary">Accept Order</h3>
              <p className="text-sm text-muted mt-1">
                {order.delivery_method === 'store_pickup' 
                  ? 'When will the order be ready for pickup?' 
                  : 'When is the estimated delivery time?'}
              </p>
            </div>
            <input 
              type="datetime-local" 
              value={estimatedDelivery}
              onChange={e => setEstimatedDelivery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-3 px-4 py-4 text-base sm:text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all" 
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAccept(false)}
                className="flex-1 py-3.5 rounded-xl border border-border text-sm font-bold text-secondary hover:bg-surface-3 transition-all">
                Back
              </button>
              <button onClick={handleAccept} disabled={!estimatedDelivery || loading === 'accept'}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-50 hover:bg-brand-700 transition-all active:scale-[0.98]">
                {loading === 'accept' ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Confirm</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}