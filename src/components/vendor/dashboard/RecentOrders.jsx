'use client'

import Link from 'next/link'
import { ArrowRight, Clock, CheckCircle2, Truck, Package, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

const STATUS_CONFIG = {
  pending:          { label: 'Pending',     color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',   icon: Clock,         dot: 'bg-amber-500'   },
  vendor_accepted:  { label: 'Accepted',    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',      icon: CheckCircle2,  dot: 'bg-blue-500'    },
  preparing:        { label: 'Preparing',   color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',icon: Package,       dot: 'bg-violet-500'  },
  shipped:          { label: 'Shipped',     color: 'bg-sky-500/10 text-sky-500 border-sky-500/20',         icon: Truck,         dot: 'bg-sky-500'     },
  out_for_delivery: { label: 'Out for Del.',color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',icon: Truck,         dot: 'bg-orange-500'  },
  delivered:        { label: 'Delivered',   color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2, dot: 'bg-emerald-500' },
  completed:        { label: 'Completed',   color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2, dot: 'bg-emerald-500' },
  cancelled:        { label: 'Cancelled',   color: 'bg-muted/10 text-muted border-muted/20', icon: XCircle,   dot: 'bg-muted'      },
  disputed:         { label: 'Disputed',    color: 'bg-danger/10 text-danger border-danger/20',    icon: AlertCircle,   dot: 'bg-danger'      },
}

function OrderRow({ order, loading, currency }) {
  if (loading) {
    return (
      <div className="flex items-center gap-4 py-3.5 border-b border-border last:border-0 opacity-50">
        <div className="w-10 h-10 rounded-xl bg-surface-3 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 bg-surface-3 rounded animate-pulse" />
          <div className="h-3 w-20 bg-surface-3 rounded animate-pulse" />
        </div>
        <div className="h-6 w-16 bg-surface-3 rounded-full animate-pulse" />
        <div className="h-4 w-14 bg-surface-3 rounded animate-pulse" />
      </div>
    )
  }

  const cfg       = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const StatusIcon= cfg.icon
  const firstItem = order.order_items?.[0]
  const itemCount = order.order_items?.length ?? 0
  const productName = firstItem?.product?.name ?? 'Order'
  const imageUrl    = firstItem?.product?.image_url

  return (
    <Link
      href={`/vendor/orders/${order.id}`}
      className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-border last:border-0 hover:bg-neutral-50/80 -mx-6 px-6 transition-all group active:scale-[0.99]"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Product thumbnail */}
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/50 shadow-sm transition-transform group-hover:scale-105">
          {imageUrl
            ? <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-neutral-400 bg-neutral-50"><Package size={20} strokeWidth={1.5} /></div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-neutral-900 truncate leading-tight">
            {productName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">
               #{order.id.split('-')[0]}
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-200" />
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">
              {new Date(order.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 pl-16 sm:pl-0 mt-1 sm:mt-0">
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className={cn('text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border shadow-sm transition-transform group-hover:scale-105', cfg.color)}>
            {cfg.label}
          </span>

          {/* Amount */}
          <p className="text-sm font-black text-neutral-900 tabular-nums">
            {formatCurrency(order.total_amount ?? 0, currency)}
          </p>
        </div>

        <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
          <ArrowRight size={14} strokeWidth={3} className="opacity-40 group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  )
}

export default function RecentOrders({ orders = [], loading }) {
  const currency = useLocaleStore(s => s.currency);
  const skeletons = [1, 2, 3, 4, 5]

  return (
    <div className="px-6 pb-6">
      {loading
        ? skeletons.map(i => <OrderRow key={i} loading currency={currency} />)
        : orders.length === 0
          ? (
            <div className="py-12 text-center">
              <Package size={32} className="text-neutral-200 mx-auto mb-3" />
              <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">No orders yet</p>
            </div>
          )
          : orders.map(o => <OrderRow key={o.id} order={o} currency={currency} />)
      }
    </div>
  )
}