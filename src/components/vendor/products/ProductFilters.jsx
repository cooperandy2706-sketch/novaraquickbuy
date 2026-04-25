'use client'
// FILE: src/components/vendor/products/ProductFilters.jsx

import { cn } from '@/utils/cn'

const CATEGORIES = [
  'Fashion & Apparel', 'Electronics & Gadgets', 'Food & Groceries',
  'Beauty & Skincare', 'Home & Living', 'Sports & Fitness',
  'Books & Stationery', 'Automotive', 'Health & Wellness',
  'Kids & Toys', 'Art & Crafts', 'Other',
]

const TYPES = [
  { value: 'physical',  label: '📦 Physical'  },
  { value: 'digital',   label: '💾 Digital'   },
  { value: 'service',   label: '🛎 Service'   },
  { value: 'variable',  label: '🎨 Variable'  },
]

export default function ProductFilters({ filters, onChange }) {
  return (
    <div className="bg-surface-2 rounded-2xl border border-border shadow-sm p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-wide">Category</label>
          <select
            value={filters.category}
            onChange={e => onChange({ category: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface-3 px-3 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all appearance-none"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Product type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-wide">Product Type</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ type: filters.type === t.value ? '' : t.value })}
                className={cn(
                  'px-3 py-2 rounded-xl border text-xs font-semibold transition-all text-left',
                  filters.type === t.value
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border text-secondary hover:border-brand/40',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear filters */}
      {(filters.category || filters.type) && (
        <div className="flex justify-end">
          <button
            onClick={() => onChange({ category: '', type: '' })}
            className="text-xs font-semibold text-danger hover:text-danger/80 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}