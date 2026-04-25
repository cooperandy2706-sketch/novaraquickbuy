'use client'
// FILE: src/app/(vendor)/vendor/inventory/InventoryClient.jsx

import { useState, useTransition, useCallback } from 'react'
import { useRouter }      from 'next/navigation'
import { useAuth }        from '@/hooks/useAuth'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import {
  Search, RefreshCw, Package,
  ChevronLeft, ChevronRight, CheckSquare,
  Layers,
} from 'lucide-react'
import InventorySummaryCards from '@/components/vendor/inventory/InventorySummaryCards'
import InventoryRow          from '@/components/vendor/inventory/InventoryRow'
import BulkStockEditor       from '@/components/vendor/inventory/BulkStockEditor'
import { cn }                from '@/utils/cn'

export default function InventoryClient({ data: initialData, filters }) {
  const router                       = useRouter()
  const { profile }                  = useAuth()
  const [isPending, startTransition] = useTransition()
  const [selected,  setSelected]     = useState([])
  const [showBulk,  setShowBulk]     = useState(false)

  const vendorId = profile?.vendor?.id ?? null

  // ── Live data via Supabase Realtime ────────────────────────────────────────
  const data     = useRealtimeInventory(initialData, vendorId)
  const products = data?.products ?? []
  const summary  = data?.summary  ?? {}
  const total    = data?.total    ?? 0
  const limit    = data?.limit    ?? 30
  const page     = data?.page     ?? 1
  const loading  = isPending || !data

  // ── URL navigation ────────────────────────────────────────────────────────
  const pushFilters = useCallback((patch) => {
    const params = new URLSearchParams()
    const next   = { ...filters, ...patch }
    if (next.filter) params.set('filter', next.filter)
    if (next.search) params.set('search', next.search)
    if (next.page > 1) params.set('page', next.page)
    startTransition(() => router.push(`/vendor/inventory?${params.toString()}`))
  }, [filters])

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect  = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const allSelected   = selected.length === products.length && products.length > 0
  const selectAll     = () => setSelected(products.map(p => p.id))
  const clearSelected = () => setSelected([])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Inventory</h1>
          <p className="text-sm text-muted mt-0.5 flex items-center gap-2">
            {total} tracked product{total !== 1 ? 's' : ''}
            {vendorId && (
              <span className="flex items-center gap-1 text-status-success text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                Live
              </span>
            )}
          </p>
        </div>

        {/* Bulk edit trigger */}
        {selected.length > 0 && (
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white font-bold rounded-xl text-sm shadow-brand hover:bg-brand-700 transition-all active:scale-[0.98]"
          >
            <Layers size={15} /> Bulk Edit ({selected.length})
          </button>
        )}
      </div>

      {/* Summary cards — clickable to filter */}
      <InventorySummaryCards
        summary={summary}
        loading={loading}
        activeFilter={filters.filter}
        onFilterChange={(f) => { clearSelected(); pushFilters({ filter: f, page: 1 }) }}
      />

      {/* Bulk stock editor panel */}
      {showBulk && (
        <BulkStockEditor
          selectedIds={selected}
          products={products}
          onClose={() => setShowBulk(false)}
          onSuccess={() => {
            clearSelected()
            startTransition(() => router.refresh())
          }}
        />
      )}

      {/* Search + status bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search products…"
            defaultValue={filters.search}
            onChange={e => pushFilters({ search: e.target.value, page: 1 })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          />
        </div>
        {isPending && <RefreshCw size={14} className="text-muted animate-spin" />}

        {/* Active filter badge */}
        {filters.filter && (
          <button
            onClick={() => pushFilters({ filter: '', page: 1 })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand/10 border border-brand/40 text-xs font-semibold text-brand hover:bg-brand/20 transition-all"
          >
            {filters.filter.replace('_', ' ')} ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border bg-surface-3/30">
          <div className="col-span-1 flex items-center">
            <button
              onClick={allSelected ? clearSelected : selectAll}
              className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                allSelected ? 'bg-brand border-brand' : 'border-border hover:border-brand',
              )}
            >
              {allSelected && <span className="text-white text-[10px] font-bold">✓</span>}
            </button>
          </div>
          {['Product', 'Status', 'Stock Level', 'Qty', ''].map((h, i) => (
            <span key={i} className={cn(
              'text-[10px] font-bold uppercase tracking-wide text-muted',
              i === 0 && 'col-span-4',
              i === 1 && 'col-span-2 hidden sm:block',
              i === 2 && 'col-span-2 hidden md:block',
              i === 3 && 'col-span-2 text-right',
              i === 4 && 'col-span-1',
            )}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center px-5 py-4 border-b border-border last:border-0">
              <div className="col-span-1"><div className="w-4 h-4 rounded bg-surface-3 animate-pulse" /></div>
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-3 animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 bg-surface-3 rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-surface-3 rounded animate-pulse" />
                </div>
              </div>
              <div className="col-span-2 hidden sm:block"><div className="h-5 w-20 bg-surface-3 rounded-full animate-pulse" /></div>
              <div className="col-span-2 hidden md:block"><div className="h-2 bg-surface-3 rounded-full animate-pulse" /></div>
              <div className="col-span-2 flex justify-end"><div className="h-9 w-20 bg-surface-3 rounded-xl animate-pulse" /></div>
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={40} className="text-muted/20 mx-auto mb-4" />
            <p className="text-sm font-semibold text-primary">
              {filters.filter || filters.search ? 'No products match your filter' : 'No tracked products yet'}
            </p>
            <p className="text-xs text-muted mt-1">
              {!filters.filter && !filters.search && 'Products with inventory tracking enabled will appear here'}
            </p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="grid grid-cols-12 gap-0 border-b border-border last:border-0">
              {/* Checkbox column */}
              <div className="col-span-1 flex items-center px-5 py-4">
                <button
                  onClick={() => toggleSelect(product.id)}
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0',
                    selected.includes(product.id) ? 'bg-brand border-brand' : 'border-border hover:border-brand',
                  )}
                >
                  {selected.includes(product.id) && (
                    <span className="text-white text-[10px] font-bold leading-none">✓</span>
                  )}
                </button>
              </div>
              {/* Row content — spans remaining 11 cols */}
              <div className="col-span-11">
                <InventoryRow
                  product={product}
                  onUpdate={(id, patch) => {
                    // Optimistically handled by useRealtimeInventory
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pushFilters({ page: page - 1 })}
              disabled={page <= 1 || isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-secondary hover:bg-surface-3 disabled:opacity-40 transition-all font-bold"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs font-semibold text-secondary px-2 tabular-nums">{page} / {totalPages}</span>
            <button
              onClick={() => pushFilters({ page: page + 1 })}
              disabled={page >= totalPages || isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-secondary hover:bg-surface-3 disabled:opacity-40 transition-all font-bold"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}