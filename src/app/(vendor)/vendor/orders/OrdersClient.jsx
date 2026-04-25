'use client'
// FILE: src/app/(vendor)/vendor/orders/OrdersClient.jsx

import { useState, useTransition, useCallback } from 'react'
import { useRouter }      from 'next/navigation'
import { useAuth }        from '@/hooks/useAuth'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { Search, RefreshCw, Filter, ChevronLeft, ChevronRight, Package, Calendar } from 'lucide-react'
import OrderRow           from '@/components/vendor/orders/OrderRow'
import { cn }             from '@/utils/cn'

const STATUS_TABS = [
  { value: '',                label: 'All'          },
  { value: 'pending',         label: 'Pending'      },
  { value: 'vendor_accepted', label: 'Accepted'     },
  { value: 'preparing',       label: 'Preparing'    },
  { value: 'shipped',         label: 'Shipped'      },
  { value: 'delivered',       label: 'Delivered'    },
  { value: 'completed',       label: 'Completed'    },
  { value: 'disputed',        label: 'Disputed'     },
  { value: 'cancelled',       label: 'Cancelled'    },
]

export default function OrdersClient({ data: initialData, filters }) {
  const router                       = useRouter()
  const { vendor }                   = useAuth()
  const [isPending, startTransition] = useTransition()
  const [showDates, setShowDates]    = useState(!!(filters.dateFrom || filters.dateTo))

  const vendorId = vendor?.id ?? null
  const data     = useRealtimeOrders(initialData, vendorId)
  const orders   = data?.orders       ?? []
  const total    = data?.total        ?? 0
  const limit    = data?.limit        ?? 20
  const page     = data?.page         ?? 1
  const statusCounts = data?.statusCounts ?? {}
  const loading  = isPending || !data
  const totalPages = Math.ceil(total / limit)

  const pushFilters = useCallback((patch) => {
    const params = new URLSearchParams()
    const next   = { ...filters, ...patch }
    if (next.status)   params.set('status', next.status)
    if (next.search)   params.set('search', next.search)
    if (next.dateFrom) params.set('from',   next.dateFrom)
    if (next.dateTo)   params.set('to',     next.dateTo)
    if (next.page > 1) params.set('page',   next.page)
    startTransition(() => router.push(`/vendor/orders?${params.toString()}`))
  }, [filters])

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Orders</h1>
          <p className="text-sm text-muted mt-0.5 flex items-center gap-2">
            {total} order{total !== 1 ? 's' : ''}
            {vendorId && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Status tabs — scrollable on mobile edge-to-edge */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 w-max">
          {STATUS_TABS.map(tab => {
            const count = tab.value ? (statusCounts[tab.value] ?? 0) : total
            return (
              <button key={tab.value}
                onClick={() => pushFilters({ status: tab.value, page: 1 })}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border',
                  filters.status === tab.value
                    ? 'bg-brand text-white border-brand shadow-md shadow-brand/20'
                    : 'bg-surface-2 border-border text-secondary hover:border-brand/40 hover:text-brand',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                    filters.status === tab.value
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-3 text-secondary',
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Search + date filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID…"
            defaultValue={filters.search}
            onChange={e => pushFilters({ search: e.target.value, page: 1 })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          />
        </div>
        <button
          onClick={() => setShowDates(d => !d)}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all',
            showDates ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-surface-2 text-secondary hover:border-brand/40 hover:text-brand',
          )}
        >
          <Calendar size={14} /> Date Range
        </button>
        {isPending && <RefreshCw size={14} className="text-muted animate-spin" />}
      </div>

      {/* Date range pickers */}
      {showDates && (
        <div className="flex items-center gap-3 flex-wrap bg-surface-2 border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-secondary">From</label>
            <input type="date" value={filters.dateFrom}
              onChange={e => pushFilters({ dateFrom: e.target.value, page: 1 })}
              className="rounded-xl border border-border bg-surface-3 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all color-scheme-dark" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-secondary">To</label>
            <input type="date" value={filters.dateTo}
              onChange={e => pushFilters({ dateTo: e.target.value, page: 1 })}
              className="rounded-xl border border-border bg-surface-3 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all color-scheme-dark" />
          </div>
          {(filters.dateFrom || filters.dateTo) && (
            <button onClick={() => pushFilters({ dateFrom: '', dateTo: '', page: 1 })}
              className="text-xs font-semibold text-danger hover:text-danger/80 transition-colors">
              Clear dates
            </button>
          )}
        </div>
      )}

      {/* Orders List */}
      <div className="sm:bg-surface-2 sm:rounded-2xl sm:border border-border sm:shadow-sm sm:overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0 space-y-3 sm:space-y-0 pb-safe">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/50 bg-surface-2 rounded-2xl sm:rounded-none">
              <div className="w-16 h-16 rounded-xl bg-surface-3 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-surface-3 rounded animate-pulse" />
                <div className="h-3 w-28 bg-surface-3 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-surface-2 rounded-2xl border border-border mt-4">
            <Package size={40} className="text-muted/30 mx-auto mb-4" />
            <p className="text-sm font-bold text-muted">No orders found</p>
            <p className="text-xs text-muted/60 mt-1">
              {filters.status || filters.search ? 'Try adjusting your filters' : 'Your orders will appear here once buyers place them'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-0">
            {orders.map(order => <OrderRow key={order.id} order={order} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => pushFilters({ page: page - 1 })}
              disabled={page <= 1 || isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface-2 text-xs font-bold text-secondary hover:bg-surface-3 disabled:opacity-40 transition-all">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs font-bold text-secondary px-2">{page} / {totalPages}</span>
            <button onClick={() => pushFilters({ page: page + 1 })}
              disabled={page >= totalPages || isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface-2 text-xs font-bold text-secondary hover:bg-surface-3 disabled:opacity-40 transition-all">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}