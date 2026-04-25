'use client'
// FILE: src/app/(customer)/checkout/page.jsx
// Payment is temporarily via manual arrangement — NovaPay integration coming soon.

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient }   from '@/lib/supabase/client'
import { placeOrder }     from '@/lib/actions/checkout'
import { useCart } from '@/hooks/useCart'
import DeliverySelector from '@/components/order/DeliverySelector'
import PaymentSelector  from '@/components/order/PaymentSelector'
import { cn } from '@/utils/cn'
import {
  ArrowLeft, CheckCircle2, Package,
  Phone, Sparkles, ShieldCheck, Tag, Lock,
  MapPin, Clock, MessageCircle, AlertCircle, Loader2,
  Truck, ShoppingBag, ChevronRight,
} from 'lucide-react'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

const DELIVERY_FEES = {
  courier:         2500,
  vendor_delivery: 1500,
  store_pickup:    0,
  novara_delivery: 0,
}

const DELIVERY_LABELS = {
  courier:         'Courier Shipping',
  vendor_delivery: 'Vendor Delivery',
  store_pickup:    'Store Pickup',
  novara_delivery: 'Novara Delivery',
}

// ─────────────────────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'review',   label: 'Review'   },
  { key: 'delivery', label: 'Delivery' },
  { key: 'payment',  label: 'Payment'  },
  { key: 'success',  label: 'Done'     },
]

