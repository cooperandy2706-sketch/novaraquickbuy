'use client'
// FILE: src/components/vendor/inventory/InventoryRow.jsx

import { useState }   from 'react'
import Link           from 'next/link'
import {
  Package, ChevronDown, ChevronUp,
  AlertTriangle, XCircle, CheckCircle2,
  Edit2, Loader2,
} from 'lucide-react'
import { updateInventoryItem, updateVariantStock } from '@/lib/actions/inventory'
import { cn } from '@/utils/cn'

function StockBadge({ qty }) {
  if (qty === 0)   return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded-full">
      <XCircle size={10} /> Out of stock
    </span>
  )
  if (qty <= 5)    return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
      <AlertTriangle size={10} /> Low: {qty} left
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} /> {qty} in stock
    </span>
  )
}

function InlineStockEdit({ value, onSave, loading }) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(value)

  const save = async () => {
    if (Number(val) === value) { setEditing(false); return }
    await onSave(Number(val))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          className="w-24 sm:w-20 h-11 sm:h-9 text-base sm:text-sm text-right font-bold border-2 border-brand bg-surface-1 text-primary rounded-xl sm:rounded-lg px-3 sm:px-2 focus:outline-none focus:ring-4 focus:ring-brand/10 tabular-nums shadow-lg sm:shadow-none"
        />
        <div className="flex gap-1.5">
          <button
            onClick={save}
            disabled={loading}
            className="w-11 h-11 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-brand text-white flex items-center justify-center hover:bg-brand-700 active:scale-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <span className="text-sm font-black">✓</span>}
          </button>
          <button
            onClick={() => { setVal(value); setEditing(false) }}
            className="w-11 h-11 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg border border-border bg-surface-2 text-muted flex items-center justify-center hover:bg-surface-3 active:scale-90 transition-all text-sm font-bold"
          >✕</button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to edit stock"
      className={cn(
        'flex items-center justify-between sm:justify-start gap-4 sm:gap-2 px-4 py-3 sm:px-3 sm:py-1.5 rounded-2xl sm:rounded-xl border transition-all group hover:border-brand/60 hover:bg-brand/10 w-full sm:w-auto',
        value === 0 ? 'border-danger/30 bg-danger/5' : value <= 5 ? 'border-amber-500/20 bg-amber-500/10' : 'border-border bg-surface-3',
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-2xl sm:text-lg font-black tabular-nums',
          value === 0 ? 'text-danger' : value <= 5 ? 'text-amber-600' : 'text-primary',
        )}>
          {value}
        </span>
        <span className="text-[10px] sm:hidden font-black text-muted uppercase tracking-widest">Qty</span>
      </div>
      <Edit2 size={14} className="text-muted group-hover:text-brand transition-colors sm:w-[11px] sm:h-[11px]" />
    </button>
  )
}

