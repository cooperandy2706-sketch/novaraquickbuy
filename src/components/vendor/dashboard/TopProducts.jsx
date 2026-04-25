'use client'

import Link                        from 'next/link'
import { ArrowRight, Package, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

function ProductRow({ item, rank, maxQty, loading, currency }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-border last:border-0 opacity-50">
        <div className="w-5 text-center">
          <div className="h-3.5 w-4 bg-surface-3 rounded animate-pulse mx-auto" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-surface-3 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-28 bg-surface-3 rounded animate-pulse" />
          <div className="h-2.5 w-16 bg-surface-3 rounded animate-pulse" />
        </div>
        <div className="h-4 w-10 bg-surface-3 rounded animate-pulse" />
      </div>
    )
  }

  const product  = item.product
  const qty      = item.quantity ?? 0
  const barWidth = maxQty > 0 ? (qty / maxQty) * 100 : 0

  const rankColors = [
    'text-amber-500',
    'text-muted',
    'text-orange-400',
    'text-muted',
    'text-muted',
  ]

  return (
    <Link
      href={`/vendor/products/${product?.id}`}
      className="flex items-center gap-3 py-3.5 border-b border-border last:border-0 hover:bg-surface-3/50 -mx-6 px-6 transition-colors group"
    >
      {/* Rank */}
      <span className={cn('text-sm font-bold w-5 text-center shrink-0', rankColors[rank] ?? 'text-muted')}>
        {rank + 1}
      </span>

      {/* Image */}
      <div className="w-10 h-10 rounded-xl bg-surface-3 overflow-hidden shrink-0 border border-border">
        {product?.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-muted"><Package size={14} /></div>
        }
      </div>

      {/* Info + bar */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary truncate">{product?.name ?? '—'}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand/40 rounded-full transition-all duration-500"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-[10px] text-muted font-medium shrink-0">{qty} sold</span>
        </div>
      </div>

      {/* Price */}
      <p className="text-sm font-bold text-primary tabular-nums shrink-0">
        {formatCurrency(product?.price ?? 0, currency)}
      </p>

      <ArrowRight size={13} className="text-muted group-hover:text-brand transition-colors shrink-0" />
    </Link>
  )
}

export default function TopProducts({ products = [], loading }) {
  const currency = useLocaleStore(s => s.currency);
  const skeletons = [1, 2, 3, 4, 5]
  const maxQty    = Math.max(...products.map(p => p.quantity ?? 0), 1)

  return (
    <div className="px-6 pb-6">
      {loading
        ? skeletons.map(i => <ProductRow key={i} rank={i - 1} loading currency={currency} />)
        : products.length === 0
          ? (
            <div className="py-12 text-center">
              <TrendingUp size={32} className="text-neutral-200 mx-auto mb-3" />
              <p className="text-sm font-black text-neutral-400 uppercase tracking-widest text-neutral-300">No data yet</p>
            </div>
          )
          : products.map((item, i) => (
              <ProductRow key={i} item={item} rank={i} maxQty={maxQty} currency={currency} />
            ))
      }
    </div>
  )
}