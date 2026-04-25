'use client'
// FILE: src/components/vendor/inventory/BulkStockEditor.jsx

import { useState }       from 'react'
import { RefreshCw, X, Save, PlusCircle, MinusCircle, Edit3 } from 'lucide-react'
import { bulkUpdateStock } from '@/lib/actions/inventory'
import { cn }              from '@/utils/cn'

const MODES = [
  { value: 'set',      label: 'Set to',    icon: Edit3,        desc: 'Replace with exact value' },
  { value: 'add',      label: 'Add',       icon: PlusCircle,   desc: 'Increase by amount' },
  { value: 'subtract', label: 'Subtract',  icon: MinusCircle,  desc: 'Decrease by amount' },
]

export default function BulkStockEditor({ selectedIds, products, onClose, onSuccess }) {
  const [mode,    setMode]    = useState('set')
  const [amount,  setAmount]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const selected = products.filter(p => selectedIds.includes(p.id))

  const preview = (currentQty) => {
    const n = Number(amount)
    if (!amount || isNaN(n)) return currentQty
    if (mode === 'set')      return n
    if (mode === 'add')      return currentQty + n
    if (mode === 'subtract') return Math.max(0, currentQty - n)
    return currentQty
  }

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      setError('Enter a valid amount')
      return
    }
    setLoading(true)
    setError(null)

    const updates = selected.map(p => ({
      id: p.id,
      stock_quantity: preview(p.stock_quantity),
    }))

    const res = await bulkUpdateStock(updates)
    setLoading(false)

    if (res?.error) { setError(res.error); return }
    onSuccess?.()
    onClose()
  }

  return (
    <div className="bg-surface-1 rounded-2xl border border-brand/40 shadow-2xl p-5 space-y-5 relative">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-primary">Bulk Stock Update</p>
          <p className="text-xs text-muted mt-0.5">
            Updating {selected.length} product{selected.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2">
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all',
              mode === m.value
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border text-muted hover:border-brand/40',
            )}
          >
            <m.icon size={16} />
            <span className="text-xs font-semibold">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-secondary">
          {mode === 'set' ? 'New stock quantity' : `Amount to ${mode}`}
        </label>
        <input
          type="number"
          min="0"
          placeholder="0"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError(null) }}
          className={cn(
            'w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-primary placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-center text-lg font-bold tabular-nums',
            error ? 'border-danger/50' : 'border-border',
          )}
        />
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
      </div>

      {/* Preview */}
      {amount && !isNaN(Number(amount)) && (
        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wide">Preview</p>
          {selected.map(p => {
            const next = preview(p.stock_quantity)
            const changed = next !== p.stock_quantity
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 text-xs py-1 border-b border-border/10 last:border-0 hover:bg-surface-3/30 transition-colors px-1">
                <span className="text-secondary truncate flex-1 font-medium">{p.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted/60 tabular-nums">{p.stock_quantity}</span>
                  <span className="text-muted/20">→</span>
                  <span className={cn(
                    'font-bold tabular-nums',
                    !changed     ? 'text-muted'   :
                    next === 0   ? 'text-danger'         :
                    next <= 5    ? 'text-warning'      : 'text-success',
                  )}>
                    {next}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-secondary hover:bg-surface-3 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !amount}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-hover disabled:opacity-50 transition-all"
        >
          {loading
            ? <RefreshCw size={14} className="animate-spin" />
            : <><Save size={14} /> Update {selected.length} Products</>
          }
        </button>
      </div>
    </div>
  )
}