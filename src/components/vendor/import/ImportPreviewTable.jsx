'use client'
// FILE: src/components/vendor/import/ImportPreviewTable.jsx

import { Eye } from 'lucide-react'
import { cn }  from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

export default function ImportPreviewTable({ preview = [], headers = [] }) {
  const currency = useLocaleStore(s => s.currency)
  if (!preview.length) return null

  const displayFields = [
    'name', 'price', 'compare_at_price', 'sku',
    'stock_quantity', 'category', 'status', 'product_type',
  ].filter(f => preview.some(r => r[f] !== undefined && r[f] !== ''))

  const fmt = (key, val) => {
    if (val === undefined || val === '') return <span className="text-muted/40">—</span>
    if (key === 'price' || key === 'compare_at_price' || key === 'cost_per_item') {
      return <span className="font-bold tabular-nums text-primary">{formatCurrency(val ?? 0, currency)}</span>
    }
    if (key === 'stock_quantity') {
      const n = Number(val)
      return (
        <span className={cn(
          'font-semibold tabular-nums',
          n === 0 ? 'text-danger' : n <= 5 ? 'text-amber-600' : 'text-emerald-700',
        )}>
          {n}
        </span>
      )
    }
    if (key === 'status') {
      return (
        <span className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize',
          val === 'active'   ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
          val === 'archived' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                               'bg-muted/10 text-muted border-border',
        )}>
          {val}
        </span>
      )
    }
    return <span className="truncate max-w-[160px] block" title={val}>{val}</span>
  }

  const LABELS = {
    name:             'Name',
    price:            'Price',
    compare_at_price: 'Compare-at',
    sku:              'SKU',
    stock_quantity:   'Stock',
    category:         'Category',
    status:           'Status',
    product_type:     'Type',
  }

  return (
    <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-surface-3/30">
        <Eye size={14} className="text-brand" />
        <h3 className="font-bold text-primary text-sm">
          Data Preview <span className="text-muted font-normal">(first {preview.length} rows)</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-3/50">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-muted w-8">#</th>
              {displayFields.map(f => (
                <th key={f} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-muted whitespace-nowrap">
                  {LABELS[f] ?? f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {preview.map((row, i) => (
              <tr key={i} className="hover:bg-surface-3/50 transition-colors">
                <td className="px-4 py-3 text-xs text-muted font-medium">{i + 2}</td>
                {displayFields.map(f => (
                  <td key={f} className="px-4 py-3 text-xs text-primary">
                    {fmt(f, row[f])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-border bg-surface-3/20">
        <p className="text-[11px] text-muted font-medium">
          Showing first {preview.length} rows. All {preview.length === 5 ? 'remaining' : ''} valid rows will be imported.
        </p>
      </div>
    </div>
  )
}