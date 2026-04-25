// FILE: src/components/product/ProductDetail.jsx
'use client'

import { useState } from 'react'
import Image               from 'next/image'
import Link                from 'next/link'
import {
  ShoppingCart, Heart, Share2, BadgeCheck,
  Star, ChevronLeft, ChevronRight, Truck,
  ShieldCheck, RotateCcw, Plus, Minus,
  Loader2, Check,
} from 'lucide-react'
import { useCart }          from '@/hooks/useCart'
import { useWishlistQuickAdd } from '@/hooks/useWishlist'
import { useAuthStore }      from '@/store/authStore'
import { useUiStore }        from '@/store/uiStore'
import { useRouter }         from 'next/navigation'
import { cn }               from '@/utils/cn'
import toast                from 'react-hot-toast'
import { copyToClipboard }  from '@/utils/clipboard'

// Inline wishlist dropdown for the product detail page
function WishlistDropdownInline({ product, onClose }) {
  const { lists, loading, saving, success, addToList, isAuthenticated } = useWishlistQuickAdd(product)
  const openAuthModal = useUiStore(s => s.openAuthModal)

  if (!isAuthenticated) {
    return (
      <div className="absolute right-0 top-full mt-2 z-50 bg-surface-2 rounded-2xl shadow-2xl border border-border p-4 w-64">
        <p className="text-sm text-secondary mb-3 text-center">Sign in to save this product to your wishlist collection</p>
        <button 
          onClick={() => openAuthModal('Sign in to save this product to your wishlist collection')}
          className="btn btn-primary btn-sm w-full text-center text-white"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 z-50 bg-surface-2 rounded-2xl shadow-2xl border border-border w-64 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-primary">Save to Wishlist</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-brand" /></div>
        ) : lists.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-muted mb-3">No wishlists yet</p>
            <Link href="/wishlist?new=1" onClick={onClose} className="btn btn-primary btn-sm w-full text-center">Create Wishlist</Link>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto py-1">
            {lists.map(list => (
              <button key={list.id} onClick={() => addToList(list.id)} disabled={!!saving}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand/10 transition-colors text-left">
                <span className="text-base">{list.emoji ?? '✨'}</span>
                <span className="flex-1 text-sm font-medium text-primary truncate">{list.name}</span>
                {saving === list.id && <Loader2 size={13} className="animate-spin text-brand" />}
                {success === list.id && <Check size={13} className="text-brand" />}
              </button>
            ))}
          </div>
        )}
        <div className="px-4 py-2.5 border-t border-border">
          <Link href="/wishlist?new=1" onClick={onClose} className="text-xs font-semibold text-brand hover:text-brand-600">+ New wishlist</Link>
        </div>
      </div>
    </>
  )
}

