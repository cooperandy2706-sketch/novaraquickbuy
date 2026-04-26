'use client'
// FILE: src/components/explore/ExplorePage.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Image  from 'next/image'
import Link   from 'next/link'
import {
  ChevronLeft, ChevronRight, BadgeCheck,
  Heart, Star, ShoppingCart,
  Search, SlidersHorizontal, X,
  TrendingUp, Zap, Package,
  Flame, CheckCircle2, Plus, ArrowUpRight,
} from 'lucide-react'
import { useExplore }      from '@/hooks/useExplore'
import { useCart }         from '@/hooks/useCart'
import { useWishlistStore }from '@/store/wishlistStore'
import { useUiStore }     from '@/store/uiStore'
import { useAuthStore }   from '@/store/authStore'
import { useLocaleStore } from '@/store/localeStore'
import toast               from 'react-hot-toast'
import ProductModal        from '@/components/explore/ProductModal'
import ProductCard         from '@/components/product/ProductCard'
import VendorBadge         from '@/components/product/VendorBadge'
import { formatCurrency } from '@/utils/formatCurrency'
import { cn }              from '@/utils/cn'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmtGHS = (v) => formatCurrency(v, 'GHS')
const fmtNum = (n) => {
  const num = Number(n ?? 0)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000)    return `${(num / 1000).toFixed(0)}k`
  return String(num)
}

const CATEGORIES = [
  { id: 'all',     label: 'All',     emoji: '✨' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'tech',    label: 'Tech',    emoji: '📱' },
  { id: 'beauty',  label: 'Beauty',  emoji: '💄' },
  { id: 'food',    label: 'Food',    emoji: '🍜' },
  { id: 'home',    label: 'Home',    emoji: '🏠' },
  { id: 'health',  label: 'Health',  emoji: '💪' },
  { id: 'sports',  label: 'Sports',  emoji: '⚽' },
  { id: 'kids',    label: 'Kids',    emoji: '🧸' },
  { id: 'art',     label: 'Art',     emoji: '🎨' },
  { id: 'music',   label: 'Music',   emoji: '🎵' },
]

const SORTS = [
  { id: 'latest',     label: 'Latest'     },
  { id: 'popular',    label: 'Popular'    },
  { id: 'price_asc',  label: 'Price ↑'   },
  { id: 'price_desc', label: 'Price ↓'   },
  { id: 'rating',     label: 'Top Rated' },
]
const SEARCH_GUESSES = [
  { term: 'Ankara Prints', icon: '👗' },
  { term: 'Nike Air Max',  icon: '👟' },
  { term: 'Skin Care',      icon: '✨' },
  { term: 'Smart Watches',  icon: '⌚' },
  { term: 'Luxury Bags',    icon: '👜' },
  { term: 'Home Decor',     icon: '🏠' },
]

