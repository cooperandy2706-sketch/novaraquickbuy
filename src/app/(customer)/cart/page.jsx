'use client'
// FILE: src/app/(customer)/cart/page.jsx
// Full NovaPay cart page.
// • Items grouped by vendor
// • Delivery method selector per vendor group
// • CartSummary opens NovaPayModal directly (no redirect)
// • Multi-vendor: each group has independent NovaPay payment
// • Recently viewed + related products below

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useWishlistStore } from '@/store/wishlistStore'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'
import CartRelatedProducts from '@/components/cart/CartRelatedProducts'
import DeliverySelector from '@/components/order/DeliverySelector'
import { cn } from '@/utils/cn'
import {
  ShoppingCart, ArrowLeft, Package,
  Sparkles, ShieldCheck, Store,
  ChevronDown, ChevronUp, Info,
  CheckCircle2, Truck,
} from 'lucide-react'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

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

// ─────────────────────────────────────────────────────────────
// EMPTY CART
// ─────────────────────────────────────────────────────────────

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
      >
        <ShoppingCart size={36} className="text-brand/40" />
      </div>
      <h2 className="text-xl font-black text-primary tracking-tight mb-2">
        Your cart is empty
      </h2>
      <p className="text-sm text-muted max-w-xs leading-relaxed mb-8">
        Discover products from vendors across Ghana and beyond. Add something to get started.
      </p>
      <div className="flex gap-3">
        <Link
          href="/feed"
          className="flex items-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-2xl transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
        >
          <Sparkles size={14} /> Browse Feed
        </Link>
        <Link
          href="/explore"
          className="flex items-center gap-2 px-6 py-3 bg-surface-3 text-secondary text-sm font-bold rounded-2xl hover:bg-surface-2 transition-colors border border-border"
        >
          Explore
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VENDOR GROUP
// Items from a single vendor with a collapsible delivery selector.
// ─────────────────────────────────────────────────────────────

