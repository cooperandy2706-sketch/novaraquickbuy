'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function StatCard({
  label,
  value,
  growth,        // number string e.g. "12.4" or null
  growthLabel,   // e.g. "vs last month"
  icon: Icon,
  iconBg,        // tailwind classes e.g. "bg-blue-50 text-blue-600"
  accent,        // border color e.g. "border-l-blue-500"
  badge,         // { label, color } e.g. { label: '3 low stock', color: 'text-amber-600 bg-amber-50' }
  onClick,
  loading,
}) {
  const growthNum = growth !== null && growth !== undefined ? parseFloat(growth) : null
  const isPos     = growthNum > 0
  const isNeg     = growthNum < 0
  const isFlat    = growthNum === 0

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group w-full text-left bg-surface-2 rounded-3xl border border-border shadow-sm',
        'p-5 flex flex-col gap-4 transition-all duration-300',
        'relative overflow-hidden',
        onClick && 'hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 active:scale-[0.98] cursor-pointer',
        !onClick && 'cursor-default',
      )}
    >
      {/* Background Accent Gradient */}
      <div className={cn(
        'absolute top-0 left-0 w-1 h-full opacity-60',
        accent?.replace('border-l-', 'bg-') ?? 'bg-border'
      )} />

      <div className="flex items-start justify-between gap-3 relative z-10">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300',
          iconBg ?? 'bg-surface-3 text-secondary',
        )}>
          {loading
            ? <span className="w-5 h-5 rounded-full bg-current opacity-20 animate-pulse" />
            : Icon && <Icon size={22} strokeWidth={2} />
          }
        </div>

        {/* Badge */}
        {badge && !loading && (
          <span className={cn('text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl shrink-0 shadow-sm', badge.color)}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="relative z-10 flex flex-col justify-end flex-1">
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-28 bg-surface-3 rounded-xl animate-pulse" />
            <div className="h-3 w-20 bg-surface-3 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-1">
            <p className={cn(
              "font-black text-neutral-900 leading-none tracking-tighter tabular-nums break-words",
              value.length > 12 ? "text-lg" : value.length > 8 ? "text-xl" : "text-2xl"
            )}>
              {value}
            </p>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{label}</p>
          </div>
        )}
      </div>

      {/* Growth */}
      {growthNum !== null && !loading && (
        <div className="flex items-center gap-2 relative z-10 bg-surface-1/50 w-fit px-2 py-1 rounded-lg backdrop-blur-sm border border-border/50">
          {isPos  && <TrendingUp  size={14} className="text-emerald-500 shrink-0" />}
          {isNeg  && <TrendingDown size={14} className="text-danger shrink-0" />}
          {isFlat && <Minus size={14} className="text-muted shrink-0" />}
          <span className={cn(
            'text-[11px] font-black',
            isPos  && 'text-emerald-600',
            isNeg  && 'text-danger',
            isFlat && 'text-muted',
          )}>
            {isPos ? '+' : ''}{growthNum}%
          </span>
          {growthLabel && (
            <span className="text-[10px] font-bold text-neutral-400">{growthLabel}</span>
          )}
        </div>
      )}
    </button>
  )
}