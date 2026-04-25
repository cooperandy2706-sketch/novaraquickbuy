'use client'
// FILE: src/components/vendor/orders/OrderRow.jsx

import Link    from 'next/link'
import { Package, ArrowRight, Clock } from 'lucide-react'
import OrderStatusBadge from '@/components/vendor/orders/OrderStatusBadge'
import { cn }           from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

export default function OrderRow({ order }) {
  const currency = useLocaleStore(s => s.currency)
  const firstItem   = order.order_items?.[0]
  const itemCount   = order.order_items?.length ?? 0
  const productName = firstItem?.product?.name ?? 'Order'
  const imageUrl    = firstItem?.product?.thumbnail_url
  const buyer       = order.buyer
  const isUrgent    = order.status === 'pending'
  const isDisputed  = order.status === 'disputed'

  const disputeEnds = order.dispute_window_ends
  const hoursLeft   = disputeEnds
    ? Math.max(0, Math.round((new Date(disputeEnds) - Date.now()) / 3600000))
    : null

  return (
    <Link
      href={`/vendor/orders/${order.id}`}
      className={cn(
        'block bg-surface-2 sm:rounded-2xl border-b sm:border border-border p-4 hover:border-brand/40 transition-all group active:scale-[0.98]',
        isUrgent   && 'bg-amber-500/5 border-amber-500/20',
        isDisputed && 'bg-red-500/5 border-red-500/20',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Product image */}
        <div className="w-16 h-16 rounded-xl bg-surface-3 border border-border/50 overflow-hidden shrink-0 relative">
          {imageUrl
            ? <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-muted"><Package size={20} /></div>
          }
          {itemCount > 1 && (
            <div className="absolute bottom-0 right-0 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-tl-lg rounded-br-xl">
              +{itemCount - 1}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-16">
          {/* Top Row: Title & Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary truncate leading-tight">
                {productName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted font-mono uppercase">#{order.id.slice(0, 8)}</span>
                <span className="text-[10px] text-muted/50">•</span>
                <span className="text-[10px] text-muted">{new Date(order.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
            <div className="shrink-0">
              <OrderStatusBadge status={order.status} />
            </div>
          </div>

          {/* Bottom Row: Buyer & Price */}
          <div className="flex items-end justify-between mt-auto">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <div className="w-5 h-5 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-black text-brand">{buyer?.full_name?.charAt(0) ?? 'B'}</span>
              </div>
              <span className="text-xs font-semibold text-secondary truncate">{buyer?.full_name ?? 'Buyer'}</span>
            </div>
            
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-primary tabular-nums leading-none">
                {formatCurrency(order.total_amount ?? 0, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dispute window countdown */}
      {hoursLeft !== null && hoursLeft <= 48 && order.status === 'delivered' && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
          <Clock size={14} className="animate-pulse" /> {hoursLeft} hours left to release funds
        </div>
      )}
    </Link>
  )
}