'use client'
import Image  from 'next/image'
import { Heart, Star, ShoppingCart } from 'lucide-react'
import { useCart }          from '@/hooks/useCart'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore }     from '@/store/authStore'
import { useUiStore }       from '@/store/uiStore'
import VendorBadge          from '@/components/product/VendorBadge'
import { formatCurrency }   from '@/utils/formatCurrency'
import { cn }               from '@/utils/cn'
import toast                from 'react-hot-toast'

const fmtGHS = (v) => formatCurrency(v, 'GHS')
const fmtNum = (n) => {
  const num = Number(n ?? 0)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000)    return `${(num / 1000).toFixed(0)}k`
  return String(num)
}

export default function ProductCard({ product, onOpen, style }) {
  const { add, hasItem }         = useCart()
  const { toggle, isWishlisted } = useWishlistStore()
  const { user }                 = useAuthStore()
  const openAuthModal            = useUiStore(s => s.openAuthModal)

  const price      = product.discount_price || product.price
  const hasDisc    = product.discount_price && product.discount_price < product.price
  const wishlisted = isWishlisted(product.id)
  const inCart     = hasItem(product.id)
  const outOfStock = product.stock_quantity === 0

  const handleCart = (e) => {
    e.stopPropagation()
    if (!user) { openAuthModal('Sign in to add this product to your cart'); return }
    if (outOfStock) return
    add(product)
    toast.success(`${product.name} added!`)
  }

  const handleWishlist = (e) => {
    e.stopPropagation()
    if (!user) { openAuthModal('Sign in to save this product to your wishlist'); return }
    toggle(product)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Saved!')
  }

  return (
    <div
      className="card-hover cursor-pointer group animate-fade-up bg-surface-2 border-border"
      style={style}
      onClick={() => onOpen(product)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-surface-3 rounded-t-2xl" style={{ aspectRatio: '1/1' }}>
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-50 text-5xl">🛍️</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <VendorBadge vendor={product.vendor} size="xs" className="opacity-90 shadow-sm" />

          {hasDisc && (
            <span className="bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              -{Math.round((1 - product.discount_price / product.price) * 100)}%
            </span>
          )}
          {outOfStock && (
            <span className="bg-neutral-700/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
        >
          <Heart size={14} fill={wishlisted ? '#EF4444' : 'none'} className={wishlisted ? 'text-red-500' : 'text-neutral-500'} />
        </button>

        {/* Quick add */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <button
            onClick={handleCart}
            disabled={outOfStock || inCart}
            className={cn(
              'w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
              inCart       ? 'bg-brand text-white'
              : outOfStock ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
              :              'bg-brand-800 text-white hover:bg-brand'
            )}
          >
            <ShoppingCart size={12} />
            {inCart ? 'In Cart ✓' : outOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <p className="text-[10px] text-muted font-medium truncate">{product.vendor?.store_name}</p>
          {(product.vendor?.business_city || product.vendor?.business_country) && (
            <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-tight shrink-0">
              {[product.vendor.business_city, product.vendor.business_country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <p className="text-sm font-semibold text-primary leading-tight mt-0.5 line-clamp-2">{product.name}</p>

        {/* Stars */}
        {product.avg_rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} fill={i < Math.round(product.avg_rating) ? '#F59E0B' : 'none'}
                className={i < Math.round(product.avg_rating) ? 'text-gold' : 'text-muted/30'} />
            ))}
            <span className="text-[9px] text-muted ml-0.5">({product.review_count ?? 0})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="font-bold text-brand">{fmtGHS(price)}</span>
          {hasDisc && <span className="text-muted line-through text-xs">{fmtGHS(product.price)}</span>}
        </div>

        {product.total_sold > 0 && (
          <p className="text-[9px] text-muted mt-0.5">{fmtNum(product.total_sold)} sold</p>
        )}
      </div>
    </div>
  )
}
