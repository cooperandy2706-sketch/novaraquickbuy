'use client'
// FILE: src/components/vendor/orders/OrderStatusBadge.jsx

import { cn } from '@/utils/cn'

export const STATUS_CONFIG = {
  pending:          { label: 'Pending',          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',     dot: 'bg-amber-500',    step: 1 },
  vendor_accepted:  { label: 'Accepted',         color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',        dot: 'bg-blue-500',     step: 2 },
  preparing:        { label: 'Preparing',        color: 'bg-violet-500/10 text-violet-600 border-violet-500/20',  dot: 'bg-violet-500',   step: 3 },
  shipped:          { label: 'Shipped',          color: 'bg-sky-500/10 text-sky-600 border-sky-500/20',           dot: 'bg-sky-500',      step: 4 },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', dot: 'bg-orange-500',   step: 5 },
  delivered:        { label: 'Delivered',        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dot: 'bg-emerald-500', step: 6 },
  completed:        { label: 'Completed',        color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', dot: 'bg-emerald-600', step: 7 },
  cancelled:        { label: 'Cancelled',        color: 'bg-surface-3 text-muted border-border/50', dot: 'bg-muted', step: 0 },
  disputed:         { label: 'Disputed',         color: 'bg-red-500/10 text-red-600 border-red-500/20',           dot: 'bg-red-500',      step: 0 },
}

export const ESCROW_CONFIG = {
  held:       { label: 'Funds Held',     color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'    },
  releasing:  { label: 'Releasing Soon', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'       },
  released:   { label: 'Funds Released', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  refunded:   { label: 'Refunded',       color: 'bg-red-500/10 text-red-600 border-red-500/20'          },
}

export default function OrderStatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-semibold rounded-full border',
      size === 'sm'  && 'text-[11px] px-2.5 py-0.5',
      size === 'md'  && 'text-xs px-3 py-1',
      size === 'lg'  && 'text-sm px-4 py-1.5',
      cfg.color,
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  )
}