'use client'
// FILE: src/components/explore/ProductModal.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link  from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X, ChevronLeft, ChevronRight,
  Heart, ShoppingCart, Star,
  BadgeCheck, MessageCircle,
  Share2, Truck, ShieldCheck,
  RotateCcw, Plus, Minus, Play,
  ZoomIn, Send, Check, Loader2,
  BookmarkPlus, List,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCart }              from '@/hooks/useCart'
import { useWishlistStore }      from '@/store/wishlistStore'
import { useWishlistQuickAdd }   from '@/hooks/useWishlist'
import { useAuthStore }          from '@/store/authStore'
import { createClient }          from '@/lib/supabase/client'
import { cn }                    from '@/utils/cn'
import toast                     from 'react-hot-toast'
import { useUiStore }            from '@/store/uiStore'
import { copyToClipboard }       from '@/utils/clipboard'
import VendorBadge               from '@/components/product/VendorBadge'

const fmtGHS = (v) => formatCurrency(v, 'GHS')
const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)    return `${s}s`
  if (s < 3600)  return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

// ─────────────────────────────────────────────────────────────
// WISHLIST DROPDOWN
// ─────────────────────────────────────────────────────────────

function WishlistDropdown({ product, onClose }) {
  const {
    open, setOpen,
    lists, loading,
    saving, success,
    addToList,
    alreadyAdded,
    isAuthenticated,
  } = useWishlistQuickAdd(product)

  // Open on mount
  useEffect(() => { setOpen(true) }, [])

  const openAuthModal = useUiStore(s => s.openAuthModal)

  if (!isAuthenticated) {
    return (
      <div className="absolute right-0 top-full mt-2 z-50 bg-surface-2 rounded-2xl shadow-2xl border border-border p-4 w-64">
        <p className="text-sm text-secondary mb-3 text-center">Sign in to save to wishlist</p>
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
          <p className="text-xs text-muted mt-0.5 truncate">{product?.name}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={18} className="animate-spin text-brand" />
          </div>
        ) : lists.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-muted mb-3">No wishlists yet</p>
            <Link
              href="/wishlist"
              onClick={onClose}
              className="btn btn-primary btn-sm w-full text-center"
            >
              Create a Wishlist
            </Link>
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto py-1">
            {lists.map(list => {
              const isSaving = saving === list.id
              const isDone   = success === list.id
              return (
                <button
                  key={list.id}
                  onClick={() => addToList(list.id)}
                  disabled={!!saving || isDone}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand/10 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-surface-3 flex items-center justify-center text-base shrink-0">
                    {list.emoji ?? '✨'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{list.name}</p>
                    <p className="text-[10px] text-muted">{list.item_count ?? 0} items</p>
                  </div>
                  {isSaving && <Loader2 size={14} className="animate-spin text-brand shrink-0" />}
                  {isDone    && <Check  size={14} className="text-brand shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-border">
          <Link
            href="/wishlist?new=1"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-semibold text-brand hover:text-brand-600 transition-colors"
          >
            <Plus size={13} /> Create new wishlist
          </Link>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────

export default function ProductModal({ product: initialProduct, onClose }) {
  const [product,     setProduct]     = useState(initialProduct)
  const [imgIndex,    setImgIndex]    = useState(0)
  const [showVideo,   setShowVideo]   = useState(false)
  const [qty,         setQty]         = useState(1)
  const [reviews,     setReviews]     = useState([])
  const [similar,     setSimilar]     = useState([])
  const [comment,     setComment]     = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [activeTab,   setActiveTab]   = useState('details')
  const [showWishlist,setShowWishlist]= useState(false)
  const scrollRef = useRef(null)
  const videoRef  = useRef(null)
  const supabase  = createClient()

  const { add, hasItem }   = useCart()
  const wishStore          = useWishlistStore()
  const { user }           = useAuthStore()
  const openAuthModal      = useUiStore(s => s.openAuthModal)
  const router             = useRouter()

  const vendorName    = product?.vendor?.store_name ?? 'the vendor'
  // Use vendor's own WhatsApp (business_phone), fall back to platform support
  const rawPhone      = product?.vendor?.business_phone ?? ''
  const vendorPhone   = rawPhone.replace(/[^0-9]/g, '')  // strip spaces/+/dashes
  const whatsappNum   = vendorPhone || (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000')
  const whatsappMsg   = encodeURIComponent(`Hi ${vendorName}! I found your product "${product?.name}" on Novara QuickBuy and I'm interested. Can you tell me more?`)
  const WHATSAPP_URL  = `https://wa.me/${whatsappNum}?text=${whatsappMsg}`

  // ── FIXED: use isAdded from the store, not isWishlisted ──
  const wishlisted = wishStore.isAdded(product?.id)
  const inCart     = hasItem(product?.id)
  const outOfStock = product?.stock_quantity === 0
  const avgRating  = product?.avg_rating ?? 0
  const images     = product?.images ?? []
  const price      = product?.discount_price || product?.price
  const hasDisc    = product?.discount_price && product?.discount_price < product?.price

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Fetch full product + reviews + similar
  useEffect(() => {
    if (!product?.id) return
    const load = async () => {
      const { data: full } = await supabase
        .from('products')
        .select(`*, vendor:vendors(id, store_name, logo_url, verified, verification_status, trust_score, follower_count, store_category, bio, created_at, business_phone)`)
        .eq('id', product.id)
        .single()
      if (full) setProduct(full)

      const { data: rev } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setReviews(rev ?? [])

      const { data: sim } = await supabase
        .from('products')
        .select('id, name, price, discount_price, images, avg_rating, vendor:vendors(store_name, verified, verification_status)')
        .eq('is_active', true)
        .eq('category', product.category ?? '')
        .neq('id', product.id)
        .limit(6)
      setSimilar(sim ?? [])
    }
    load()
  }, [product?.id])

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleAddToCart = () => {
    if (!user) { openAuthModal('Sign in to add items to your cart and checkout'); return }
    // Pass qty directly — do NOT loop; looping adds N separate cart entries
    add({ ...product, qty })
    toast.success(`Added ${qty > 1 ? `${qty}x ` : ''}${product.name} to cart!`)
  }

  const handleShare = async () => {
    const url = `${location.origin}/product/${product.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url })
        return
      } catch (err) {
        console.warn('Native share failed', err)
      }
    }

    // Fallback to clipboard
    const success = await copyToClipboard(url)
    if (success) {
      toast.success('Link copied to clipboard!')
    } else {
      toast.error('Failed to copy link')
    }
  }

  // Open WhatsApp to chat with the vendor
  const handleChatVendor = () => {
    window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer')
  }

  // Reviews require a verified order (reviewer_id, vendor_id, order_id are NOT NULL).
  // The review form is intentionally disabled here — customers review from their Orders page.
  const handleComment = async (e) => {
    e.preventDefault()
    toast('Reviews can be left from your Orders page after delivery.', { icon: '📦' })
  }

  const hasVideo   = !!(product?.video_url)
  const mediaCount = images.length + (hasVideo ? 1 : 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={scrollRef}
        className="bg-surface-2 w-full sm:max-w-4xl sm:rounded-3xl rounded-t-3xl overflow-y-auto animate-slide-up sm:animate-scale-in"
        style={{ maxHeight: '95dvh' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur-md flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <VendorBadge vendor={product?.vendor} />

            <span className="text-sm text-muted">{product?.category}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} className="btn-icon text-muted hover:text-primary">
              <Share2 size={18} />
            </button>

            {/* Wishlist button — dropdown renders once in body, not here */}
            <button
              onClick={() => setShowWishlist(p => !p)}
              className={cn(
                'btn-icon transition-colors',
                wishlisted ? 'text-red-500' : 'text-muted hover:text-red-400',
              )}
              title="Save to wishlist"
            >
              <Heart
                size={18}
                fill={wishlisted ? '#EF4444' : 'none'}
                className={wishlisted ? 'text-red-500' : ''}
              />
            </button>

            <button onClick={onClose} className="btn-icon text-muted hover:text-primary ml-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

          {/* LEFT — Images + Video */}
          <div className="p-4 sm:p-5">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-3 mb-3">
              {showVideo && product?.video_url ? (
                <video ref={videoRef} src={product.video_url} controls autoPlay className="w-full h-full object-cover" />
              ) : images[imgIndex] ? (
                <Image src={images[imgIndex]} alt={product?.name} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">🛍️</div>
              )}
              {hasDisc && !showVideo && (
                <div className="absolute top-3 left-3 bg-danger text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  -{Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                </div>
              )}
              {images.length > 1 && !showVideo && (
                <>
                  <button onClick={() => setImgIndex(i => Math.max(0, i - 1))} disabled={imgIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-2/90 flex items-center justify-center shadow hover:bg-surface-2 disabled:opacity-30 transition-all text-primary">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))} disabled={imgIndex === images.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-2/90 flex items-center justify-center shadow hover:bg-surface-2 disabled:opacity-30 transition-all text-primary">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {mediaCount > 1 && (
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {images.map((src, i) => (
                  <button key={i} onClick={() => { setImgIndex(i); setShowVideo(false) }}
                    className={cn('shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-150',
                      !showVideo && i === imgIndex ? 'border-brand shadow-brand' : 'border-transparent opacity-60 hover:opacity-100')}>
                    <Image src={src} alt="" width={56} height={56} className="object-cover w-full h-full" />
                  </button>
                ))}
                {hasVideo && (
                  <button onClick={() => setShowVideo(true)}
                    className={cn('shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 bg-primary flex items-center justify-center transition-all duration-150',
                      showVideo ? 'border-brand shadow-brand' : 'border-transparent opacity-60 hover:opacity-100')}>
                    <Play size={20} className="text-white ml-0.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Info */}
          <div className="p-4 sm:p-5 flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-primary leading-tight mb-2">{product?.name}</h1>

            {avgRating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(avgRating) ? '#F59E0B' : 'none'}
                      className={i < Math.round(avgRating) ? 'text-gold' : 'text-muted/30'} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-secondary">{Number(avgRating).toFixed(1)}</span>
                <span className="text-sm text-muted">({product?.review_count ?? reviews.length} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-3xl font-black text-brand">{fmtGHS(price)}</span>
              {hasDisc && (
                <>
                  <span className="text-lg text-muted line-through">{fmtGHS(product.price)}</span>
                  <span className="badge badge-error text-xs">Save {fmtGHS(product.price - product.discount_price)}</span>
                </>
              )}
            </div>

            <div className="mb-4">
              {outOfStock ? (
                <span className="stock-out text-xs px-3 py-1">Out of Stock</span>
              ) : product?.stock_quantity <= 5 ? (
                <span className="stock-low text-xs px-3 py-1">Only {product.stock_quantity} left!</span>
              ) : (
                <span className="stock-in text-xs px-3 py-1">In Stock</span>
              )}
            </div>

            {product?.description && (
              <p className="text-sm text-secondary leading-relaxed mb-4 line-clamp-3">{product.description}</p>
            )}

            {/* Qty + Cart */}
            <div className="flex gap-3 items-center mb-3">
              <div className="flex items-center gap-2 bg-surface-3 rounded-xl px-1 border border-border">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-10 flex items-center justify-center text-secondary hover:text-brand font-bold transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-semibold text-primary">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product?.stock_quantity ?? 99, q + 1))}
                  className="w-9 h-10 flex items-center justify-center text-secondary hover:text-brand font-bold transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={outOfStock || inCart}
                className={cn('btn btn-primary btn-lg flex-1', (outOfStock || inCart) && 'opacity-50 cursor-not-allowed')}
              >
                <ShoppingCart size={18} />
                {inCart ? 'In Cart' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            {/* Add to Wishlist button */}
            <div className="relative mb-4">
              <button
                onClick={() => setShowWishlist(p => !p)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 text-sm font-semibold transition-all',
                  wishlisted
                    ? 'border-red-500/20 bg-red-500/10 text-red-500'
                    : 'border-border bg-surface-2 text-secondary hover:border-brand hover:text-brand hover:bg-brand/10',
                )}
              >
                <Heart size={16} fill={wishlisted ? '#EF4444' : 'none'} className={wishlisted ? 'text-red-500' : ''} />
                {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
                <BookmarkPlus size={15} className={wishlisted ? 'text-red-400' : 'text-muted'} />
              </button>
              {showWishlist && (
                <WishlistDropdown
                  product={product}
                  onClose={() => setShowWishlist(false)}
                />
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: <Truck size={14} />,       label: 'Fast Delivery' },
                { icon: <ShieldCheck size={14} />, label: 'Escrow Safe'   },
                { icon: <RotateCcw size={14} />,   label: 'Easy Returns'  },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-2.5 bg-brand/10 rounded-xl">
                  <div className="text-brand">{icon}</div>
                  <span className="text-[10px] font-medium text-brand text-center">{label}</span>
                </div>
              ))}
            </div>

            {/* Vendor card */}
            {product?.vendor && (
              <div className="rounded-2xl border border-border p-4 mb-4 hover:border-brand/40 hover:bg-brand/5 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-brand/10 flex items-center justify-center font-bold text-brand shrink-0 relative">
                    {product.vendor.logo_url
                      ? <Image src={product.vendor.logo_url} alt="" fill className="object-cover" />
                      : product.vendor.store_name?.charAt(0)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-primary truncate">{product.vendor.store_name}</span>
                      <VendorBadge vendor={product.vendor} size="xs" />
                    </div>
                    <p className="text-xs text-muted">
                      {product.vendor.follower_count > 0 && `${product.vendor.follower_count.toLocaleString()} followers`}
                      {product.vendor.trust_score > 0 && ` · ${Number(product.vendor.trust_score).toFixed(1)}★`}
                    </p>
                  </div>
                  <Link href={`/store/${product.vendor_id}`} onClick={onClose} className="btn btn-secondary btn-sm text-xs border-border text-secondary hover:bg-surface-3">
                    View Store
                  </Link>
                </div>
                <div className="mt-3">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="product-modal-whatsapp-btn"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#128C7E' }}
                  >
                    <svg viewBox="0 0 32 32" width="14" height="14" fill="#128C7E">
                      <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="px-5 border-t border-border">
          <div className="flex gap-0 border-b border-border">
            {['details', 'reviews', 'chat'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn('px-5 py-3.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px',
                  activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-primary')}>
                {tab === 'reviews' ? `Reviews (${reviews.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="px-5 py-5">

          {activeTab === 'details' && (
            <div className="space-y-4 animate-fade-up">
              {product?.description && (
                <div>
                  <h4 className="font-semibold text-primary mb-2">Description</h4>
                  <p className="text-sm text-secondary leading-relaxed">{product.description}</p>
                </div>
              )}
              {product?.specs && typeof product.specs === 'object' && (
                <div>
                  <h4 className="font-semibold text-primary mb-2">Specifications</h4>
                  <div className="space-y-2">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="flex justify-between py-1.5 border-b border-border last:border-0">
                        <span className="text-sm text-muted capitalize">{key}</span>
                        <span className="text-sm font-medium text-primary">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-4 bg-accent-50 rounded-2xl border border-accent-100">
                <ShieldCheck size={18} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-accent-800">Escrow Payment Protection</p>
                  <p className="text-xs text-accent-700 mt-0.5 leading-snug">Your payment is held securely until you confirm delivery.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4 animate-fade-up">
              {avgRating > 0 && (
                <div className="flex items-center gap-4 p-4 bg-brand/10 rounded-2xl">
                  <div className="text-center">
                    <p className="text-4xl font-black text-brand">{Number(avgRating).toFixed(1)}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} fill={i < Math.round(avgRating) ? '#F59E0B' : 'none'}
                          className={i < Math.round(avgRating) ? 'text-gold' : 'text-muted/30'} />
                      ))}
                    </div>
                    <p className="text-xs text-muted mt-1">{reviews.length} reviews</p>
                  </div>
                </div>
              )}
              {user && (
                <form onSubmit={handleComment} className="flex gap-2">
                  <div className="avatar avatar-sm shrink-0 bg-surface-3 border border-border text-primary">{user.user_metadata?.full_name?.charAt(0) ?? '?'}</div>
                  <div className="flex-1 flex items-center gap-2 border border-border rounded-xl px-3 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 transition-all bg-surface">
                    <input type="text" value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="Write a review..."
                      className="flex-1 bg-transparent text-sm outline-none text-primary placeholder:text-muted" />
                    <button type="submit" disabled={!comment.trim() || submitting} className="btn btn-primary btn-sm px-3 disabled:opacity-40 text-white">
                      <Send size={13} />
                    </button>
                  </div>
                </form>
              )}
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star size={40} className="text-neutral-200 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">No reviews yet. Be the first!</p>
                </div>
              ) : reviews.map(review => (
                <div key={review.id} className="flex gap-3">
                  <div className="avatar avatar-sm shrink-0">
                    {review.buyer?.avatar_url
                      ? <img src={review.buyer.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      : review.buyer?.full_name?.charAt(0) ?? '?'
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-primary">{review.buyer?.full_name ?? 'Buyer'}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} fill={i < review.rating ? '#F59E0B' : 'none'}
                            className={i < review.rating ? 'text-gold' : 'text-muted/30'} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted">{timeAgo(review.created_at)}</span>
                    </div>
                    <p className="text-sm text-secondary leading-snug">{review.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="animate-fade-up text-center py-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
              >
                <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
                  <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z"/>
                </svg>
              </div>
              <h4 className="font-semibold text-primary mb-2">Chat with {product?.vendor?.store_name}</h4>
              <p className="text-sm text-muted mb-5 max-w-xs mx-auto leading-relaxed">
                Ask about product details, availability, custom orders, or shipping options — via WhatsApp.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                id="product-modal-tab-whatsapp-btn"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
              >
                Open WhatsApp Chat
              </a>
            </div>
          )}
        </div>

        {/* SIMILAR PRODUCTS */}
        {similar.length > 0 && (
          <div className="border-t border-border px-5 py-5">
            <h4 className="font-bold text-primary mb-4">Similar Products</h4>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {similar.map(p => {
                const simPrice = p.discount_price || p.price
                return (
                  <button key={p.id}
                    onClick={() => { setImgIndex(0); setShowVideo(false); setActiveTab('details'); setReviews([]); setSimilar([]); setProduct(p); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="shrink-0 w-36 rounded-2xl overflow-hidden border border-border hover:border-brand/40 hover:shadow-md transition-all text-left bg-surface shadow-sm">
                    <div className="relative aspect-square bg-surface-3">
                      {p.images?.[0]
                        ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="144px" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                      }
                      <div className="absolute top-1.5 left-1.5">
                        <VendorBadge vendor={p.vendor} size="xs" className="opacity-90 shadow-sm" />
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-primary line-clamp-2 leading-tight">{p.name}</p>
                      <p className="text-sm font-black text-brand mt-1">{fmtGHS(simPrice)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  )
}