function StepBar({ current }) {
  const idx = STEPS.findIndex(s => s.key === current)
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((step, i) => {
        const done = i < idx, active = i === idx
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all',
                done   && 'bg-brand text-white',
                active && 'text-white ring-4 ring-brand/20',
                !done && !active && 'bg-neutral-100 text-neutral-400',
              )}
              style={active ? { background: 'linear-gradient(135deg,#052E16,#16A34A)' } : {}}
              >
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={cn(
                'text-[9px] font-bold whitespace-nowrap',
                active ? 'text-brand' : done ? 'text-neutral-500' : 'text-neutral-300',
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-px flex-1 mb-5 mx-1 transition-all duration-500',
                i < idx ? 'bg-brand' : 'bg-neutral-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ORDER ITEM ROW (read-only, in review/summary panels)
// ─────────────────────────────────────────────────────────────

function OrderItemRow({ item, currency }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0">
      <div
        className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-neutral-100 flex items-center justify-center"
      >
        {item.image_url
          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          : <Package size={16} className="text-neutral-300" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 truncate">{item.name}</p>
        {item.variant_label && (
          <p className="text-[10px] text-neutral-400 mt-0.5">{item.variant_label}</p>
        )}
        <p className="text-[10px] text-neutral-500 mt-0.5">
          {fmt(item.price, currency)} × {item.qty}
        </p>
      </div>
      <p className="text-sm font-black text-neutral-900 shrink-0 tabular-nums">
        {fmt(item.price * item.qty, currency)}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRICE SUMMARY TABLE
// ─────────────────────────────────────────────────────────────

function PriceSummary({ subtotal, deliveryFee, couponDiscount, currency }) {
  const total = subtotal + deliveryFee - couponDiscount
  return (
    <div className="space-y-2 pt-2 border-t border-neutral-100">
      <div className="flex justify-between text-xs">
        <span className="text-neutral-500">Subtotal</span>
        <span className="font-bold text-neutral-700">{fmt(subtotal, currency)}</span>
      </div>
      {deliveryFee > 0 && (
        <div className="flex justify-between text-xs">
          <span className="text-neutral-500">Delivery</span>
          <span className="font-bold text-neutral-700">{fmt(deliveryFee, currency)}</span>
        </div>
      )}
      {couponDiscount > 0 && (
        <div className="flex justify-between text-xs text-brand">
          <span className="font-semibold">Discount</span>
          <span className="font-bold">−{fmt(couponDiscount, currency)}</span>
        </div>
      )}
      <div className="flex justify-between pt-2 border-t border-neutral-100">
        <span className="text-sm font-black text-neutral-800">Total</span>
        <span className="text-xl font-black text-neutral-900 tabular-nums">{fmt(total, currency)}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SUCCESS STATE
// ─────────────────────────────────────────────────────────────

function SuccessState({ orderId }) {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-5">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
      >
        <CheckCircle2 size={40} className="text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
          Order Confirmed!
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-xs leading-relaxed">
          Your order has been placed. The vendor will contact you to arrange payment and delivery.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 max-w-sm w-full text-left space-y-2">
        <div className="flex items-center gap-2">
          <Phone size={15} className="text-green-600" />
          <p className="text-xs font-bold text-green-800">Next Steps</p>
        </div>
        <p className="text-[11px] text-green-600 leading-relaxed">
          The vendor will reach out via WhatsApp or phone to confirm your order and arrange payment.
          You can also contact them directly using the button below.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href={`/orders/${orderId}`}
          className="flex items-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
        >
          <Package size={15} /> Track Order
        </Link>
        <Link
          href="/explore"
          className="flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 text-sm font-bold rounded-2xl hover:bg-neutral-200 transition-colors"
        >
          <Sparkles size={15} /> Keep Shopping
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clear } = useCart()

  const [step,            setStep]            = useState('review')   // review | delivery | payment | success
  const [deliveryMethod,  setDeliveryMethod]  = useState(null)
  const [paymentMethod,   setPaymentMethod]   = useState(null)
  const [deliveryAddress, setDeliveryAddress] = useState({})
  const [deliveryFee,     setDeliveryFee]     = useState(0)
  const [coupon,          setCoupon]          = useState(null)       // { code, discount }
  const [couponLoading,   setCouponLoading]   = useState(false)
  const [couponError,     setCouponError]     = useState(null)
  const [couponInput,     setCouponInput]     = useState('')
  const [modalOpen,       setModalOpen]       = useState(false)
  const [completedOrderId,setCompletedOrderId]= useState(null)
  const [placingOrder,    setPlacingOrder]    = useState(false)

  const primaryVendorId = items[0]?.vendor_id   ?? ''
  const vendorName      = items[0]?.vendor_name ?? 'Vendor'
  const currency        = items[0]?.currency    ?? 'GHS'
  const discount        = coupon?.discount ?? 0
  const total           = subtotal + deliveryFee - discount

  const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
  const paymentText = paymentMethod ? `via ${paymentMethod.replace(/_/g, ' ')}` : ''
  const whatsappMsg = encodeURIComponent(`Hi! I just placed an order on Novara QuickBuy for ${vendorName}. Total: ${fmt(total, currency)}. I'd like to arrange payment ${paymentText}.`)
  const WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP}?text=${whatsappMsg}`

  // Guard: redirect if cart empty (unless on success step)
  if (!items.length && step !== 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-12 text-center">
        <ShoppingBag size={32} className="text-neutral-300 mx-auto mb-4" />
        <p className="text-sm text-neutral-500 mb-4">Your cart is empty.</p>
        <Link href="/cart" className="text-brand font-semibold text-sm hover:underline">
          Back to Cart
        </Link>
      </div>
    )
  }

  // Coupon apply
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.toUpperCase(), subtotal }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Invalid coupon')
      const { discount: d } = await res.json()
      setCoupon({ code: couponInput.toUpperCase(), discount: d })
      setCouponInput('')
    } catch (e) {
      setCouponError(e.message)
    } finally {
      setCouponLoading(false)
    }
  }

  // Delivery change
  const handleDeliveryChange = (method, address) => {
    setDeliveryMethod(method)
    setDeliveryFee(DELIVERY_FEES[method] ?? 0)
    if (address) setDeliveryAddress(address)
  }

  // Order placed (bypass NovaPay, write to DB directly)
  const handlePlaceOrder = async () => {
    setPlacingOrder(true)
    try {
      const orderData = {
        items,
        subtotal,
        delivery_fee: deliveryFee,
        coupon_discount: discount,
        total_amount: total,
        currency,
        delivery_method: deliveryMethod,
        payment_method:  paymentMethod,
        delivery_address: deliveryAddress,
        vendor_id: primaryVendorId,
      }

      const res = await placeOrder(orderData)
      
      if (!res.success) {
        toast.error(res.error || 'Failed to place order')
        return
      }

      setCompletedOrderId(res.order_id)
      setStep('success')
      clear()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (step === 'success') {
    return <SuccessState orderId={completedOrderId} />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-20">

      {/* Back link (hidden on success) */}
      {step !== 'success' && (
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors mb-6"
        >
          <ArrowLeft size={13} /> Back to Cart
        </Link>
      )}

      {/* Title */}
      <h1 className="text-2xl font-black text-neutral-900 tracking-tight mb-2">Checkout</h1>

      {/* Step bar */}
      <StepBar current={step} />

      {/* ── SUCCESS ── */}
      {step === 'success' && <SuccessState orderId={completedOrderId} />}

      {/* ── REVIEW + DELIVERY + PAYMENT STEPS ── */}
      {step !== 'success' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── Left column ── */}
          <div className="space-y-4">

            {/* ── STEP: REVIEW ── */}
            {step === 'review' && (
              <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100">
                  <p className="text-sm font-black text-neutral-800">Review Your Items</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {items.reduce((s,i)=>s+i.qty,0)} items from {vendorName}
                  </p>
                </div>
                <div className="px-5 py-2">
                  {items.map(item => (
                    <OrderItemRow key={item.id} item={item} currency={currency} />
                  ))}
                </div>
                <div className="px-5 py-4">
                  <button
                    onClick={() => setStep('delivery')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-black transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#052E16,#16A34A)' }}
                  >
                    Continue to Delivery <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: DELIVERY ── */}
            {step === 'delivery' && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep('review')}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 font-semibold transition-colors"
                >
                  <ArrowLeft size={12} /> Back to Review
                </button>

                {/* Delivery selector card */}
                <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-100">
                    <p className="text-sm font-black text-neutral-800">Choose Delivery</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      How would you like to receive your order from {vendorName}?
                    </p>
                  </div>
                  <div className="px-5 py-5">
                    <DeliverySelector
                      value={deliveryMethod}
                      onChange={handleDeliveryChange}
                      vendorName={vendorName}
                    />
                  </div>
                </div>

                {/* Coupon code */}
                <div className="bg-white rounded-3xl border border-neutral-200 p-5">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                    Coupon Code
                  </p>
                  {coupon ? (
                    <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-2xl px-4 py-3">
                      <Tag size={13} className="text-brand" />
                      <span className="text-xs font-bold text-brand flex-1">{coupon.code}</span>
                      <span className="text-xs font-black text-brand">−{fmt(discount, currency)}</span>
                      <button
                        onClick={() => setCoupon(null)}
                        className="text-[10px] text-neutral-400 hover:text-red-500 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={e => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter coupon code"
                          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all placeholder:text-neutral-300"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={!couponInput.trim() || couponLoading}
                          className="px-4 py-2.5 bg-brand text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-brand-600 transition-all flex items-center gap-1.5 shrink-0"
                        >
                          {couponLoading && <Loader2 size={11} className="animate-spin" />}
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <div className="flex items-center gap-1.5 text-[10px] text-red-500">
                          <AlertCircle size={10} /> {couponError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pay CTA card */}
                <div className="bg-white rounded-3xl border border-neutral-200 p-5 space-y-4">
                  {/* Payment selector */}
                  <PaymentSelector value={paymentMethod} onChange={setPaymentMethod} />

                  <button
                    onClick={() => {
                      if (!deliveryMethod || !paymentMethod) return
                      if (!deliveryAddress?.phone) {
                        toast.error('Please enter a contact phone number for delivery')
                        return
                      }
                      handlePlaceOrder()
                    }}
                    disabled={!deliveryMethod || !paymentMethod || placingOrder}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-4 rounded-2xl',
                      'text-sm font-black transition-all active:scale-[0.98]',
                      (deliveryMethod && paymentMethod)
                        ? 'text-white shadow-lg shadow-brand/25'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
                    )}
                    style={(deliveryMethod && paymentMethod)
                      ? { background: 'linear-gradient(135deg, #052E16, #16A34A)' }
                      : {}
                    }
                  >
                    {placingOrder ? (
                      <><Loader2 size={16} className="animate-spin" /> Placing Order…</>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        Place Order
                        <span className="h-4 w-px bg-white/25 mx-1" />
                        <span className="tabular-nums">{fmt(total, currency)}</span>
                      </>
                    )}
                  </button>


                </div>
              </div>
            )}

            {/* ── STEP: PAYMENT (modal open, show placeholder) ── */}
            {step === 'payment' && !modalOpen && (
              <div className="bg-white rounded-3xl border border-neutral-200 p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <Loader2 size={24} className="text-brand animate-spin" />
                </div>
                <p className="text-sm font-bold text-neutral-700">Opening NovaPay…</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="text-xs text-brand font-semibold hover:underline"
                >
                  Click here if payment didn&apos;t open
                </button>
              </div>
            )}

          </div>

          {/* ── Right column: order summary ── */}
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden sticky top-24">
            {/* Header */}
            <div
              className="px-5 py-4 border-b border-neutral-100"
              style={{ background: 'linear-gradient(160deg,#f0fdf4,#ffffff)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#052E16,#16A34A)' }}
                >
                  <ShieldCheck size={13} className="text-white" />
                </div>
                <p className="text-sm font-black text-neutral-900">Your Order</p>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Items (compact) */}
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image_url
                        ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        : <Package size={13} className="text-neutral-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-neutral-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-neutral-400">×{item.qty}</p>
                    </div>
                    <span className="text-[11px] font-black text-neutral-800 shrink-0 tabular-nums">
                      {fmt(item.price * item.qty, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery badge */}
              {deliveryMethod && (
                <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-100">
                  <Truck size={13} className="text-neutral-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-neutral-600">
                      {DELIVERY_LABELS[deliveryMethod] ?? deliveryMethod}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-neutral-700">
                    {deliveryFee > 0 ? fmt(deliveryFee, currency) : 'Free'}
                  </span>
                </div>
              )}

              {/* Coupon badge */}
              {coupon && (
                <div className="flex items-center gap-2 bg-brand-50 rounded-xl px-3 py-2.5 border border-brand-100">
                  <Tag size={13} className="text-brand shrink-0" />
                  <p className="text-[10px] font-bold text-brand flex-1">{coupon.code}</p>
                  <span className="text-[10px] font-black text-brand">−{fmt(discount, currency)}</span>
                </div>
              )}

              {/* Price summary */}
              <PriceSummary
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                couponDiscount={discount}
                currency={currency}
              />

              {/* Direct payment assurance */}
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <Lock size={10} className="shrink-0" />
                <span>Payment is handled directly between you and the vendor.</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}