export default function ProductDetail({ product }) {
  const [imgIndex,     setImgIndex]     = useState(0)
  const [qty,          setQty]          = useState(1)
  const [showWishlist, setShowWishlist] = useState(false)
  const { add, hasItem } = useCart()
  const { user }         = useAuthStore()
  const openAuthModal    = useUiStore(s => s.openAuthModal)
  const { alreadyAdded } = useWishlistQuickAdd(product)
  const router           = useRouter()

  const vendorName    = product?.vendor?.store_name ?? 'the vendor'
  // Use vendor's own WhatsApp (business_phone), fall back to platform support
  const rawPhone      = product?.vendor?.business_phone ?? product?.vendor?.phone ?? ''
  const vendorPhone   = rawPhone.replace(/[^0-9]/g, '')  // strip spaces/+/dashes
  const whatsappNum   = vendorPhone || (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000')
  const whatsappMsg   = encodeURIComponent(`Hi ${vendorName}! I found your product "${product?.name}" on Novara QuickBuy and I'm interested. Can you tell me more?`)
  const WHATSAPP_URL  = `https://wa.me/${whatsappNum}?text=${whatsappMsg}`

  const images     = product.images || []
  const price      = product.discount_price || product.price
  const hasDisc    = product.discount_price && product.discount_price < product.price
  const wishlisted = alreadyAdded
  const inCart     = hasItem(product.id)
  const outOfStock = product.stock_quantity === 0

  const avgRating = product.reviews?.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : 0

  const fmt = (v) => new Intl.NumberFormat('en-GH', {
    style: 'currency', currency: 'GHS', minimumFractionDigits: 0
  }).format(v)

  const handleAddToCart = () => {
    if (!user) { openAuthModal('Sign in to add this product to your cart and checkout'); return }
    // Pass qty directly — do NOT loop
    add({ ...product, qty })
    toast.success(`Added ${qty > 1 ? `${qty}x ` : ''}${product.name} to cart`)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: location.href })
    } else {
      const success = await copyToClipboard(location.href)
      if (success) toast.success('Link copied!')
    }
  }

  const handleChatVendor = () => {
    window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page py-6 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* Image gallery */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-50 group">
            {images[imgIndex] ? (
              <Image
                src={images[imgIndex]}
                alt={product.name}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🛍️</div>
            )}

            {/* Prev / Next */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIndex(i => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {hasDisc && (
              <div className="absolute top-3 left-3 bg-danger text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={cn(
                    'shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150',
                    i === imgIndex ? 'border-brand shadow-brand' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <Image src={src} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Link href="/explore" className="hover:text-brand">Explore</Link>
            <span>/</span>
            <span>{product.category}</span>
          </div>

          {/* Title + actions */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-primary leading-tight">{product.name}</h1>
              <div className="flex items-center gap-2 shrink-0">
                {/* Wishlist — dropdown handles auth internally */}
                <div className="relative">
                  <button
                    onClick={() => setShowWishlist(p => !p)}
                    className={cn('btn-icon', wishlisted ? 'text-red-500' : 'text-muted hover:text-red-400')}
                  >
                    <Heart size={20} fill={wishlisted ? '#EF4444' : 'none'} />
                  </button>
                  {showWishlist && (
                    <WishlistDropdownInline product={product} onClose={() => setShowWishlist(false)} />
                  )}
                </div>
                <button onClick={handleShare} className="btn-icon">
                  <Share2 size={20} className="text-muted" />
                </button>
              </div>
            </div>

            {/* Rating */}
            {product.reviews?.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      size={14}
                      fill={s <= Math.round(avgRating) ? '#F59E0B' : 'none'}
                      className={s <= Math.round(avgRating) ? 'text-gold' : 'text-neutral-300'}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-neutral-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-neutral-400">({product.reviews.length} reviews)</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand">{fmt(price)}</span>
            {hasDisc && (
              <span className="text-lg text-neutral-400 line-through">{fmt(product.price)}</span>
            )}
          </div>

          {/* Stock */}
          <div>
            {outOfStock ? (
              <span className="stock-out text-sm px-3 py-1">Out of Stock</span>
            ) : product.stock_quantity <= 5 ? (
              <span className="stock-low text-sm px-3 py-1">Only {product.stock_quantity} left!</span>
            ) : (
              <span className="stock-in text-sm px-3 py-1">In Stock</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-neutral-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Qty + Cart */}
          <div className="flex gap-3 items-center">
            {/* Quantity picker */}
            <div className="flex items-center gap-2 bg-surface-3 rounded-xl px-1 border border-border">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-10 flex items-center justify-center text-secondary hover:text-brand font-bold text-lg transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-semibold text-primary">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(product.stock_quantity || 99, q + 1))}
                className="w-9 h-10 flex items-center justify-center text-secondary hover:text-brand font-bold text-lg transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock || inCart}
              className={cn(
                'btn btn-primary btn-lg flex-1',
                (outOfStock || inCart) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ShoppingCart size={18} />
              {inCart ? 'Already in Cart' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: <Truck size={16} />,       label: 'Fast Delivery'   },
              { icon: <ShieldCheck size={16} />, label: 'Escrow Payment'  },
              { icon: <RotateCcw size={16} />,   label: 'Easy Returns'    },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-brand-50 rounded-xl">
                <div className="text-brand">{icon}</div>
                <span className="text-xs font-medium text-brand-800 text-center">{label}</span>
              </div>
            ))}
          </div>

          {/* Vendor card + chat */}
          <div className="rounded-2xl border border-border bg-surface-3 overflow-hidden">
            <Link
              href={`/store/${product.vendor_id}`}
              className="flex items-center gap-3 p-4 hover:bg-brand/5 transition-all duration-200"
            >
              <div className="avatar avatar-md shrink-0">
                {product.vendor?.store_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-primary truncate">
                    {product.vendor?.store_name}
                  </span>
                  {product.vendor?.verified && <BadgeCheck size={14} className="text-brand shrink-0" />}
                </div>
                <p className="text-xs text-muted">
                  {product.vendor?.follower_count?.toLocaleString()} followers ·{' '}
                  {product.vendor?.trust_score?.toFixed(1)} ★
                </p>
                {(product.vendor?.business_city || product.vendor?.business_country) && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-1.5 py-0.5 rounded">
                      {[product.vendor.business_city, product.vendor.business_country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
              <ChevronRight size={16} className="text-muted shrink-0" />
            </Link>
            <div className="px-4 pb-4">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                id="product-detail-whatsapp-btn"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#128C7E' }}
              >
                <svg viewBox="0 0 32 32" width="14" height="14" fill="#128C7E">
                  <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z"/>
                </svg>
                Chat with Vendor on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}