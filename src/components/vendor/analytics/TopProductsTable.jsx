'use client'
// FILE: src/components/vendor/analytics/TopProductsTable.jsx

import Link              from 'next/link'
import { Package, ArrowRight, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

const RANK_STYLES = [
  'bg-amber-400 text-white shadow-sm',
  'bg-muted/30 text-muted font-black border border-border',
  'bg-orange-400 text-white shadow-sm',
]

export default function TopProductsTable({ products = [], loading }) {
  const currency = useLocaleStore(s => s.currency)
  const maxRev = Math.max(...products.map(p => p.totalRevenue ?? 0), 1)

  return (
    <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden transition-all">
      <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-neutral-50 bg-neutral-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-black text-brand-900 text-sm sm:text-base uppercase tracking-tight">Top Products</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Best performing items</p>
          </div>
        </div>
        <Link href="/vendor/products" className="px-4 py-2 bg-white border border-neutral-100 rounded-xl text-[10px] font-black text-brand hover:border-brand transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest">
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:grid grid-cols-12 gap-4 px-8 py-4 bg-neutral-50/50 border-b border-neutral-50">
        {['#', 'Product', 'Category', 'Sold', 'Revenue', 'Stock'].map((h, i) => (
          <span key={i} className={cn(
            'text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400',
            i === 0 && 'col-span-1',
            i === 1 && 'col-span-4',
            i === 2 && 'col-span-2',
            i === 3 && 'col-span-1 text-right',
            i === 4 && 'col-span-3 text-right',
            i === 5 && 'col-span-1 text-right',
          )}>
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-neutral-50">
        {loading
          ? Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 sm:px-8 py-5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-neutral-50 shrink-0" />
              <div className="w-12 h-12 rounded-2xl bg-neutral-50 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-neutral-50 rounded" />
                <div className="h-3 w-20 bg-neutral-50 rounded" />
              </div>
            </div>
          ))
          : products.length === 0
            ? (
              <div className="py-20 text-center px-6">
                <div className="w-20 h-20 rounded-[2.5rem] bg-neutral-50 flex items-center justify-center mx-auto mb-6 text-neutral-200">
                  <Package size={32} />
                </div>
                <p className="text-base font-black text-brand-900 uppercase tracking-tight">No sales data yet</p>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2 max-w-[200px] mx-auto opacity-60">Top products will appear once orders come in</p>
              </div>
            )
            : products.map((p, i) => {
              const revPct = (p.totalRevenue / maxRev) * 100
              const stockOk = p.stock_quantity > 5
              const stockLow = p.stock_quantity > 0 && p.stock_quantity <= 5
              const stockOut = p.stock_quantity === 0

              return (
                <Link
                  key={p.id}
                  href={`/vendor/products/${p.id}`}
                  className="block sm:grid sm:grid-cols-12 gap-4 items-center px-6 sm:px-8 py-5 sm:py-4 hover:bg-neutral-50/80 transition-all group"
                >
                  {/* Mobile Row: Rank + Product Image + Name + Stock */}
                  <div className="flex items-center gap-4 sm:col-span-5 min-w-0">
                    <div className="relative shrink-0">
                      <span className={cn(
                        'absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black z-10 shadow-lg border-2 border-white',
                        RANK_STYLES[i] ?? 'bg-white text-neutral-400 border-neutral-100 shadow-sm',
                      )}>
                        {i + 1}
                      </span>
                      <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-2xl bg-neutral-100 overflow-hidden border border-neutral-100 shadow-sm transition-transform group-hover:scale-105 duration-300">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-neutral-300"><Package size={20} /></div>
                        }
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-black text-brand-900 truncate group-hover:text-brand transition-colors tracking-tight">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{p.category ?? 'General'}</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-200" />
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-widest',
                          stockOk  && 'text-emerald-500',
                          stockLow && 'text-amber-500',
                          stockOut && 'text-rose-500',
                        )}>
                          {stockOut ? 'Out of Stock' : `${p.stock_quantity} left`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Only Fields */}
                  <div className="hidden sm:block sm:col-span-2">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-80">{p.category ?? '—'}</span>
                  </div>

                  <div className="hidden sm:block sm:col-span-1 text-right">
                    <span className="text-sm font-black text-brand-900 tabular-nums">{p.totalQty ?? 0}</span>
                  </div>

                  {/* Revenue Section (Optimized for both) */}
                  <div className="mt-4 sm:mt-0 sm:col-span-3">
                    <div className="flex items-center justify-between sm:justify-end gap-3 mb-1.5 sm:mb-0">
                      <div className="sm:hidden flex flex-col">
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Total Revenue</span>
                        <span className="text-sm font-black text-brand-900">{formatCurrency(p.totalRevenue ?? 0, currency)}</span>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-black text-brand-900 tabular-nums leading-none">
                          {formatCurrency(p.totalRevenue ?? 0, currency)}
                        </p>
                        <p className="text-[10px] font-bold text-neutral-400 mt-1 opacity-60">{p.totalQty ?? 0} sold</p>
                      </div>
                      <div className="sm:hidden">
                         <ArrowRight size={16} className="text-neutral-200 group-hover:text-brand transition-all translate-x-0 group-hover:translate-x-1" />
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden w-full">
                      <div className="h-full bg-brand rounded-full shadow-sm shadow-brand/20 transition-all duration-1000" style={{ width: `${revPct}%` }} />
                    </div>
                  </div>

                  {/* Desktop Only Stock */}
                  <div className="hidden sm:flex sm:col-span-1 justify-end">
                    <span className={cn(
                      'text-[10px] font-black px-2.5 py-1 rounded-xl border shadow-sm',
                      stockOk  && 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      stockLow && 'bg-amber-50 text-amber-600 border-amber-100',
                      stockOut && 'bg-rose-50 text-rose-600 border-rose-100',
                    )}>
                      {stockOut ? 'OUT' : p.stock_quantity}
                    </span>
                  </div>
                </Link>
              )
            })
        }
      </div>
    </div>
  )
}