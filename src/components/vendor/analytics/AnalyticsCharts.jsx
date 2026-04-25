'use client'
// FILE: src/components/vendor/analytics/AnalyticsCharts.jsx

import { useState } from 'react'
import { cn }       from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

// ── Tiny pure-CSS line chart ───────────────────────────────────────────────────
function LineChart({ data = [], color = '#6366f1', label, currency, suffix = '' }) {
  const [hovered, setHovered] = useState(null)
  if (!data.length) return null

  const max    = Math.max(...data.map(d => d.value), 1)
  const min    = 0
  const H      = 120
  const W      = 100  // percentage-based
  const pts    = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: H - ((d.value - min) / (max - min)) * H,
    ...d,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area     = `0,${H} ${polyline} 100,${H}`

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: '120px' }}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Area fill */}
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#grad-${label})`} />
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover dots */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill={color}
            stroke="white"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
            onMouseEnter={() => setHovered(i)}
            style={{ pointerEvents: 'all' }}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && pts[hovered] && (
        <div
          className="absolute bottom-full mb-2 bg-surface-3 border border-border text-primary text-[10px] rounded-lg px-2.5 py-1.5 pointer-events-none whitespace-nowrap shadow-xl z-10"
          style={{ left: `${pts[hovered].x}%`, transform: 'translateX(-50%)' }}
        >
          <p className="font-bold">{currency ? formatCurrency(pts[hovered].value, currency) : pts[hovered].value.toLocaleString()}{suffix}</p>
          <p className="text-muted text-[9px] mt-0.5">{pts[hovered].label}</p>
        </div>
      )}

      {/* X labels — show every nth */}
      <div className="flex justify-between mt-3 px-1">
        {data.filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1).map((d, i) => (
          <span key={i} className="text-[10px] text-muted font-bold uppercase tracking-wider opacity-60">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

// ── Bar chart ──────────────────────────────────────────────────────────────────
function BarChart({ data = [], color = 'bg-brand-400', hoverColor = 'bg-brand', prefix = '', suffix = '' }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="relative">
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => {
          const pct    = (d.value / max) * 100
          const isHov  = hovered === i
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-pointer group relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHov && d.value > 0 && (
                <div className="absolute bottom-full mb-2 bg-surface-3 border border-border text-primary text-[10px] rounded-lg px-2.5 py-1.5 pointer-events-none whitespace-nowrap z-20 shadow-xl"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}>
                  <p className="font-bold">{prefix}{d.value.toLocaleString()}{suffix}</p>
                  <p className="text-muted text-[9px] mt-0.5">{d.label}</p>
                </div>
              )}
              <div
                className={cn(
                  'w-full rounded-t-md transition-all duration-150',
                  isHov ? hoverColor : color,
                  d.value === 0 && 'opacity-30',
                )}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2">
        {data.filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1).map((d, i) => (
          <span key={i} className="text-[10px] text-neutral-400">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

function ChartCard({ id, title, sub, children, loading }) {
  return (
    <div id={id} className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden transition-all">
      <div className="px-6 py-4 border-b border-border bg-surface-3/30">
        <h3 className="font-bold text-primary text-sm">{title}</h3>
        {sub && <p className="text-xs text-muted mt-0.5 font-medium">{sub}</p>}
      </div>
      <div className="p-6">
        {loading
          ? <div className="h-32 bg-surface-3 animate-pulse rounded-xl" />
          : children
        }
      </div>
    </div>
  )
}

export default function AnalyticsCharts({ revenueSeries, viewsSeries, followerSeries, statusCounts, loading }) {
  const currency = useLocaleStore(s => s.currency)

  // Order funnel data
  const funnelStages = [
    { label: 'Pending',    key: 'pending',          color: 'bg-amber-400'   },
    { label: 'Accepted',   key: 'vendor_accepted',  color: 'bg-blue-400'    },
    { label: 'Preparing',  key: 'preparing',        color: 'bg-violet-400'  },
    { label: 'Shipped',    key: 'shipped',          color: 'bg-sky-400'     },
    { label: 'Delivered',  key: 'delivered',        color: 'bg-emerald-400' },
    { label: 'Completed',  key: 'completed',        color: 'bg-emerald-600' },
    { label: 'Cancelled',  key: 'cancelled',        color: 'bg-neutral-300' },
    { label: 'Disputed',   key: 'disputed',         color: 'bg-red-400'     },
  ]
  const totalOrders = Object.values(statusCounts ?? {}).reduce((s, n) => s + n, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Revenue line chart */}
      <ChartCard id="revenue" title="Revenue Over Time" sub="Daily revenue for the selected period" loading={loading}>
        <LineChart data={revenueSeries ?? []} color="#10b981" currency={currency} label="revenue" />
      </ChartCard>

      {/* Video views bar chart */}
      <ChartCard id="videos" title="Video Views Over Time" sub="Daily video views" loading={loading}>
        <BarChart
          data={viewsSeries ?? []}
          color="bg-violet-300"
          hoverColor="bg-violet-500"
          label="views"
        />
      </ChartCard>

      {/* Follower growth line chart */}
      <ChartCard id="followers" title="Follower Growth" sub="New followers per day" loading={loading}>
        <LineChart data={followerSeries ?? []} color="#ec4899" label="followers" />
      </ChartCard>

      {/* Order status funnel */}
      <ChartCard id="orders" title="Order Status Breakdown" sub="Distribution across all order stages" loading={loading}>
        <div className="space-y-2.5">
          {funnelStages.map(stage => {
            const count = statusCounts?.[stage.key] ?? 0
            const pct   = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-muted w-24 shrink-0 uppercase tracking-widest">{stage.label}</span>
                <div className="flex-1 h-3 bg-surface-3 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700 shadow-sm', stage.color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-20 flex items-center justify-end gap-2 shrink-0">
                  <span className="text-xs font-bold text-primary tabular-nums">{count}</span>
                  <span className="text-[10px] text-muted font-bold tabular-nums opacity-60">{pct}%</span>
                </div>
              </div>
            )
          })}
          {totalOrders === 0 && (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm font-bold text-muted">No orders in this period</p>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  )
}