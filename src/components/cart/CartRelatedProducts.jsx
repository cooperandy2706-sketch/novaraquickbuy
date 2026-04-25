'use client'
// FILE: src/components/cart/CartRelatedProducts.jsx
// Related products (same vendor) + recently viewed.
// Horizontal scroll rows below the cart items list.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils/cn'
import {
  Package, ShoppingBag, Star,
  ChevronRight, Clock, Plus, CheckCircle2,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import VendorBadge from '@/components/product/VendorBadge'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

// ─────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────

function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    await onAddToCart?.(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex-shrink-0 w-36 sm:w-40 bg-surface-2 rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-brand/30 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative w-full h-32 sm:h-36 overflow-hidden bg-surface-3">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={24} className="text-muted/30" />
          </div>
        )}

        {/* Add button */}
        <button
          onClick={handleAdd}
          className={cn(
            'absolute bottom-2 right-2 w-7 h-7 rounded-xl flex items-center justify-center',
            'shadow-sm border border-border/20 transition-all duration-150',
            added
              ? 'bg-brand border-brand text-white scale-90'
              : 'bg-surface-2/90 backdrop-blur-sm text-secondary hover:bg-brand hover:text-white hover:border-brand',
          )}
        >
          {added
            ? <CheckCircle2 size={13} />
            : <Plus size={13} />
          }
        </button>

        {/* Rating */}
        {product.avg_rating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-surface-2/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <Star size={8} className="text-amber-400 fill-amber-400" />
            <span className="text-[9px] font-bold text-primary">
              {product.avg_rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Verification Badge */}
        <div className="absolute top-2 right-2">
          <VendorBadge vendor={product.vendor} size="xs" className="opacity-90 shadow-sm shadow-black/10" />
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-[11px] font-semibold text-primary line-clamp-2 leading-snug">
          {product.name}
        </p>
        <p className="text-xs font-black text-primary mt-1.5 tabular-nums">
          {fmt(product.price, product.currency)}
        </p>
        {product.vendor_name && (
          <p className="text-[9px] text-muted mt-0.5 truncate">{product.vendor_name}</p>
        )}
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// HORIZONTAL SCROLL ROW
// ─────────────────────────────────────────────────────────────

function ScrollRow({ title, icon: Icon, products, onAddToCart, viewAllHref, loading }) {
  if (!loading && products.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-muted" />
          <h3 className="text-xs font-bold text-secondary">{title}</h3>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-brand hover:text-brand-700 transition-colors"
          >
            See all <ChevronRight size={12} />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex-shrink-0 w-36 sm:w-40 h-48 rounded-2xl bg-surface-3 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DATA HOOK
// ─────────────────────────────────────────────────────────────

function useRelatedProducts(cartItems) {
  const [related,        setRelated]        = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!cartItems.length) { setLoading(false); return }

    const supabase   = createClient()
    const vendorIds  = [...new Set(cartItems.map(i => i.vendor_id).filter(Boolean))]
    const productIds = cartItems.map(i => i.product_id)

    // Related: same vendor, not already in cart
    supabase
      .from('products')
      .select(`id, name, price, currency, images, avg_rating, vendor:vendors(id, store_name, verified, verification_status)`)
      .in('vendor_id', vendorIds)
      .not('id', 'in', `(${productIds.join(',')})`)
      .eq('is_active', true)
      .order('avg_rating', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (data) {
          setRelated(data.map(p => ({ ...p, vendor_name: p.vendor?.store_name ?? '' })))
        }
        setLoading(false)
      })

    // Recently viewed from localStorage
    try {
      const ids = JSON.parse(localStorage.getItem('novara_recently_viewed') ?? '[]').slice(0, 8)
      if (ids.length) {
        supabase
          .from('products')
          .select(`id, name, price, currency, images, avg_rating, vendor:vendors(store_name, verified, verification_status)`)
          .in('id', ids)
          .eq('is_active', true)
          .then(({ data }) => {
            if (data) setRecentlyViewed(data.map(p => ({ ...p, vendor_name: p.vendor?.store_name ?? '' })))
          })
      }
    } catch {}
  }, [cartItems.map(i => i.product_id).join(',')])

  return { related, recentlyViewed, loading }
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

/**
 * CartRelatedProducts
 *
 * Props:
 *   cartItems    array  — cart items (to find vendors/products)
 *   onAddToCart  fn     — (product) => void
 */
export default function CartRelatedProducts({ cartItems = [], onAddToCart }) {
  const { related, recentlyViewed, loading } = useRelatedProducts(cartItems)

  if (!loading && related.length === 0 && recentlyViewed.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="h-px bg-border" />

      <ScrollRow
        title="More from these vendors"
        icon={ShoppingBag}
        products={related}
        onAddToCart={onAddToCart}
        viewAllHref="/explore"
        loading={loading}
      />

      {recentlyViewed.length > 0 && (
        <ScrollRow
          title="Recently viewed"
          icon={Clock}
          products={recentlyViewed}
          onAddToCart={onAddToCart}
          loading={false}
        />
      )}
    </div>
  )
}