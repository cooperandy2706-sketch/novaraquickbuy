'use client'

import Link                              from 'next/link'
import { AlertTriangle, XCircle, ArrowRight, PackageSearch } from 'lucide-react'
import { cn }                            from '@/utils/cn'

export default function StockAlerts({ lowStock = 0, outOfStock = 0, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 space-y-4 opacity-50">
        <div className="h-4 w-32 bg-neutral-100 rounded-lg animate-pulse" />
        <div className="h-16 bg-neutral-100 rounded-2xl animate-pulse" />
        <div className="h-16 bg-neutral-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  const noIssues = lowStock === 0 && outOfStock === 0

  return (
    <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border bg-neutral-50/50 flex items-center justify-between">
        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest flex items-center gap-2">
          <PackageSearch size={14} className="text-brand" /> Stock Alerts
        </h3>
        <Link
          href="/vendor/inventory"
          className="text-[10px] font-black uppercase tracking-wider text-brand hover:text-brand-700 flex items-center gap-1"
        >
          Manage <ArrowRight size={10} strokeWidth={3} />
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {noIssues ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 shadow-sm">
              <PackageSearch size={24} className="text-emerald-500" />
            </div>
            <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">Stock Healthy</p>
            <p className="text-[10px] text-neutral-500 mt-1 font-bold uppercase tracking-widest">No issues detected</p>
          </div>
        ) : (
          <>
            {outOfStock > 0 && (
              <Link
                href="/vendor/inventory?filter=out_of_stock"
                className="flex items-center gap-4 p-4 bg-danger/5 border border-danger/20 rounded-2xl hover:bg-danger/10 transition-all duration-200 group active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:rotate-12">
                  <XCircle size={20} strokeWidth={2.5} className="text-danger" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-danger uppercase tracking-widest">{outOfStock} Out of Stock</p>
                  <p className="text-[10px] text-danger/70 mt-1 font-bold uppercase">Immediate Action Required</p>
                </div>
                <ArrowRight size={16} strokeWidth={3} className="text-danger/30 group-hover:text-danger transition-colors shrink-0" />
              </Link>
            )}

            {lowStock > 0 && (
              <Link
                href="/vendor/inventory?filter=low_stock"
                className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl hover:bg-amber-500/20 transition-all duration-200 group active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:-rotate-12">
                  <AlertTriangle size={20} strokeWidth={2.5} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{lowStock} Low Stock</p>
                  <p className="text-[10px] text-amber-600/70 mt-1 font-bold uppercase">Restock Soon</p>
                </div>
                <ArrowRight size={16} strokeWidth={3} className="text-amber-500/40 group-hover:text-amber-500 transition-colors shrink-0" />
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}