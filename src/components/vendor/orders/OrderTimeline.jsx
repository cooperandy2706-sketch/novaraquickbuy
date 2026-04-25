'use client'
// FILE: src/components/vendor/orders/OrderTimeline.jsx

import { STATUS_CONFIG } from '@/components/vendor/orders/OrderStatusBadge'
import { cn }            from '@/utils/cn'
import {
  Package, Truck, CheckCircle2, XCircle,
  AlertCircle, Clock, MessageSquare,
  ShieldCheck, DollarSign, Info,
} from 'lucide-react'

const EVENT_ICONS = {
  pending:          { icon: Clock,          color: 'bg-amber-500/10 text-amber-600'   },
  vendor_accepted:  { icon: CheckCircle2,   color: 'bg-blue-500/10 text-blue-600'     },
  preparing:        { icon: Package,        color: 'bg-violet-500/10 text-violet-600' },
  shipped:          { icon: Truck,          color: 'bg-sky-500/10 text-sky-600'       },
  out_for_delivery: { icon: Truck,          color: 'bg-orange-500/10 text-orange-600' },
  delivered:        { icon: CheckCircle2,   color: 'bg-emerald-500/10 text-emerald-600' },
  completed:        { icon: ShieldCheck,    color: 'bg-emerald-500/10 text-emerald-700' },
  cancelled:        { icon: XCircle,        color: 'bg-surface-3 text-muted' },
  disputed:         { icon: AlertCircle,    color: 'bg-red-500/10 text-red-600'       },
  default:          { icon: Info,           color: 'bg-surface-3 text-muted' },
}

export default function OrderTimeline({ history = [], loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-3 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3.5 w-32 bg-surface-3 rounded animate-pulse" />
              <div className="h-3 w-48 bg-surface-3 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!history.length) {
    return <p className="text-sm text-muted text-center py-6">No history yet</p>
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border/50" />

      <div className="space-y-5">
        {history.map((entry, i) => {
          const cfg  = EVENT_ICONS[entry.status ?? 'default'] ?? EVENT_ICONS.default
          const Icon = cfg.icon
          const isLast = i === history.length - 1

          return (
            <div key={entry.id ?? i} className="flex gap-4 relative">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-surface-2',
                cfg.color,
                isLast && 'ring-2 ring-offset-1 ring-brand/20 ring-offset-background',
              )}>
                <Icon size={14} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {entry.status && (
                      <p className="text-xs font-bold text-primary capitalize">
                        {STATUS_CONFIG[entry.status]?.label ?? entry.status.replace(/_/g, ' ')}
                      </p>
                    )}
                    {entry.note && (
                      <p className="text-xs text-secondary mt-0.5 leading-relaxed">{entry.note}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-muted shrink-0 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('en', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}