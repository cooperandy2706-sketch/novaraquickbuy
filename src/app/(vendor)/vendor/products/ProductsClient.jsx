'use client'
// FILE: src/app/(vendor)/vendor/products/ProductsClient.jsx

import { useState, useTransition, useCallback } from 'react'
import { useRouter }   from 'next/navigation'
import Link            from 'next/link'
import {
  Plus, Search, Filter, Package,
  Trash2, Eye, EyeOff, RefreshCw,
  Upload, Sparkles, TrendingUp, AlertCircle,
  LayoutGrid, List, ChevronLeft, ChevronRight
} from 'lucide-react'
import { bulkProductAction } from '@/lib/actions/products'
import ProductRow            from '@/components/vendor/products/ProductRow'
import ProductFilters        from '@/components/vendor/products/ProductFilters'
import { cn }               from '@/utils/cn'

const STATUS_TABS = [
  { label: 'All',       value: '' },
  { label: 'Active',    value: 'active' },
  { label: 'Draft',     value: 'draft' },
  { label: 'Archived',  value: 'archived' },
]

export default function ProductsClient({ data, filters }) {
  const router                       = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected,  setSelected]     = useState([])
  const [showFilters, setShowFilters]= useState(false)
  const [bulkLoading, setBulkLoading]= useState(false)
  const [viewMode, setViewMode]      = useState('grid') // 'grid' or 'list'

  const products  = data?.products ?? []
  const total     = data?.total    ?? 0
  const limit     = data?.limit    ?? 20
  const page      = data?.page     ?? 1
  const totalPages = Math.ceil(total / limit)

  // Quick stats summary
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length
  const outOfStockCount = products.filter(p => p.stock_quantity === 0 && !p.is_digital).length

  const pushFilters = useCallback((patch) => {
    const params = new URLSearchParams()
    const next   = { ...filters, ...patch }
    if (next.search)   params.set('search',   next.search)
    if (next.status)   params.set('status',   next.status)
    if (next.category) params.set('category', next.category)
    if (next.type)     params.set('type',      next.type)
    if (next.page > 1) params.set('page',     next.page)
    startTransition(() => router.push(`/vendor/products?${params.toString()}`))
  }, [filters, router])

  const toggleSelect  = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const selectAll     = () => setSelected(products.map(p => p.id))
  const clearSelected = () => setSelected([])
  const allSelected   = selected.length === products.length && products.length > 0

  const handleBulk = async (action) => {
    if (!selected.length) return
    if (action === 'delete' && !confirm(`Delete ${selected.length} product(s)? This cannot be undone.`)) return
    setBulkLoading(true)
    const res = await bulkProductAction(selected, action)
    setBulkLoading(false)
    if (!res?.error) {
      clearSelected()
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-6 pb-20">

      {/* Premium Page Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-neutral-900 text-white p-6 sm:p-10 shadow-2xl shadow-neutral-900/40 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 blur-[100px] -mr-32 -mt-32 rounded-full transition-transform group-hover:scale-110 duration-1000" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                <Sparkles size={12} /> Product Manager
             </div>
             <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">Your Catalog</h1>
             <p className="text-white/40 text-xs sm:text-sm font-bold">
               Manage {total.toLocaleString()} products across your store
             </p>
          </div>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
             <Link
                href="/vendor/import"
                className="flex items-center justify-center gap-2 px-5 py-4 sm:py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-xl"
              >
                <Upload size={16} /> Import
              </Link>
              <Link
                href="/vendor/products/new"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-brand hover:bg-brand-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand/30 active:scale-95"
              >
                <Plus size={18} strokeWidth={4} /> Add Product
              </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
             <Package size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total</p>
            <p className="text-lg font-black text-neutral-900">{total}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
             <TrendingUp size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active</p>
            <p className="text-lg font-black text-neutral-900">{products.filter(p => p.status === 'active').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
             <AlertCircle size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Low Stock</p>
            <p className="text-lg font-black text-neutral-900">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
             <Trash2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Out of Stock</p>
            <p className="text-lg font-black text-neutral-900">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      {/* Main Controls Area */}
      <div className="flex flex-col gap-4">
        
        {/* Status tabs & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1.5 bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => pushFilters({ status: tab.value, page: 1 })}
                className={cn(
                  'px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                  filters.status === tab.value
                    ? 'bg-neutral-900 text-white shadow-lg'
                    : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-white border border-neutral-100 rounded-2xl shadow-sm self-end sm:self-auto">
             <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'grid' ? "bg-brand/10 text-brand" : "text-neutral-400 hover:text-neutral-900"
              )}
             >
               <LayoutGrid size={18} />
             </button>
             <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'list' ? "bg-brand/10 text-brand" : "text-neutral-400 hover:text-neutral-900"
              )}
             >
               <List size={18} />
             </button>
          </div>
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              defaultValue={filters.search}
              onChange={e => pushFilters({ search: e.target.value, page: 1 })}
              className="w-full pl-12 pr-4 py-4 rounded-3xl border border-neutral-100 bg-white text-sm font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/40 transition-all text-neutral-900 shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              'flex items-center gap-2 h-14 px-6 rounded-3xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm bg-white',
              showFilters
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-neutral-100 text-neutral-600 hover:border-brand/40 hover:text-brand',
            )}
          >
            <Filter size={16} />
            <span className="inline">Filters</span>
            {(filters.category || filters.type) && (
              <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-black ml-1">
                {[filters.category, filters.type].filter(Boolean).length}
              </span>
            )}
          </button>
          {isPending && <RefreshCw size={16} className="text-brand animate-spin" />}
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <ProductFilters filters={filters} onChange={(patch) => pushFilters({ ...patch, page: 1 })} />
        </div>
      )}

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-safe left-4 right-4 sm:left-auto sm:right-auto sm:bottom-10 sm:fixed z-[100] flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3.5 bg-neutral-900 text-white rounded-[2rem] shadow-[0_20px_50px_rgb(0,0,0,0.5)] animate-in slide-in-from-bottom-8 duration-300 overflow-x-auto no-scrollbar border border-white/10">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-black text-xs">
              {selected.length}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 hidden sm:block">Selected</span>
          </div>
          
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={() => handleBulk('publish')}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              <Eye size={14} /> <span>Publish</span>
            </button>
            <button
              onClick={() => handleBulk('unpublish')}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-all disabled:opacity-50"
            >
              <EyeOff size={14} /> <span>Unpublish</span>
            </button>
            <button
              onClick={() => handleBulk('delete')}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-danger transition-all disabled:opacity-50"
            >
              <Trash2 size={14} /> <span>Delete</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
            <button onClick={clearSelected} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white shrink-0 ml-1">
              Cancel
            </button>
          </div>
          {bulkLoading && <RefreshCw size={14} className="text-brand animate-spin shrink-0" />}
        </div>
      )}

      {/* Product Display Area */}
      <div className={cn(
        "transition-all duration-500",
        viewMode === 'grid' 
          ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
          : "flex flex-col bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden"
      )}>
        
        {/* Table header (Only in List Mode on Desktop) */}
        {viewMode === 'list' && (
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-neutral-100 bg-neutral-50/50">
            <div className="col-span-1">
              <button
                onClick={allSelected ? clearSelected : selectAll}
                className={cn(
                  'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all',
                  allSelected ? 'bg-brand border-brand' : 'border-neutral-200 hover:border-brand',
                )}
              >
                {allSelected && <span className="text-white text-[10px] font-black">✓</span>}
              </button>
            </div>
            <span className="col-span-5 text-[10px] font-black uppercase tracking-widest text-neutral-400">Product Info</span>
            <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">Type & Status</span>
            <span className="col-span-1 text-right text-[10px] font-black uppercase tracking-widest text-neutral-400">Stock</span>
            <span className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest text-neutral-400">Price</span>
            <span className="col-span-1" />
          </div>
        )}

        {products.length === 0 ? (
          <div className="col-span-full py-32 text-center">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-neutral-200" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight">No products found</h3>
            <p className="text-sm text-neutral-400 mt-2 max-w-xs mx-auto">
              {filters.search || filters.status || filters.category
                ? 'Try adjusting your filters or search term'
                : 'Start building your store catalog by adding your first product'}
            </p>
            {!filters.search && !filters.status && (
              <Link
                href="/vendor/products/new"
                className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-brand text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-brand/30 hover:bg-brand-600 transition-all"
              >
                <Plus size={18} strokeWidth={4} /> Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          products.map(product => (
            <ProductRow
              key={product.id}
              product={product}
              viewMode={viewMode}
              selected={selected.includes(product.id)}
              onSelect={() => toggleSelect(product.id)}
              onRefresh={() => startTransition(() => router.refresh())}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-neutral-100">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            Showing <span className="text-neutral-900">{((page - 1) * limit) + 1}–{Math.min(page * limit, total)}</span> of <span className="text-neutral-900">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pushFilters({ page: page - 1 })}
              disabled={page <= 1 || isPending}
              className="h-12 flex items-center gap-3 px-6 rounded-2xl border border-neutral-100 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <div className="flex items-center gap-1 px-4 text-xs font-black">
               <span className="text-brand">{page}</span>
               <span className="text-neutral-300">/</span>
               <span className="text-neutral-400">{totalPages}</span>
            </div>
            <button
              onClick={() => pushFilters({ page: page + 1 })}
              disabled={page >= totalPages || isPending}
              className="h-12 flex items-center gap-3 px-6 rounded-2xl border border-neutral-100 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}