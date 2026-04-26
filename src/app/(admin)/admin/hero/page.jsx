'use client'
// FILE: src/app/(admin)/admin/hero/page.jsx

import { useState, useEffect } from 'react'
import Image                    from 'next/image'
import { createClient }         from '@/lib/supabase/client'
import { useAuthStore }         from '@/store/authStore'
import { useRouter }            from 'next/navigation'
import {
  Search, BadgeCheck, X, Monitor,
  PanelTop, PanelBottom, Check,
  Trash2, RefreshCw, ShieldAlert, Sparkles
} from 'lucide-react'
import { cn }  from '@/utils/cn'
import toast    from 'react-hot-toast'

const fmtGHS = (v) => `GH₵${Number(v ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 0 })}`

const SLOTS = [
  { id: 'main',        label: 'Main Carousel',      icon: <Monitor     size={16} />, desc: 'Hero carousel. Up to 5 products.',     max: 5 },
  { id: 'side_top',    label: 'Right Banner — Top',  icon: <PanelTop    size={16} />, desc: 'Top-right banner. 1 product.',          max: 1 },
  { id: 'side_bottom', label: 'Right Banner — Bottom',icon:<PanelBottom size={16} />, desc: 'Bottom-right banner. 1 product.',       max: 1 },
]

export default function AdminHeroPage() {
  const router          = useRouter()
  const { profile }     = useAuthStore()
  const [heroProducts,  setHeroProducts]  = useState([])
  const [premiumProducts, setPremiumProducts] = useState([])
  const [allProducts,   setAllProducts]   = useState([])
  const [search,        setSearch]        = useState('')
  const [searching,     setSearching]     = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [activeSlot,    setActiveSlot]    = useState('main')
  const [saving,        setSaving]        = useState(null)
  const supabase = createClient()

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.replace('/feed')
  }, [profile])

  const loadHero = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, discount_price, images, category, is_hero, hero_position, vendor:vendors(id, store_name, verified)')
      .eq('is_hero', true).order('hero_position')
    setHeroProducts(data ?? [])
    setLoading(false)
  }

  const loadPremiumUploads = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, discount_price, images, category, is_hero, hero_position, vendor:vendors!inner(id, store_name, verified, subscription_status)')
      .eq('vendors.subscription_status', 'active')
      .eq('is_hero', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)
    setPremiumProducts(data ?? [])
  }

  useEffect(() => {
    loadHero()
    loadPremiumUploads()
    const channel = supabase.channel('admin-hero-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, () => { loadHero(); loadPremiumUploads(); })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (!search.trim()) { setAllProducts([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase.from('products')
        .select('id, name, price, discount_price, images, category, is_hero, hero_position, vendor:vendors(id, store_name, verified)')
        .ilike('name', `%${search}%`).eq('is_active', true).order('name').limit(20)
      setAllProducts(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const setHero = async (productId, makeHero, position) => {
    setSaving(productId)
    const { error } = await supabase.rpc('set_product_hero', { product_id: productId, make_hero: makeHero, position })
    if (error) toast.error(error.message)
    else {
      toast.success(makeHero ? `Added to ${SLOTS.find(s => s.id === position)?.label}` : 'Removed from banner')
      await loadHero()
      await loadPremiumUploads()
    }
    setSaving(null)
  }

  const currentSlot  = SLOTS.find(s => s.id === activeSlot)
  const slotProducts = heroProducts.filter(p => p.hero_position === activeSlot)
  const slotFull     = slotProducts.length >= (currentSlot?.max ?? 1)

  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <ShieldAlert size={28} className="text-danger" />
        <p className="font-semibold text-neutral-600">Admin access only</p>
      </div>
    )
  }

  return (
    <div className="page py-6 max-w-5xl animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Monitor size={15} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-800">Hero Banner Manager</h1>
        </div>
        <p className="text-sm text-neutral-500 ml-10">
          Control what appears in the Explore page banners. Only you can manage this.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Slot selector */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 px-1">Banner Slots</p>
          {SLOTS.map(slot => {
            const count    = heroProducts.filter(p => p.hero_position === slot.id).length
            const isActive = activeSlot === slot.id
            return (
              <button key={slot.id} onClick={() => setActiveSlot(slot.id)}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-150',
                  isActive ? 'bg-brand-50 border-brand-300 shadow-sm' : 'bg-white border-neutral-200 hover:border-brand-200 hover:bg-brand-50/50'
                )}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', isActive ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
                  {slot.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', isActive ? 'text-brand-800' : 'text-neutral-800')}>{slot.label}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{slot.desc}</p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex gap-1">
                      {Array.from({ length: slot.max }).map((_, i) => (
                        <div key={i} className={cn('h-1.5 rounded-full transition-all', slot.max === 1 ? 'w-8' : 'w-4', i < count ? 'bg-brand' : 'bg-neutral-200')} />
                      ))}
                    </div>
                    <span className="text-[10px] text-neutral-400">{count}/{slot.max}</span>
                  </div>
                </div>
              </button>
            )
          })}

          {/* Live products in slot */}
          {slotProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 px-4 py-3 border-b border-neutral-100">
                Live in {currentSlot?.label}
              </p>
              {slotProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-all">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                    {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} width={40} height={40} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{p.vendor?.store_name}</p>
                    <p className="text-[10px] font-bold text-brand">{fmtGHS(p.discount_price || p.price)}</p>
                  </div>
                  <button onClick={() => setHero(p.id, false, activeSlot)} disabled={saving === p.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-300 hover:text-danger hover:bg-red-50 transition-all shrink-0">
                    {saving === p.id ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search + product picker */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-neutral-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-neutral-800">
                  Add to <span className="text-brand">{currentSlot?.label}</span>
                </p>
                {slotFull && (
                  <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Slot full — remove one first
                  </span>
                )}
              </div>
              <div className={cn(
                'flex items-center gap-2 border rounded-xl px-3.5 py-2.5 transition-all',
                'bg-neutral-50 border-neutral-200',
                'focus-within:bg-white focus-within:border-brand'
              )}>
                <Search size={14} className="text-neutral-400 shrink-0" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search any product by name..."
                  className="flex-1 bg-transparent text-sm outline-none text-neutral-800 placeholder:text-neutral-400"
                  autoFocus />
                {search && (
                  <button onClick={() => { setSearch(''); setAllProducts([]) }} className="text-neutral-400 hover:text-neutral-700">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-neutral-50 max-h-[520px] overflow-y-auto">
              {!search && premiumProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
                    <Search size={22} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Search for a product</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                      Type to search across all vendors' active products. Only you can add to banner slots.
                    </p>
                  </div>
                </div>
              )}

              {!search && premiumProducts.length > 0 && (
                <div className="bg-amber-50/30">
                  <div className="px-5 py-3 border-b border-amber-100 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-transparent">
                    <Sparkles size={16} className="text-amber-500" />
                    <p className="text-sm font-bold text-amber-800">Priority Uploads (Upgraded Vendors)</p>
                  </div>
                  {premiumProducts.map(product => {
                    const price         = product.discount_price || product.price
                    const isSaving      = saving === product.id
                    const disabled      = isSaving || slotFull

                    return (
                      <div key={product.id} className="flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-white/50 border-b border-amber-50 last:border-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                          {product.images?.[0] ? <Image src={product.images[0]} alt={product.name} width={56} height={56} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-neutral-900 truncate">{product.name}</p>
                            {product.vendor?.verified && <BadgeCheck size={13} className="text-brand shrink-0" />}
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">by {product.vendor?.store_name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm font-bold text-brand">{fmtGHS(price)}</span>
                            {product.discount_price && <span className="text-xs text-neutral-400 line-through">{fmtGHS(product.price)}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => setHero(product.id, true, activeSlot)}
                          disabled={disabled}
                          className={cn(
                            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 min-w-[80px] justify-center',
                            disabled ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500'
                          )}
                        >
                          {isSaving ? <RefreshCw size={12} className="animate-spin" /> : '+ Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {searching && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!searching && search && allProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-sm text-neutral-500">No products found for "<strong>{search}</strong>"</p>
                </div>
              )}

              {allProducts.map(product => {
                const price         = product.discount_price || product.price
                const alreadyInSlot = product.is_hero && product.hero_position === activeSlot
                const inOtherSlot   = product.is_hero && product.hero_position !== activeSlot
                const isSaving      = saving === product.id
                const disabled      = isSaving || (slotFull && !alreadyInSlot)

                return (
                  <div key={product.id} className={cn('flex items-center gap-4 px-5 py-3.5 transition-all', alreadyInSlot ? 'bg-brand-50' : 'hover:bg-neutral-50')}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                      {product.images?.[0] ? <Image src={product.images[0]} alt={product.name} width={56} height={56} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{product.name}</p>
                        {product.vendor?.verified && <BadgeCheck size={13} className="text-brand shrink-0" />}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">by {product.vendor?.store_name}{product.category && ` · ${product.category}`}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm font-bold text-brand">{fmtGHS(price)}</span>
                        {product.discount_price && <span className="text-xs text-neutral-400 line-through">{fmtGHS(product.price)}</span>}
                        {inOtherSlot && <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded-md border border-amber-200">In {SLOTS.find(s => s.id === product.hero_position)?.label}</span>}
                        {alreadyInSlot && <span className="text-[10px] bg-brand-50 text-brand-700 font-semibold px-1.5 py-0.5 rounded-md border border-brand-200">Live in this slot</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setHero(product.id, !alreadyInSlot, activeSlot)}
                      disabled={disabled}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 min-w-[80px] justify-center',
                        alreadyInSlot ? 'bg-brand text-white hover:bg-danger'
                          : disabled ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : 'bg-brand-50 text-brand hover:bg-brand hover:text-white border border-brand-200 hover:border-brand'
                      )}
                    >
                      {isSaving ? <RefreshCw size={12} className="animate-spin" />
                        : alreadyInSlot ? <><Check size={12} /> Added</>
                        : '+ Add'
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}