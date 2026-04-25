'use client'
// FILE: src/app/(store)/store/[handle]/StorePage.jsx

import { useState, useCallback } from 'react'
import Link                      from 'next/link'
import {
  BadgeCheck, MapPin, Globe,
  Instagram, Twitter, Facebook,
  Package, Video, Users, Heart,
  ShoppingBag, Play, Eye, Star,
  Search, SlidersHorizontal, ChevronDown,
  ArrowLeft, Share2, MessageSquare, X,
} from 'lucide-react'
import { getStoreProducts } from '@/lib/actions/store'
import { toggleFollow }     from '@/lib/actions/feed'
import { cn }               from '@/utils/cn'
import { useAuthStore }     from '@/store/authStore'
import { useUiStore }       from '@/store/uiStore'
import VendorBadge        from '@/components/product/VendorBadge'
import ProductModal       from '@/components/explore/ProductModal'
import ShareDrawer      from '@/components/ui/ShareDrawer'

function fmtNum(n) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function fmtDuration(s) {
  if (!s) return ''
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onOpen }) {
  const hasDiscount = product.compare_at_price > product.price
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0

  return (
    <div 
      onClick={() => onOpen(product)} 
      onKeyDown={(e) => e.key === 'Enter' && onOpen(product)}
      role="button"
      tabIndex={0}
      className="block h-full w-full text-left focus:outline-none focus:ring-2 focus:ring-brand/50 rounded-2xl"
    >
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden hover:shadow-md transition-all group cursor-pointer h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-neutral-100 shrink-0">
          {product.thumbnail_url ? (
            <img src={product.thumbnail_url} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <Package size={32} />
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-danger text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">
              -{discountPct}%
            </div>
          )}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); /* Add to bag logic here if needed */ }}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand hover:text-white text-brand transition-colors z-10"
          >
            <ShoppingBag size={14} />
          </button>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <p className="text-sm font-semibold text-brand-800 truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-bold text-brand-900 tabular-nums">
              ${product.price?.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through tabular-nums">
                ${product.compare_at_price?.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Video card ────────────────────────────────────────────────────────────────
function VideoCard({ video, onClick }) {
  return (
    <div onClick={onClick} className="relative aspect-[9/16] bg-neutral-900 rounded-2xl overflow-hidden group cursor-pointer">
      {video.thumbnail_url ? (
        <img src={video.thumbnail_url} alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <video
          src={`${video.video_url}#t=0.1`}
          className="w-full h-full object-cover opacity-60"
          preload="metadata"
          muted
          playsInline
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Play size={20} className="text-brand-800 ml-0.5" fill="currentColor" />
        </div>
      </div>
      {/* Bottom info */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5">
        <p className="text-white text-xs font-semibold truncate">{video.title}</p>
        <div className="flex items-center gap-2 mt-1 text-white/70 text-[10px]">
          <span className="flex items-center gap-0.5"><Eye size={10} /> {fmtNum(video.views)}</span>
          <span className="flex items-center gap-0.5"><Heart size={10} /> {fmtNum(video.likes)}</span>
          {video.duration_seconds > 0 && <span className="ml-auto font-mono">{fmtDuration(video.duration_seconds)}</span>}
        </div>
      </div>
      {video.video_tags?.[0]?.count > 0 && (
        <div className="absolute top-2 right-2 bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
          <ShoppingBag size={9} /> Shop
        </div>
      )}
    </div>
  )
}

export default function StorePage({
  vendor, initialProducts, totalProducts,
  videos, stats, initialFollowing,
}) {
  const [products,    setProducts]    = useState(initialProducts)
  const [total,       setTotal]       = useState(totalProducts)
  const [following,   setFollowing]   = useState(initialFollowing)
  const [followerCnt, setFollowerCnt] = useState(stats.followers)
  const [tab,         setTab]         = useState('products')
  const [sort,        setSort]        = useState('newest')
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [loading,     setLoading]     = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [activeVideo, setActiveVideo] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const isVerified = vendor.verification_status === 'verified'
  const { user } = useAuthStore()
  const openAuthModal = useUiStore(s => s.openAuthModal)

  const handleFollow = async () => {
    if (!user) { openAuthModal(`Sign in to follow ${vendor.store_name} and stay updated`); return }
    const wasFollowing = following
    setFollowing(!wasFollowing)
    setFollowerCnt(c => wasFollowing ? Math.max(0, c - 1) : c + 1)
    await toggleFollow(vendor.id)
  }

  const handleShare = () => {
    setIsShareOpen(true)
  }

  const loadProducts = useCallback(async (newSort = sort, newPage = 1, append = false) => {
    setLoading(true)
    const { products: data, total: t } = await getStoreProducts(vendor.id, {
      sort: newSort, page: newPage, limit: 20,
    })
    setLoading(false)
    setTotal(t)
    setProducts(prev => append ? [...prev, ...data] : data)
    setPage(newPage)
  }, [vendor.id, sort])

  const handleSort = (newSort) => {
    setSort(newSort)
    loadProducts(newSort, 1, false)
  }

  const filteredProducts = products.filter(p =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="min-h-dvh bg-neutral-50">

      {/* Back nav */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <button onClick={() => window.history.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-brand hover:bg-brand-50 transition-all">
          <ArrowLeft size={17} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {vendor.store_logo_url && (
            <img src={vendor.store_logo_url} alt={vendor.store_name}
              className="w-7 h-7 rounded-full object-cover border border-neutral-200 shrink-0" />
          )}
          <p className="font-bold text-brand-800 text-sm truncate">{vendor.store_name}</p>
          <VendorBadge vendor={vendor} size="xs" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleShare}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-brand hover:bg-brand-50 transition-all">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="relative">
        <div className="h-44 sm:h-60 bg-gradient-to-br from-brand-800 to-brand-900 overflow-hidden">
          {vendor.store_banner_url && (
            <img src={vendor.store_banner_url} alt="Store banner"
              className="w-full h-full object-cover opacity-90" />
          )}
        </div>

        {/* Logo overlapping banner */}
        <div className="absolute -bottom-8 left-6">
          <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-white overflow-hidden">
            {vendor.store_logo_url ? (
              <img src={vendor.store_logo_url} alt={vendor.store_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand flex items-center justify-center text-white text-2xl font-bold">
                {vendor.store_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store info */}
      <div className="bg-white border-b border-neutral-200 pt-12 pb-5 px-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-brand-900">{vendor.store_name}</h1>
              <VendorBadge vendor={vendor} />
            </div>
            {vendor.store_handle && (
              <p className="text-sm text-neutral-400 mt-0.5">@{vendor.store_handle}</p>
            )}
            {vendor.store_tagline && (
              <p className="text-sm text-neutral-600 mt-1.5">{vendor.store_tagline}</p>
            )}
            {vendor.store_description && (
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed max-w-md">
                {vendor.store_description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-neutral-400">
              {(vendor.business_city || vendor.business_country) && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {[vendor.business_city, vendor.business_country].filter(Boolean).join(', ')}
                </span>
              )}
              {vendor.store_website && (
                <a href={vendor.store_website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand hover:text-brand-700 transition-colors">
                  <Globe size={11} /> Website
                </a>
              )}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2 mt-3">
              {vendor.social_instagram && (
                <a href={`https://${vendor.social_instagram}`} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-pink-600 hover:bg-pink-50 transition-all">
                  <Instagram size={14} />
                </a>
              )}
              {vendor.social_twitter && (
                <a href={`https://${vendor.social_twitter}`} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-sky-500 hover:bg-sky-50 transition-all">
                  <Twitter size={14} />
                </a>
              )}
              {vendor.social_facebook && (
                <a href={`https://${vendor.social_facebook}`} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  <Facebook size={14} />
                </a>
              )}
            </div>
          </div>

          {/* Follow button */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <button onClick={handleFollow}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]',
                following
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                  : 'bg-brand text-white hover:bg-brand-700 shadow-brand',
              )}>
              <Heart size={15} fill={following ? 'currentColor' : 'none'} />
              {following ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-neutral-100">
          {[
            { icon: Package, label: 'Products',  val: fmtNum(stats.products)  },
            { icon: Video,   label: 'Videos',    val: fmtNum(stats.videos)    },
            { icon: Users,   label: 'Followers', val: fmtNum(followerCnt)     },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-bold text-brand-900 tabular-nums">{s.val}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-200 px-4 flex items-center gap-0 sticky top-[53px] z-20">
        {[
          { id: 'products', label: 'Products', icon: Package, count: stats.products },
          { id: 'videos',   label: 'Videos',   icon: Video,   count: stats.videos   },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all',
              tab === t.id
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-500 hover:text-brand-800',
            )}>
            <t.icon size={14} />
            {t.label}
            <span className={cn('text-[10px] font-bold', tab === t.id ? 'text-brand' : 'text-neutral-400')}>
              {fmtNum(t.count)}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Products tab */}
        {tab === 'products' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48 max-w-sm">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input type="text" placeholder="Search products…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all" />
              </div>
              <div className="relative">
                <select value={sort} onChange={e => handleSort(e.target.value)}
                  className="pl-3 pr-8 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all appearance-none">
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Popular</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Package size={40} className="text-neutral-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-400">
                  {search ? 'No products match your search' : 'No products yet'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {filteredProducts.map(p => <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} />)}
                </div>
                {/* Load more */}
                {products.length < total && !search && (
                  <div className="flex justify-center pt-4">
                    <button onClick={() => loadProducts(sort, page + 1, true)} disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-600 hover:border-brand hover:text-brand hover:bg-brand-50 disabled:opacity-50 transition-all">
                      {loading ? 'Loading…' : `Load more · ${total - products.length} remaining`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Videos tab */}
        {tab === 'videos' && (
          <div>
            {videos.length === 0 ? (
              <div className="py-16 text-center">
                <Video size={40} className="text-neutral-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-400">No videos yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {videos.map(v => <VideoCard key={v.id} video={v} onClick={() => setActiveVideo(v)} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col justify-center items-center p-4">
          <button onClick={() => setActiveVideo(null)} className="absolute top-6 left-6 z-[110] w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 shadow-lg" title="Close video">
            <X size={24} />
          </button>
          
          {/* Centered Phone Player Container */}
          <div className="relative w-full max-w-sm md:w-[400px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/10 flex items-center justify-center animate-fade-up">
            <video
              src={activeVideo.video_url}
              autoPlay
              muted
              controls
              playsInline
              loop
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient overlay for bottom button */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
            
            {activeVideo.video_tags?.[0]?.product && (
              <button 
                onClick={() => { setActiveVideo(null); setSelectedProduct(activeVideo.video_tags[0].product) }}
                className="absolute bottom-8 z-[110] bg-brand text-white px-7 py-3.5 rounded-full font-bold shadow-[0_4px_30px_rgba(22,163,74,0.4)] flex items-center gap-2.5 hover:bg-brand-600 hover:scale-105 active:scale-95 transition-all w-[85%] justify-center border border-brand/50"
              >
                <ShoppingBag size={18} /> View Linked Product
              </button>
            )}
          </div>
        </div>
      )}

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Share Drawer */}
      <ShareDrawer 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={vendor.store_name}
      />
    </div>
  )
}