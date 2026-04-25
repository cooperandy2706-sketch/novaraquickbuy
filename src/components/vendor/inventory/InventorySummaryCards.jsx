'use client'
// FILE: src/components/vendor/inventory/InventorySummaryCards.jsx

import { Package, XCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/utils/cn'

const CARDS = [
  {
    key:    'total',
    label:  'Tracked Products',
    icon:   Package,
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    accent: 'border-l-blue-500',
  },
  {
    key:    'outOfStock',
    label:  'Out of Stock',
    icon:   XCircle,
    iconBg: 'bg-danger/10 text-danger',
    accent: 'border-l-danger',
    urgent: true,
  },
  {
    key:    'lowStock',
    label:  'Low Stock',
    icon:   AlertTriangle,
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    accent: 'border-l-amber-400',
  },
  {
    key:    'inStock',
    label:  'Healthy Stock',
    icon:   CheckCircle2,
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    accent: 'border-l-emerald-500',
  },
]

export default function InventorySummaryCards({ summary, loading, onFilterChange, activeFilter }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CARDS.map((_, i) => (
          <div key={i} className="bg-surface-2 rounded-2xl border border-border border-l-4 border-l-border p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-surface-3 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-7 w-12 bg-surface-3 rounded animate-pulse" />
              <div className="h-3 w-20 bg-surface-3 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const filterMap = {
    outOfStock: 'out_of_stock',
    lowStock:   'low_stock',
    inStock:    'in_stock',
    total:      '',
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {CARDS.map(card => {
        const Icon     = card.icon
        const value    = summary?.[card.key] ?? 0
        const filter   = filterMap[card.key]
        const isActive = activeFilter === filter

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onFilterChange(isActive ? '' : filter)}
            className={cn(
              'w-full text-left bg-surface-2 rounded-2xl border border-border shadow-sm p-4 sm:p-5',
              'flex flex-col gap-3 border-l-4 transition-all duration-200 relative overflow-hidden group',
              card.accent,
              'hover:shadow-md hover:-translate-y-0.5 active:scale-95',
              isActive && 'ring-2 ring-brand border-l-transparent shadow-md -translate-y-0.5',
              card.urgent && value > 0 && 'animate-pulse-slow',
            )}
          >
            {isActive && (
              <div className="absolute top-0 right-0 p-1.5">
                <div className="bg-brand text-white rounded-full p-0.5">
                  <X size={10} strokeWidth={3} />
                </div>
              </div>
            )}
            
            <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', card.iconBg)}>
              <Icon size={18} strokeWidth={2} />
            </div>
            
            <div>
              <p className="text-xl sm:text-2xl font-black text-primary tabular-nums leading-none tracking-tight">{value}</p>
              <p className="text-[10px] sm:text-xs text-muted font-bold mt-1 uppercase tracking-wider">{card.label}</p>
            </div>

            {isActive && (
              <div className="absolute inset-0 bg-brand/5 pointer-events-none" />
            )}
          </button>
        )
      })}
    </div>
  )
}