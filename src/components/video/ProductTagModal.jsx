// FILE: src/components/video/ProductTagModal.jsx
'use client'

import { useUiStore }   from '@/store/uiStore'
import { useCart }      from '@/hooks/useCart'
import { useWishlistStore } from '@/store/wishlistStore'
import Image            from 'next/image'
import Link             from 'next/link'
import { X, ShoppingCart, Heart, ArrowRight, BadgeCheck } from 'lucide-react'
import { cn }           from '@/utils/cn'
import toast            from 'react-hot-toast'

export default function ProductTagModal() {
  const { productModalOpen, selectedProduct, closeProductModal } = useUiStore()
  const { add, hasItem } = useCart()
  const { toggle, isWishlisted } = useWishlistStore()

  if (!productModalOpen || !selectedProduct) return null

  const p         = selectedProduct
  const price     = p.discount_price || p.price
  const hasDisc   = p.discount_price && p.discount_price < p.price
  const wishlisted = isWishlisted(p.id)
  const inCart     = hasItem(p.id)
  const outOfStock = p.stock_quantity === 0

  const fmt = (v) => new Intl.NumberFormat('en-GH', {
    style: 'currency', currency: 'GHS', minimumFractionDigits: 0
  }).format(v)

  const handleAddToCart = () => {
    if (outOfStock) return
    add(p)
    toast.success(`${p.name} added to cart`)
    closeProductModal()
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) closeProductModal() }}
    >
      <div className="
        bg-surface-2 rounded-t-3xl sm:rounded-2xl
        w-full max-w-md
        animate-slide-up sm:animate-scale-in
        overflow-hidden border-t sm:border border-border shadow-2xl
      ">
        {/* Product image */}
        <div className="relative aspect-[4/3] bg-brand-50">
          {p.images?.[0] ? (
            <Image
              src={p.images[0]}
              alt={p.name}
              fill
              className="object-cover"
              sizes="448px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🛍️</div>
          )}

          {/* Close */}
          <button
            onClick={closeProductModal}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all border border-white/5"
          >
            <X size={18} />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => toggle(p)}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all"
          >
            <Heart
              size={18}
              fill={wishlisted ? '#EF4444' : 'none'}
              className={wishlisted ? 'text-red-500' : 'text-neutral-500'}
            />
          </button>

          {/* Discount badge */}
          {hasDisc && (
            <div className="absolute bottom-3 left-3 bg-danger text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {Math.round((1 - p.discount_price / p.price) * 100)}% OFF
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-primary text-xl leading-tight">{p.name}</h3>
              {p.vendor && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">{p.vendor.store_name}</span>
                  {p.vendor.verified && <BadgeCheck size={12} className="text-brand" />}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-brand tabular-nums">{fmt(price)}</p>
              {hasDisc && (
                <p className="text-sm text-muted line-through opacity-60 tabular-nums">{fmt(p.price)}</p>
              )}
            </div>
          </div>

          {/* Stock status */}
          <div className="mb-4">
            {outOfStock ? (
              <span className="stock-out">Out of Stock</span>
            ) : p.stock_quantity <= 5 ? (
              <span className="stock-low">Only {p.stock_quantity} left</span>
            ) : (
              <span className="stock-in">In Stock</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || inCart}
              className={cn(
                'btn btn-primary btn-lg flex-1',
                (outOfStock || inCart) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ShoppingCart size={18} />
              {inCart ? 'In Cart' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <Link
              href={`/product/${p.id}`}
              onClick={closeProductModal}
              className="btn btn-secondary btn-lg px-4"
            >
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}