// ══════════════════════════════════════════════════════════════════════
// FULL WIDTH HERO CAROUSEL
// ══════════════════════════════════════════════════════════════════════
function HeroCarousel({ products, onProductClick }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current)
    if (products.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent(c => (c + 1) % products.length)
      }, 5500)
    }
  }, [products.length])

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [startTimer])

  const go = (dir) => {
    setCurrent(c => (c + dir + products.length) % products.length)
    startTimer()
  }

  if (!products.length) return null

  const p = products[current]
  const price = p.discount_price || p.price
  const hasDisc = p.discount_price && p.discount_price < p.price

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-900 group">
      {/* Background images with cross-fade */}
      {products.map((prod, i) => (
        <div
          key={prod.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {prod.images?.[0] && (
            <Image
              src={prod.images[0]}
              alt={prod.name}
              fill
              priority={i === 0}
              className="object-cover scale-105 group-hover:scale-100 transition-transform duration-10000"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
          )}
        </div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-8 sm:pb-12 px-6 sm:px-10">
        <div className="max-w-2xl animate-fade-up" key={current}>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-brand/20 backdrop-blur-md text-brand-300 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-brand/30">
              Official Choice
            </span>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">· {p.category}</span>
          </div>

          <h1 className="text-white font-black text-3xl sm:text-5xl leading-[1.1] mb-4 drop-shadow-2xl">
            {p.name}
          </h1>

          <p className="text-white/70 text-sm sm:text-base leading-relaxed line-clamp-2 mb-8 max-w-lg font-medium">
            {p.description}
          </p>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-white font-black text-3xl tracking-tighter">{fmtGHS(price)}</span>
              {hasDisc && <span className="text-white/40 line-through text-sm font-bold">{fmtGHS(p.price)}</span>}
            </div>
            <button
              onClick={() => onProductClick(p)}
              className="bg-white text-black hover:bg-brand hover:text-white active:scale-95 text-sm font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-2xl"
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>

      {/* Navigation arrows (desktop only for premium feel) */}
      <div className="absolute right-8 bottom-8 hidden sm:flex items-center gap-3">
        <button onClick={() => go(-1)} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
        <button onClick={() => go(1)} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-8 left-10 hidden sm:flex items-center gap-2">
        {products.map((_, i) => (
          <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", i === current ? "w-8 bg-white" : "w-2 bg-white/30")} />
        ))}
      </div>
    </div>
  )
}

function SideBanner({ product, position, onOpen }) {
  if (!product) return (
    <div className="relative h-full rounded-3xl bg-neutral-900 border border-white/5 overflow-hidden animate-pulse flex items-center justify-center">
       <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{position} Slot</span>
    </div>
  )

  const price = product.discount_price || product.price

  return (
    <button 
      onClick={() => onOpen(product)}
      className="group relative w-full h-full rounded-[2.5rem] overflow-hidden bg-neutral-950 border border-white/10 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
    >
      <Image src={product.images?.[0]} alt={product.name} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <span className="text-brand-300 text-[9px] font-black uppercase tracking-[0.2em] mb-2">Admin Featured</span>
        <h3 className="text-white font-black text-xl leading-tight mb-2 line-clamp-2">{product.name}</h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-white font-black text-lg">{fmtGHS(price)}</span>
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white group-hover:bg-brand group-hover:text-white transition-all">
            <Plus size={18} strokeWidth={3} />
          </div>
        </div>
      </div>
    </button>
  )
}

// ══════════════════════════════════════════════════════════════════════
// INFINITE HORIZONTAL PRODUCT SCROLL (auto-scrolling ticker)
// ══════════════════════════════════════════════════════════════════════
function InfiniteProductScroll({ products, onOpen, title, icon }) {
  const trackRef = useRef(null)
  const [paused, setPaused] = useState(false)

  if (!products.length) return null

  // Duplicate for seamless loop
  const items = [...products, ...products, ...products]

  return (
    <div>
      <div className="flex items-center gap-2 px-4 sm:px-6 mb-3">
        <span className="text-base">{icon}</span>
        <h3 className="font-bold text-neutral-900 text-base">{title}</h3>
      </div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-surface via-surface/40 to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-surface via-surface/40 to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          className="flex gap-3 px-4 sm:px-6"
          style={{
            animation: `infiniteScroll ${products.length * 3}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
            width: 'max-content',
          }}
        >
          {items.map((p, i) => {
            const price   = p.discount_price || p.price
            const hasDisc = p.discount_price && p.discount_price < p.price
            return (
              <button
                key={`${p.id}-${i}`}
                onClick={() => onOpen(p)}
                className="group shrink-0 w-40 text-left rounded-2xl overflow-hidden bg-surface-2 border border-border hover:border-brand-300 hover:shadow-md transition-all duration-200"
              >
                <div className="relative overflow-hidden bg-neutral-100" style={{ aspectRatio: '1/1' }}>
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="160px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl bg-brand-50">🛍️</div>
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <VendorBadge vendor={p.vendor} size="xs" className="opacity-90 shadow-sm" />
                  </div>

                  {hasDisc && (
                    <div className="absolute top-1.5 right-1.5 bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      -{Math.round((1 - p.discount_price / p.price) * 100)}%
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] text-muted truncate">{p.vendor?.store_name}</p>
                  <p className="text-xs font-semibold text-primary leading-tight mt-0.5 line-clamp-2">{p.name}</p>
                  <p className="text-sm font-black text-brand mt-1">{fmtGHS(price)}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes infiniteScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-${(100 / 3).toFixed(4)}%); }
        }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// PRODUCT CARD (for main grid)
// ══════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════
// MAIN EXPLORE PAGE
// ══════════════════════════════════════════════════════════════════════
export default function ExplorePage() {
  const { country, detectedCountry, setCountry, detectLocation } = useLocaleStore()

  useEffect(() => {
    detectLocation()
  }, [detectLocation])
  
  const {
    products, heroMain, heroSideTop, heroSideBottom,
    hotDeals, trending, newArrivals, featuredVendors,
    loading, hasMore, error, loadMore, filterProducts,
  } = useExplore(country)

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [category,    setCategory]    = useState('all')
  const [sort,        setSort]        = useState('latest')
  const [search,      setSearch]      = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [liveSuggestions, setLiveSuggestions] = useState([])
  const [isSearchingLive, setIsSearchingLive] = useState(false)
  const supabase = createClient()

  const sentinelRef  = useRef(null)
  const searchTimer  = useRef(null)

  // All vendor products merged for the infinite scroll strip
  // (uses trending + new arrivals + hot deals deduplicated)
  const stripProducts = useCallback(() => {
    const seen = new Set()
    return [...trending, ...newArrivals, ...hotDeals, ...products]
      .filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      .slice(0, 40)
  }, [trending, newArrivals, hotDeals, products])

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore({ category, sort, search, inStock: inStockOnly }) },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, category, sort, search, inStockOnly])

  const applyFilters = useCallback((overrides = {}) => {
    filterProducts({ category, sort, search, inStock: inStockOnly, ...overrides })
  }, [category, sort, search, inStockOnly, filterProducts])

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => applyFilters({ search: val }), 350)
  }

  // Live suggestions effect
  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setLiveSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true)
      const { data } = await supabase
        .from('products')
        .select('id, name, category, images, vendor:vendors(store_name, verified)')
        .ilike('name', `%${search}%`)
        .limit(6)
      
      setLiveSuggestions(data || [])
      setIsSearchingLive(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [search, supabase])

  const handleCategory = (cat) => { setCategory(cat); applyFilters({ category: cat }) }
  const handleSort     = (s)   => { setSort(s);       applyFilters({ sort: s }) }
  const clearFilters   = ()    => {
    setCategory('all'); setSort('latest'); setSearch(''); setInStockOnly(false)
    filterProducts({})
  }

  const activeFilterCount = (category !== 'all' ? 1 : 0) + (sort !== 'latest' ? 1 : 0) + (inStockOnly ? 1 : 0) + (search ? 1 : 0)

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading && products.length === 0) return (
    <div className="min-h-screen bg-surface">
      <div className="skeleton w-full" style={{ height: 480 }} />
      <div className="page py-6 space-y-6">
        <div className="skeleton h-12 rounded-2xl max-w-2xl" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-8 w-20 rounded-full shrink-0" />)}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton w-40 rounded-2xl shrink-0" style={{ aspectRatio: '3/4' }} />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton rounded-2xl" style={{ aspectRatio: '3/4' }} />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface transition-colors duration-300">

      {/* ── SUPER ADMIN HERO SECTION ────────────────────────────── */}
      <div className="page pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[350px] sm:h-[520px]">
          {/* Main Carousel */}
          <div className="lg:col-span-2 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
            <HeroCarousel products={heroMain} onProductClick={setSelectedProduct} />
          </div>

          {/* Side Banners (Admin Managed) */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="flex-1 min-h-0">
              <SideBanner product={heroSideTop} position="Top" onOpen={setSelectedProduct} />
            </div>
            <div className="flex-1 min-h-0">
              <SideBanner product={heroSideBottom} position="Bottom" onOpen={setSelectedProduct} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH + FILTER BAR ────────────────────────────────── */}
      <div className="relative z-[60] bg-surface border-b border-neutral-100 transition-all duration-300">
        <div className="page py-4">
          {/* Search row */}
          <div className="flex items-center gap-3 min-h-[64px]">
            {!isSearching ? (
              <motion.div 
                layoutId="search-bar"
                className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-neutral-50/50 border border-neutral-100 rounded-[2rem] focus-within:bg-white focus-within:border-brand/30 transition-all shadow-inner cursor-pointer sm:cursor-text"
                onClick={() => setIsSearching(true)}
              >
                <Search size={18} className="text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  onFocus={() => setIsSearching(true)}
                  placeholder="Search products, vendors..."
                  className="flex-1 bg-transparent text-sm font-medium outline-none text-neutral-800 placeholder:text-neutral-400 pointer-events-none sm:pointer-events-auto"
                  readOnly={window.innerWidth < 640}
                />
                {search && (
                  <button onClick={(e) => { e.stopPropagation(); setSearch(''); applyFilters({ search: '' }) }} className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
                    <X size={14} className="text-neutral-400" />
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="flex-1" /> // Placeholder
            )}

            {/* Mobile Search Overlay */}
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[1000] bg-surface flex flex-col"
                >
                  <div className="p-4 border-b border-neutral-100 bg-white flex items-center gap-3">
                    <motion.div 
                      layoutId="search-bar"
                      className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-white border border-brand/30 rounded-[2rem] shadow-md"
                    >
                      <Search size={18} className="text-brand shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search products, vendors..."
                        className="flex-1 bg-transparent text-sm font-bold outline-none text-neutral-900"
                      />
                      {search && (
                        <button onClick={() => { setSearch(''); applyFilters({ search: '' }) }} className="p-1">
                          <X size={14} className="text-neutral-400" />
                        </button>
                      )}
                    </motion.div>
                    <button 
                      onClick={() => setIsSearching(false)}
                      className="text-sm font-black uppercase tracking-widest text-neutral-500 active:scale-95 transition-transform shrink-0 pr-2"
                    >
                      Cancel
                    </button>
                  </div>

                  <motion.div 
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', damping: 25 }}
                    className="flex-1 overflow-y-auto bg-surface"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                          {search.length >= 2 ? 'Matching Results' : 'Trending Guesses'}
                        </h3>
                        {isSearchingLive ? (
                          <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <TrendingUp size={12} className="text-neutral-300" />
                        )}
                      </div>

                      <div className="grid gap-3">
                        {search.length >= 2 ? (
                          liveSuggestions.length > 0 ? (
                            liveSuggestions.map((p, i) => (
                              <motion.button
                                key={p.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => { handleSearch(p.name); setIsSearching(false) }}
                                className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-neutral-100 shadow-sm active:scale-[0.98] transition-all group"
                              >
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-50 shrink-0 border border-neutral-100">
                                  {p.images?.[0] ? (
                                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="text-sm font-bold text-neutral-800 truncate">{p.name}</p>
                                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                                    {p.vendor?.store_name} · {p.category}
                                  </p>
                                </div>
                                <ArrowUpRight size={14} className="text-neutral-300 group-hover:text-brand transition-colors" />
                              </motion.button>
                            ))
                          ) : !isSearchingLive && (
                            <div className="py-10 text-center">
                              <p className="text-sm text-neutral-400">No matches found for "{search}"</p>
                            </div>
                          )
                        ) : (
                          SEARCH_GUESSES.map((g, i) => (
                            <motion.button
                              key={g.term}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + (i * 0.05) }}
                              onClick={() => { handleSearch(g.term); setIsSearching(false) }}
                              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm active:scale-[0.98] transition-all group"
                            >
                              <span className="text-xl bg-neutral-50 w-10 h-10 rounded-xl flex items-center justify-center border border-neutral-100 group-hover:bg-brand/10 transition-colors">{g.icon}</span>
                              <span className="flex-1 text-sm font-bold text-neutral-800">{g.term}</span>
                              <Search size={14} className="text-neutral-300 group-hover:text-brand transition-colors" />
                            </motion.button>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location Toggle (Mobile hidden, shown in expanded or side) */}
            <div className="hidden sm:flex items-center bg-neutral-100/50 p-1 rounded-2xl border border-neutral-100">
              <button 
                onClick={() => setCountry('all')}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  country === 'all' ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                Global
              </button>
              <button 
                onClick={() => setCountry(detectedCountry || 'Ghana')}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  country !== 'all' ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                {detectedCountry || 'Local'}
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 rounded-[1.8rem] text-xs font-black uppercase tracking-widest border transition-all shrink-0 active:scale-95 shadow-lg',
                showFilters || activeFilterCount > 0
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-300'
              )}
            >
              <SlidersHorizontal size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className={cn(
                  'w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ml-1',
                  showFilters ? 'bg-white text-black' : 'bg-brand text-white'
                )}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="border-t border-neutral-50/50">
          <div className="page flex items-center gap-2 overflow-x-auto py-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 shrink-0 border active:scale-95',
                  category === cat.id
                    ? 'bg-brand/10 text-brand border-brand/30 shadow-[0_8px_20px_rgba(27,67,50,0.1)]'
                    : 'bg-neutral-50/50 text-neutral-400 border-transparent hover:border-neutral-200 hover:text-neutral-600'
                )}
              >
                <span className="text-sm grayscale-[0.5] group-hover:grayscale-0 transition-all">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

          {/* Extended filters panel */}
          {showFilters && (
            <div className="pb-3 pt-1 border-t border-border flex items-center gap-4 flex-wrap animate-fade-down">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">Sort by:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {SORTS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSort(s.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                        sort === s.id
                          ? 'bg-brand/10 text-brand border border-brand-200'
                          : 'bg-surface-2 text-muted border border-border hover:border-brand-200'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <div
                  className={cn('w-9 h-5 rounded-full transition-colors duration-200 relative shrink-0', inStockOnly ? 'bg-brand' : 'bg-neutral-200')}
                  onClick={() => { setInStockOnly(!inStockOnly); applyFilters({ inStock: !inStockOnly }) }}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200', inStockOnly ? 'left-4' : 'left-0.5')} />
                </div>
                <span className="text-xs font-medium text-neutral-600 whitespace-nowrap">In stock only</span>
              </label>
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="bg-neutral-50/80 border-t border-neutral-100 py-2.5 overflow-x-auto scrollbar-none">
              <div className="page flex items-center gap-2">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mr-1 shrink-0">Active Filters:</span>
                
                {category !== 'all' && (
                  <button 
                    onClick={() => handleCategory('all')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold border border-brand/20 whitespace-nowrap active:scale-95 transition-transform"
                  >
                    Category: {CATEGORIES.find(c => c.id === category)?.label}
                    <X size={10} strokeWidth={3} />
                  </button>
                )}

                {sort !== 'latest' && (
                  <button 
                    onClick={() => handleSort('latest')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 whitespace-nowrap active:scale-95 transition-transform"
                  >
                    Sort: {SORTS.find(s => s.id === sort)?.label}
                    <X size={10} strokeWidth={3} />
                  </button>
                )}

                {inStockOnly && (
                  <button 
                    onClick={() => { setInStockOnly(false); applyFilters({ inStock: false }) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 whitespace-nowrap active:scale-95 transition-transform"
                  >
                    In Stock Only
                    <X size={10} strokeWidth={3} />
                  </button>
                )}

                {search && (
                  <button 
                    onClick={() => { setSearch(''); applyFilters({ search: '' }) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold border border-neutral-300 whitespace-nowrap active:scale-95 transition-transform"
                  >
                    Search: "{search}"
                    <X size={10} strokeWidth={3} />
                  </button>
                )}

                <button 
                  onClick={clearFilters}
                  className="text-[10px] font-black text-danger uppercase tracking-widest ml-auto hover:underline shrink-0"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

      {/* ── FEATURED VENDORS ──────────────────────────────────────── */}
      {featuredVendors.length > 0 && (
        <div className="page pt-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={15} className="text-brand" />
            <h3 className="font-bold text-primary text-sm">Verified Vendors</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {featuredVendors.map(vendor => (
              <Link
                key={vendor.id}
                href={`/store/${vendor.id}`}
                className="shrink-0 flex flex-col items-center gap-2 p-3 w-20 rounded-2xl bg-surface-2 border border-border hover:border-brand-300 hover:bg-brand/10 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center font-bold text-brand-800 text-sm relative">
                  {vendor.logo_url
                    ? <Image src={vendor.logo_url} alt={vendor.store_name} fill className="object-cover" />
                    : vendor.store_name?.charAt(0)
                  }
                  <VendorBadge 
                    vendor={vendor} 
                    size="xs" 
                    className="absolute -bottom-1 -right-4 shadow-sm ring-1 ring-surface whitespace-nowrap !px-1 [&>span]:hidden" 
                  />

                </div>
                <p className="text-[9px] font-semibold text-primary text-center leading-tight line-clamp-2">{vendor.store_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── INFINITE HORIZONTAL PRODUCT STRIP ────────────────────── */}
      {stripProducts().length > 4 && (
        <div className="pt-6 pb-2">
          <InfiniteProductScroll
            products={stripProducts()}
            onOpen={setSelectedProduct}
            title="All Products"
            icon="🛍️"
          />
        </div>
      )}

      {/* Hot Deals strip */}
      {hotDeals.length > 3 && (
        <div className="pt-4 pb-2">
          <InfiniteProductScroll
            products={hotDeals}
            onOpen={setSelectedProduct}
            title="Hot Deals"
            icon="🔥"
          />
        </div>
      )}

      {/* ── MAIN PRODUCT GRID ─────────────────────────────────────── */}
      <div className="page py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <Package size={16} className="text-brand" />
            Browse Products
            {activeFilterCount > 0 && (
              <span className="text-xs font-normal text-neutral-400">
                · {products.length} results
              </span>
            )}
          </h3>
        </div>

        {products.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl">🛍️</div>
            <h4 className="font-semibold text-neutral-700">No products found</h4>
            <p className="text-sm text-neutral-400 text-center max-w-xs">
              {activeFilterCount > 0 ? 'Try adjusting your filters.' : 'No products yet — check back soon.'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpen={setSelectedProduct}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(idx % 10, 9) * 50}ms` }}
                />
              ))}
              {loading && products.length > 0 && Array.from({ length: 4 }).map((_, i) => (
                <div key={`sk-${i}`} className="skeleton rounded-2xl" style={{ aspectRatio: '3/4' }} />
              ))}
            </div>

            {hasMore && <div ref={sentinelRef} className="h-8 mt-4" />}

            {!hasMore && products.length > 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-0.5 bg-neutral-200 rounded mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">All products loaded</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}