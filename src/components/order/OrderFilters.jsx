'use client'
// FILE: src/components/order/OrderFilter.jsx
// Horizontal scrollable filter tabs for the orders list.
// Accepts an array of tab configs + live count map.

import { useRef } from 'react'
import { cn } from '@/utils/cn'

// ─────────────────────────────────────────────────────────────
// DEFAULT TABS
// Override by passing a `tabs` prop.
// ─────────────────────────────────────────────────────────────

export const DEFAULT_ORDER_TABS = [
  { key: 'all',       label: 'All Orders' },
  { key: 'active',    label: 'Active'     },
  { key: 'shipped',   label: 'Shipped'    },
  { key: 'delivered', label: 'Delivered'  },
  { key: 'completed', label: 'Completed'  },
  { key: 'cancelled', label: 'Cancelled'  },
]

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

/**
 * OrderFilter
 *
 * Props:
 *   active    string            — currently selected tab key
 *   onChange  fn                — (key) => void
 *   counts    Record<key,number> — live badge counts per tab
 *   tabs      array             — optional override for tab list
 */
export default function OrderFilter({
  active,
  onChange,
  counts = {},
  tabs   = DEFAULT_ORDER_TABS,
}) {
  const ref = useRef(null)

  return (
    <div
      ref={ref}
      className="flex gap-1.5 overflow-x-auto pb-0.5"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      <style jsx>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>

      {tabs.map(tab => {
        const on    = active === tab.key
        const count = counts[tab.key] ?? 0

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full',
              'text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0',
              on
                ? 'bg-brand text-white shadow-sm shadow-brand/30'
                : 'bg-white border border-neutral-200 text-neutral-500 hover:border-brand-200 hover:text-brand',
            )}
          >
            {tab.label}

            {count > 0 && (
              <span className={cn(
                'min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black',
                'flex items-center justify-center transition-all',
                on
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-100 text-neutral-500',
              )}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}