export default function InventoryRow({ product, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [saving,   setSaving]   = useState(false)

  const hasVariants = product.variants?.length > 0

  const handleStockSave = async (stock_quantity) => {
    setSaving(true)
    await updateInventoryItem(product.id, { stock_quantity })
    onUpdate?.(product.id, { stock_quantity })
    setSaving(false)
  }

  const handleVariantStockSave = async (variantId, stock_quantity) => {
    setSaving(true)
    await updateVariantStock(variantId, stock_quantity)
    setSaving(false)
  }

  const handleThresholdSave = async (low_stock_threshold) => {
    await updateInventoryItem(product.id, { low_stock_threshold })
  }

  const stockPct = Math.min((product.stock_quantity / Math.max(product.stock_quantity + 10, 20)) * 100, 100)

  return (
    <div className={cn(
      'border-b border-border last:border-0 transition-colors',
      product.stock_quantity === 0 && 'bg-danger/5',
      product.stock_quantity > 0 && product.stock_quantity <= 5 && 'bg-amber-500/5',
    )}>
      {/* Main row */}
      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-start sm:items-center px-4 py-4 sm:px-5">

        {/* Product info */}
        <div className="w-full sm:col-span-5 flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-2xl sm:rounded-xl bg-surface-3 border border-border overflow-hidden shrink-0">
            {product.thumbnail_url
              ? <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-muted/20"><Package size={20} /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/vendor/products/${product.id}`}
              className="text-base sm:text-sm font-black text-primary hover:text-brand truncate block transition-colors leading-tight"
            >
              {product.name}
            </Link>
            <div className="flex items-center gap-2 mt-1 sm:mt-0.5 flex-wrap">
              {product.sku && (
                <span className="text-[10px] font-mono text-muted/60 bg-surface-3 px-1.5 py-0.5 rounded-md border border-border/50">
                  {product.sku}
                </span>
              )}
              <div className="sm:hidden">
                <StockBadge qty={product.stock_quantity} />
              </div>
              {hasVariants && (
                <span className="text-[10px] text-brand font-black uppercase tracking-wider">
                  {product.variants.length} variants
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stock badge (Desktop only) */}
        <div className="col-span-2 hidden sm:flex">
          <StockBadge qty={product.stock_quantity} />
        </div>

        {/* Stock bar (Tablet+) */}
        <div className="col-span-2 hidden md:block w-full">
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 shadow-sm',
                product.stock_quantity === 0 ? 'bg-danger' :
                product.stock_quantity <= 5  ? 'bg-amber-500' : 'bg-emerald-500',
              )}
              style={{ width: `${stockPct}%` }}
            />
          </div>
        </div>

        {/* Inline stock edit & Expand toggle */}
        <div className="w-full sm:col-span-3 flex items-center justify-between sm:justify-end gap-3">
          {hasVariants ? (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-xs font-black text-brand hover:text-brand-700 bg-brand/5 border border-brand/10 px-4 py-2.5 sm:px-0 sm:py-0 rounded-xl sm:rounded-none transition-all active:scale-95"
            >
              Manage Variants
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : (
            <div className="flex-1 sm:flex-none">
              <InlineStockEdit
                value={product.stock_quantity}
                onSave={handleStockSave}
                loading={saving}
              />
            </div>
          )}

          {hasVariants && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="hidden sm:flex w-8 h-8 rounded-xl border border-border items-center justify-center text-muted hover:text-brand hover:border-brand/40 transition-all"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Variant rows */}
      {expanded && hasVariants && (
        <div className="bg-surface-3/30 border-t border-border divide-y divide-border/50">
          {product.variants.map(variant => (
            <div key={variant.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center px-4 py-4 sm:px-5 sm:pl-16 hover:bg-surface-2 transition-colors">
              <div className="w-full sm:col-span-5 min-w-0">
                <p className="text-sm sm:text-xs font-black text-secondary truncate uppercase tracking-tight">{variant.name}</p>
                {variant.sku && (
                  <p className="text-[10px] font-mono text-muted/60 mt-1">SKU: {variant.sku}</p>
                )}
                <div className="mt-2 sm:hidden">
                  <StockBadge qty={variant.stock_quantity ?? 0} />
                </div>
              </div>
              <div className="col-span-2 hidden sm:flex">
                <StockBadge qty={variant.stock_quantity ?? 0} />
              </div>
              <div className="col-span-2 hidden md:block w-full">
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      (variant.stock_quantity ?? 0) === 0 ? 'bg-danger' :
                      (variant.stock_quantity ?? 0) <= 5  ? 'bg-amber-500' : 'bg-emerald-500',
                    )}
                    style={{ width: `${Math.min(((variant.stock_quantity ?? 0) / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="w-full sm:col-span-3 flex justify-end">
                <InlineStockEdit
                  value={variant.stock_quantity ?? 0}
                  onSave={(qty) => handleVariantStockSave(variant.id, qty)}
                  loading={saving}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}