function VendorGroup({
  vendorId,
  vendorName,
  items,
  deliveryMethod,
  deliveryFee,
  onDeliveryChange,
  onUpdateQty,
  onRemove,
  onToggleWishlist,
  isWishlisted,
  disabled,
}) {
  const [showDelivery, setShowDelivery] = useState(false)

  return (
    <div className="space-y-2">

      {/* Vendor header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-black"
            style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
          >
            {vendorName?.[0]?.toUpperCase() ?? 'V'}
          </div>
          <Link
            href={`/store/${vendorId}`}
            className="text-xs font-bold text-secondary hover:text-brand transition-colors"
          >
            {vendorName}
          </Link>
          <span className="text-[10px] text-muted">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Delivery toggle */}
        <button
          onClick={() => setShowDelivery(p => !p)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-xl hover:bg-brand/20 transition-colors"
        >
          <Truck size={10} />
          {deliveryMethod
            ? deliveryMethod.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : 'Choose delivery'
          }
          {showDelivery ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>

      {/* Delivery selector (expandable) */}
      {showDelivery && (
        <div className="bg-surface-2 rounded-2xl p-4 border border-border">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
            Delivery for {vendorName}
          </p>
          <DeliverySelector
            value={deliveryMethod}
            onChange={(id, addr) => {
              onDeliveryChange(vendorId, id, addr)
              setShowDelivery(false)
            }}
            vendorName={vendorName}
          />
        </div>
      )}

      {/* Selected delivery indicator (when collapsed) */}
      {!showDelivery && deliveryMethod && (
        <div className="flex items-center gap-1.5 px-0.5">
          <CheckCircle2 size={10} className="text-brand" />
          <span className="text-[10px] text-secondary">
            {deliveryFee > 0 ? `Delivery: ${fmt(deliveryFee)}` : 'Free delivery'}
          </span>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onUpdateQty={onUpdateQty}
            onRemove={onRemove}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={isWishlisted(item.product_id || item.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MULTI-VENDOR NOTICE
// ─────────────────────────────────────────────────────────────

function MultiVendorNotice({ count }) {
  return (
    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
      <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-amber-500">
          Items from {count} vendors
        </p>
        <p className="text-[10px] text-amber-500/80 mt-0.5 leading-relaxed">
          Each vendor's items are processed separately. You'll coordinate payment directly with each vendor via WhatsApp.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CART PAGE
// ─────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter()

  const {
    items, count, subtotal,
    remove, updateQty, clear, add,
    isAuthenticated, syncing,
  } = useCart()

  const { toggle, isWishlisted } = useWishlistStore()
  const wishlist = useWishlistStore?.getState?.()
  const currency = useLocaleStore(s => s.currency)

  // Coupon state
  const [coupon, setCoupon] = useState(null)  // { code, discount }

  // Per-vendor delivery selections: { [vendorId]: { method, address, fee } }
  const [deliveries, setDeliveries] = useState({})

  // Group items by vendor
  const grouped = items.reduce((acc, item) => {
    const key = item.vendor_id ?? '__unknown__'
    if (!acc[key]) acc[key] = {
      vendorId:   item.vendor_id,
      vendorName: item.vendor_name,
      items:      [],
    }
    acc[key].items.push(item)
    return acc
  }, {})

  const vendorGroups   = Object.values(grouped)
  const isMultiVendor  = vendorGroups.length > 1

  // For CartSummary: use first vendor's delivery if single-vendor,
  // sum all delivery fees if multi-vendor
  const primaryGroup    = vendorGroups[0]
  const primaryVendorId = primaryGroup?.vendorId   ?? ''
  const primaryVendorName = primaryGroup?.vendorName ?? 'Vendor'

  const primaryDelivery  = deliveries[primaryVendorId] ?? {}
  const totalDeliveryFee = Object.values(deliveries).reduce((s, d) => s + (d.fee ?? 0), 0)

  // Delivery change handler
  const handleDeliveryChange = useCallback((vendorId, method, address) => {
    setDeliveries(prev => ({
      ...prev,
      [vendorId]: {
        method,
        address: address ?? prev[vendorId]?.address ?? {},
        fee: DELIVERY_FEES[method] ?? 0,
      },
    }))
  }, [])

  // Coupon handler
  const handleApplyCoupon = useCallback(async (code) => {
    if (!code) { setCoupon(null); return }
    const res = await fetch('/api/coupons/validate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Invalid coupon')
    const { discount } = await res.json()
    setCoupon({ code, discount })
  }, [subtotal])

  // Toggle wishlist (just like, don't remove)
  const handleToggleWishlist = useCallback((item) => {
    toggle(item)
  }, [toggle])

  // Add related product to cart
  const handleAddRelated = useCallback((product) => {
    add({
      product_id:    product.id,
      vendor_id:     product.vendor?.id ?? '',
      vendor_name:   product.vendor?.store_name ?? '',
      name:          product.name,
      image_url:     product.images?.[0] ?? null,
      price:         product.price,
      currency:      product.currency ?? 'GHS',
      variant_label: '',
      qty:           1,
      max_qty:       product.stock ?? 99,
    })
  }, [add])

  // Payment success — go to order page
  const handlePaymentSuccess = useCallback((orderId) => {
    router.push(`/orders/${orderId}?payment=success`)
  }, [router])

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3 mb-7">
        <Link
          href="/explore"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={13} /> Continue shopping
        </Link>
        <div className="h-4 w-px bg-border-theme-base" />
        <h1 className="text-xl font-black text-primary tracking-tight">
          Cart
          {count > 0 && (
            <span className="ml-2 text-sm font-bold text-muted">({count})</span>
          )}
        </h1>
        {syncing && (
          <span className="ml-auto text-[10px] text-muted font-medium animate-pulse">
            Syncing…
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── Left: items + delivery ── */}
          <div className="space-y-6">

            {/* Multi-vendor notice */}
            {isMultiVendor && <MultiVendorNotice count={vendorGroups.length} />}

            {/* Vendor groups */}
            {vendorGroups.map(group => (
              <VendorGroup
                key={group.vendorId}
                vendorId={group.vendorId}
                vendorName={group.vendorName}
                items={group.items}
                deliveryMethod={deliveries[group.vendorId]?.method}
                deliveryFee={deliveries[group.vendorId]?.fee ?? 0}
                onDeliveryChange={handleDeliveryChange}
                onUpdateQty={updateQty}
                onRemove={remove}
                onToggleWishlist={handleToggleWishlist}
                isWishlisted={isWishlisted}
                disabled={false}
              />
            ))}

            {/* Clear cart */}
            <div className="flex justify-end">
              <button
                onClick={clear}
                className="text-[11px] text-muted hover:text-red-500 font-semibold transition-colors"
              >
                Clear cart
              </button>
            </div>

            {/* NovaPay security note */}
            <div className="flex items-start gap-3 bg-surface-2 border border-border rounded-2xl p-4">
              <ShieldCheck size={15} className="text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-primary flex items-center gap-2">
                  NovaPay &amp; Escrow
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-400 border border-neutral-200 uppercase tracking-wide">
                    Coming Soon
                  </span>
                </p>
                <p className="text-[10px] text-muted mt-0.5 leading-relaxed">
                  In-app payments (MoMo, Cards, Apple Pay) are coming soon. For now, all payments are handled
                  directly between you and the vendor.
                </p>
              </div>
            </div>

            {/* Related products */}
            <CartRelatedProducts
              cartItems={items}
              onAddToCart={handleAddRelated}
            />
          </div>

          {/* ── Right: summary ── */}
          <div>
            <CartSummary
              items={items}
              currency={currency}
              deliveryFee={isMultiVendor ? totalDeliveryFee : (deliveries[primaryVendorId]?.fee ?? 0)}
              coupon={coupon}
              onApplyCoupon={handleApplyCoupon}
              isAuthenticated={isAuthenticated}
              vendorId={primaryVendorId}
              vendorName={primaryVendorName}
              deliveryMethod={primaryDelivery.method}
              deliveryAddress={primaryDelivery.address ?? {}}
              onSuccess={handlePaymentSuccess}
            />
          </div>

        </div>
      )}
    </div>
  )
}