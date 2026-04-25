'use client'

import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

export default function RevenueChart({ data = [], loading }) {
  const currency = useLocaleStore(s => s.currency);
  const [hovered, setHovered] = useState(null)

  const max     = Math.max(...data.map(d => d.total), 1)
  const total   = data.reduce((s, d) => s + d.total, 0)
  const hasData = data.some(d => d.total > 0)

  if (loading) {
    return (
      <div className="flex items-end gap-2 h-40 opacity-50">
        {[60, 80, 45, 100, 70, 55, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-neutral-100 rounded-2xl animate-pulse" style={{ height: `${h}%` }} />
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Header Info */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-3xl font-black text-neutral-900 tracking-tight tabular-nums">
            {formatCurrency(total, currency)}
          </p>
          <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mt-1">Total Revenue (7D)</p>
        </div>
        {hovered !== null && data[hovered] && (
          <div className="text-right animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-[10px] font-black text-brand uppercase tracking-widest">{data[hovered].label}</p>
            <p className="text-lg font-black text-neutral-900 tabular-nums leading-tight">
              {formatCurrency(data[hovered].total, currency)}
            </p>
          </div>
        )}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2.5 h-44 relative group/chart">
        {/* Gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50">
          {[100, 75, 50, 25, 0].map(pct => (
            <div key={pct} className="border-t border-neutral-100 w-full" />
          ))}
        </div>

        {data.map((d, i) => {
          const pct    = max > 0 ? (d.total / max) * 100 : 0
          const isHov  = hovered === i
          const hasVal = d.total > 0

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-3 h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={cn(
                  'w-full rounded-full transition-all duration-500 ease-out relative',
                  hasVal
                    ? isHov
                      ? 'bg-brand shadow-xl shadow-brand/40 scale-x-110'
                      : 'bg-brand/20 group-hover:bg-brand/40'
                    : 'bg-neutral-50',
                )}
                style={{ height: hasVal ? `${Math.max(pct, 8)}%` : '8%' }}
              >
                {/* Value tooltip on mobile or hover */}
                {isHov && hasVal && (
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap shadow-xl z-20">
                      {formatCurrency(d.total, currency)}
                   </div>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-black uppercase tracking-tighter transition-colors',
                isHov ? 'text-brand' : 'text-neutral-400',
              )}>
                {d.label.substring(0, 3)}
              </span>
            </div>
          )
        })}
      </div>

      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-[11px] font-black uppercase tracking-widest text-neutral-300">No activity yet</p>
        </div>
      )}
    </div>
  )
}