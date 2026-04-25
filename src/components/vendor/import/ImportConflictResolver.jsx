'use client'
// FILE: src/components/vendor/import/ImportConflictResolver.jsx

import { useState } from 'react'
import {
  RefreshCw, SkipForward, CheckCircle2,
  AlertTriangle, Package, ArrowRight,
  ToggleLeft, ToggleRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

// conflicts: [{ sku, name, existingProduct: { name, price, updated_at }, incomingRow: { name, price, ... } }]

export default function ImportConflictResolver({ conflicts = [], onResolved, onBack }) {
  const currency = useLocaleStore(s => s.currency)
  const [decisions, setDecisions] = useState(
    Object.fromEntries(conflicts.map(c => [c.sku, 'update']))
  )
  const [applyAll, setApplyAll] = useState(null) // 'update' | 'skip' | null

  const setDecision = (sku, action) => {
    setDecisions(d => ({ ...d, [sku]: action }))
    setApplyAll(null)
  }

  const handleApplyAll = (action) => {
    setApplyAll(action)
    setDecisions(Object.fromEntries(conflicts.map(c => [c.sku, action])))
  }

  const updateCount = Object.values(decisions).filter(d => d === 'update').length
  const skipCount   = Object.values(decisions).filter(d => d === 'skip').length

  const handleConfirm = () => {
    onResolved(decisions)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 shadow-sm">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-600">
            {conflicts.length} product{conflicts.length !== 1 ? 's' : ''} already exist in your store
          </p>
          <p className="text-xs text-amber-600/80 mt-0.5 font-medium">
            These SKUs match existing products. Choose what to do with each one.
          </p>
        </div>
      </div>

      {/* Apply all shortcut */}
      <div className="flex items-center gap-3 bg-surface-2 rounded-xl border border-border px-4 py-3 shadow-sm">
        <p className="text-[10px] font-black text-muted uppercase tracking-widest flex-1 opacity-60">Apply same action to all:</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleApplyAll('update')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              applyAll === 'update'
                ? 'bg-brand text-white shadow-sm'
                : 'border border-border text-primary hover:border-brand hover:text-brand bg-surface-3',
            )}
          >
            <RefreshCw size={12} /> Update all
          </button>
          <button
            onClick={() => handleApplyAll('skip')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              applyAll === 'skip'
                ? 'bg-primary text-surface-1 shadow-sm'
                : 'border border-border text-primary hover:border-primary hover:text-primary bg-surface-3',
            )}
          >
            <SkipForward size={12} /> Skip all
          </button>
        </div>
      </div>

      {/* Per-row conflict cards */}
      <div className="space-y-3">
        {conflicts.map((conflict, i) => {
          const decision  = decisions[conflict.sku]
          const isUpdate  = decision === 'update'

          const existingPrice  = conflict.existingProduct?.price
          const incomingPrice  = conflict.incomingRow?.price
          const priceChanged   = existingPrice !== undefined && incomingPrice !== undefined && Number(existingPrice) !== Number(incomingPrice)

          const existingStock  = conflict.existingProduct?.stock_quantity
          const incomingStock  = conflict.incomingRow?.stock_quantity
          const stockChanged   = existingStock !== undefined && incomingStock !== undefined && Number(existingStock) !== Number(incomingStock)

          return (
            <div
              key={conflict.sku}
              className={cn(
                'bg-surface-2 rounded-2xl border-2 shadow-sm overflow-hidden transition-all',
                isUpdate ? 'border-brand' : 'border-border opacity-75',
              )}
            >
              {/* Card header */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-surface-3/10">
                <div className="w-10 h-10 rounded-xl bg-surface-3 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {conflict.existingProduct?.thumbnail_url
                    ? <img src={conflict.existingProduct.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    : <Package size={16} className="text-muted/30" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-800 truncate">
                    {conflict.existingProduct?.name ?? conflict.incomingRow?.name}
                  </p>
                  <p className="text-xs font-mono text-muted mt-0.5">SKU: {conflict.sku}</p>
                </div>
                <span className="text-xs text-muted shrink-0">#{i + 1} of {conflicts.length}</span>
              </div>

              {/* Diff table */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-3 gap-0 text-xs border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-surface-3 px-3 py-2 font-bold text-muted uppercase tracking-wide text-[10px]">Field</div>
                  <div className="bg-surface-3 px-3 py-2 font-bold text-secondary uppercase tracking-wide text-[10px] border-l border-border">Current</div>
                  <div className="bg-surface-3 px-3 py-2 font-bold text-brand uppercase tracking-wide text-[10px] border-l border-border">In File</div>

                  {/* Name */}
                  {conflict.existingProduct?.name !== conflict.incomingRow?.name && (
                    <>
                      <div className="px-3 py-2.5 border-t border-border text-muted font-bold">Name</div>
                      <div className="px-3 py-2.5 border-t border-l border-border text-secondary truncate">{conflict.existingProduct?.name}</div>
                      <div className="px-3 py-2.5 border-t border-l border-border text-brand font-bold truncate">{conflict.incomingRow?.name}</div>
                    </>
                  )}

                  {/* Price */}
                  {priceChanged && (
                    <>
                      <div className="px-3 py-2.5 border-t border-border text-muted">Price</div>
                      <div className="px-3 py-2.5 border-t border-l border-border text-secondary">{formatCurrency(existingPrice ?? 0, currency)}</div>
                      <div className={cn(
                        'px-3 py-2.5 border-t border-l border-border font-bold',
                        Number(incomingPrice) < Number(existingPrice) ? 'text-emerald-600' : 'text-orange-600',
                      )}>
                        {formatCurrency(incomingPrice ?? 0, currency)}
                        <span className="text-[10px] ml-1 font-normal">
                          {Number(incomingPrice) < Number(existingPrice) ? '↓' : '↑'}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Stock */}
                  {stockChanged && (
                    <>
                      <div className="px-3 py-2.5 border-t border-border text-muted font-bold">Stock</div>
                      <div className="px-3 py-2.5 border-t border-l border-border text-secondary">{existingStock}</div>
                      <div className="px-3 py-2.5 border-t border-l border-border text-brand font-black">{incomingStock}</div>
                    </>
                  )}

                  {/* No changes */}
                  {!priceChanged && !stockChanged && conflict.existingProduct?.name === conflict.incomingRow?.name && (
                    <>
                      <div className="px-3 py-2.5 border-t border-border col-span-3 text-center text-muted italic">
                        No field differences detected
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Decision toggle */}
              <div className="px-5 pb-4 flex items-center gap-3">
                <button
                  onClick={() => setDecision(conflict.sku, 'update')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-bold transition-all',
                    isUpdate
                      ? 'border-brand bg-brand text-white shadow-sm'
                      : 'border-border bg-surface-3 text-muted hover:border-brand hover:text-brand',
                  )}
                >
                  <RefreshCw size={13} />
                  Update existing
                </button>
                <button
                  onClick={() => setDecision(conflict.sku, 'skip')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-bold transition-all',
                    !isUpdate
                      ? 'border-primary bg-primary text-surface-1 shadow-sm'
                      : 'border-border bg-surface-3 text-muted hover:border-primary hover:text-primary',
                  )}
                >
                  <SkipForward size={13} />
                  Skip — keep current
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary + confirm */}
      <div className="bg-surface-2 rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-brand">
              <RefreshCw size={13} /> {updateCount} to update
            </span>
            <span className="flex items-center gap-1.5 font-bold text-muted">
              <SkipForward size={13} /> {skipCount} to skip
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-5 py-3 rounded-xl border border-border text-sm font-bold text-secondary hover:bg-surface-3 transition-all"
          >
            ← Back
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-brand active:scale-[0.98]"
          >
            Confirm & Continue <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}