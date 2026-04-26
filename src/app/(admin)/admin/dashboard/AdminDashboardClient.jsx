'use client'
// FILE: src/app/(admin)/admin/dashboard/AdminDashboardClient.jsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter }    from 'next/navigation'
import Link             from 'next/link'
import {
  TrendingUp, TrendingDown, Users, ShoppingBag,
  BadgeCheck, Crown, AlertTriangle, DollarSign,
  Package, Video, ChevronRight, Clock,
  CheckCircle2, Activity, Globe, Wallet,
  BarChart3, ArrowUpRight, Zap, RefreshCw,
  MapPin, Star, Shield, Megaphone, Eye,
  Circle,
} from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import { cn }           from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}
function fmtMoney(n) {
  if (!n && n !== 0) return '$0'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `$${(n / 1000).toFixed(1)}K`
  return `$${Number(n).toFixed(0)}`
}
function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, subUp, icon: Icon, color, href, urgent, live }) {
  const inner = (
    <div className={cn(
      'bg-white shadow-sm border rounded-2xl p-5 transition-all group space-y-3',
      urgent
        ? 'border-danger/30 hover:border-danger/50'
        : 'border-neutral-200 hover:border-neutral-300',
    )}>
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <div className="flex items-center gap-1.5">
          {live && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          )}
          {href && <ArrowUpRight size={14} className="text-neutral-700 group-hover:text-neutral-500 transition-colors" />}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900 tabular-nums leading-tight">{value}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      </div>
      {sub && (
        <div className="flex items-center gap-1">
          {subUp === true  && <TrendingUp  size={11} className="text-emerald-500 shrink-0" />}
          {subUp === false && <TrendingDown size={11} className="text-danger shrink-0" />}
          <p className={cn('text-xs font-semibold',
            urgent ? 'text-danger'
            : subUp === true ? 'text-emerald-400'
            : subUp === false ? 'text-danger'
            : 'text-neutral-500')}>
            {sub}
          </p>
        </div>
      )}
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

// ── GMV bar chart ─────────────────────────────────────────────────────────────
function GmvChart({ data, liveRevenue }) {
  const adjusted = data.map((d, i) =>
    i === data.length - 1 ? { ...d, total: d.total + (liveRevenue ?? 0) } : d
  )
  const max = Math.max(...adjusted.map(d => d.total), 1)

  return (
    <div className="flex items-end gap-1.5 h-20">
      {adjusted.map((d, i) => {
        const pct     = Math.max(3, (d.total / max) * 100)
        const isToday = i === adjusted.length - 1
        return (
          <div key={d.date ?? i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-700 border border-neutral-600 text-neutral-900 text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              {fmtMoney(d.total)}
            </div>
            <div
              className={cn(
                'w-full rounded-t-lg transition-all duration-700',
                isToday ? 'bg-amber-500' : 'bg-neutral-700 group-hover:bg-amber-500/50',
              )}
              style={{ height: `${pct}%` }}
            />
            <span className={cn('text-[9px] font-semibold', isToday ? 'text-amber-400' : 'text-neutral-600')}>
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Hourly trend sparkline ────────────────────────────────────────────────────
function HourlyChart({ data }) {
  const max = Math.max(...data.map(d => d.orders), 1)
  // Show last 12 hours
  const slice = data.slice(-12)

  return (
    <div className="flex items-end gap-0.5 h-10">
      {slice.map((d, i) => {
        const pct     = Math.max(4, (d.orders / max) * 100)
        const isNow   = i === slice.length - 1
        return (
          <div key={i} className="flex-1 relative group">
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-neutral-700 text-neutral-900 text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {d.orders} orders
            </div>
            <div
              className={cn('w-full rounded-sm', isNow ? 'bg-emerald-500' : 'bg-neutral-700')}
              style={{ height: `${pct}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Growth chart (line-like bars, dual series) ────────────────────────────────
function GrowthChart({ data }) {
  const maxV = Math.max(...data.map(d => d.vendors), 1)
  const maxU = Math.max(...data.map(d => d.users), 1)
  const max  = Math.max(maxV, maxU, 1)

  return (
    <div className="flex items-end gap-2 h-16">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex items-end gap-0.5 group relative">
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-neutral-700 text-neutral-900 text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            +{d.vendors} vendors · +{d.users} users
          </div>
          <div className="flex-1 rounded-t-sm bg-amber-500/70 transition-all" style={{ height: `${Math.max(3, (d.vendors / max) * 100)}%` }} />
          <div className="flex-1 rounded-t-sm bg-blue-500/70 transition-all"  style={{ height: `${Math.max(3, (d.users   / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  )
}

// ── Country revenue bar ───────────────────────────────────────────────────────
function CountryRow({ country, revenue, max }) {
  const pct = Math.max(2, (revenue / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-700 font-medium flex items-center gap-1.5">
          <MapPin size={10} className="text-neutral-600 shrink-0" />{country}
        </span>
        <span className="text-neutral-900 font-bold tabular-nums">{fmtMoney(revenue)}</span>
      </div>
      <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    pending:         'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    active:          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    disputed:        'bg-danger/10 text-danger border-danger/20',
    cancelled:       'bg-neutral-700/40 text-neutral-500 border-neutral-300',
    delivered:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
    completed:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    preparing:       'bg-violet-500/10 text-violet-400 border-violet-500/20',
    vendor_accepted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    verified:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    unverified:      'bg-neutral-700/40 text-neutral-500 border-neutral-300',
  }[status] ?? 'bg-neutral-800 text-neutral-500 border-neutral-300'

  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize', cfg)}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, sub, icon: Icon, href, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-amber-500" />
          <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        </div>
        {sub && <p className="text-[10px] text-neutral-600 mt-0.5 ml-5">{sub}</p>}
      </div>
      {href && (
        <Link href={href}
          className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-amber-400 transition-colors">
          View all <ChevronRight size={12} />
        </Link>
      )}
      {action}
    </div>
  )
}

// ── Urgent action banner ──────────────────────────────────────────────────────
function UrgentBanner({ count, label, href, icon: Icon, color }) {
  if (!count || count <= 0) return null
  return (
    <Link href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors group',
        color,
      )}>
      <Icon size={15} className="shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-bold">{count}</span> {label}
      </p>
      <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboardClient({
  stats, byCountry, topVendors, hourly, subStats, growth,
}) {
  const router     = useRouter()
  const adminStore = useAdminStore()
  const [tab, setTab]           = useState('overview')
  const [refreshing, setRefresh] = useState(false)

  const { vendors, orders, revenue, users, subs, content, chart,
          recentVendors, recentOrders, recentPayments } = stats

  // Live patches from adminStore
  const liveRevenueToday = adminStore.revenueToday
  const liveNewOrders    = adminStore.newOrdersToday
  const liveActiveOrders = adminStore.activeOrders

  const handleRefresh = useCallback(() => {
    setRefresh(true)
    router.refresh()
    setTimeout(() => setRefresh(false), 1500)
  }, [router])

  const maxCountryRev = Math.max(...(byCountry.map(c => c.revenue)), 1)

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Platform Overview</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live pulse */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Live updates active
          </div>
          <button onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-300 text-neutral-700 hover:text-neutral-900 text-xs font-semibold transition-all">
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Urgent banners ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <UrgentBanner
          count={vendors.pendingVerification}
          label={`vendor${vendors.pendingVerification !== 1 ? 's' : ''} awaiting identity verification`}
          href="/admin/verifications"
          icon={BadgeCheck}
          color="bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/15"
        />
        <UrgentBanner
          count={subs.pending}
          label={`subscription payment${subs.pending !== 1 ? 's' : ''} awaiting verification`}
          href="/admin/subscriptions"
          icon={Crown}
          color="bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15"
        />
        <UrgentBanner
          count={orders.disputed}
          label={`order dispute${orders.disputed !== 1 ? 's' : ''} open — needs resolution`}
          href="/admin/disputes"
          icon={AlertTriangle}
          color="bg-danger/10 border-danger/20 text-red-300 hover:bg-danger/15"
        />
      </div>

      {/* ── Tab switcher ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 bg-white shadow-sm border border-neutral-200 rounded-xl p-1 w-fit">
        {[
          { id: 'overview',  label: 'Overview'  },
          { id: 'revenue',   label: 'Revenue'   },
          { id: 'vendors',   label: 'Vendors'   },
          { id: 'growth',    label: 'Growth'    },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
              tab === t.id
                ? 'bg-amber-500 text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700',
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-6">

          {/* KPI grid row 1 — Revenue */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="GMV (30d)"
              value={fmtMoney(revenue.gmv30d)}
              sub="Gross merchandise value"
              icon={DollarSign}
              color="bg-emerald-500/15 text-emerald-400"
              href="/admin/orders"
              live
            />
            <KpiCard
              label="Revenue Today"
              value={fmtMoney(liveRevenueToday ?? 0)}
              sub={`${fmtNum(liveNewOrders ?? 0)} new orders`}
              subUp={liveNewOrders > 0}
              icon={TrendingUp}
              color="bg-amber-500/15 text-amber-400"
              live
            />
            <KpiCard
              label="Escrow Held"
              value={fmtMoney(revenue.escrowTotal)}
              sub="Pending buyer confirmation"
              icon={Wallet}
              color="bg-blue-500/15 text-blue-400"
              href="/admin/orders"
            />
            <KpiCard
              label="Sub Revenue 30d"
              value={fmtMoney(revenue.subRev30d)}
              sub={`${subs.active} active plans`}
              icon={Crown}
              color="bg-violet-500/15 text-violet-400"
              href="/admin/subscriptions"
            />
          </div>

          {/* KPI grid row 2 — Platform */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Total Vendors"
              value={fmtNum(vendors.total)}
              sub={`+${vendors.new30d} this month`}
              subUp={vendors.new30d > 0}
              icon={Globe}
              color="bg-neutral-700/60 text-neutral-700"
              href="/admin/vendors"
            />
            <KpiCard
              label="Active Orders"
              value={fmtNum(liveActiveOrders ?? orders.pending)}
              sub={orders.disputed > 0 ? `${orders.disputed} disputed` : 'All clear'}
              subUp={orders.disputed > 0 ? false : undefined}
              icon={ShoppingBag}
              color="bg-blue-500/15 text-blue-400"
              href="/admin/orders"
              urgent={orders.disputed > 0}
              live
            />
            <KpiCard
              label="Total Buyers"
              value={fmtNum(users.total)}
              sub={`+${users.new7d} this week`}
              subUp={users.new7d > 0}
              icon={Users}
              color="bg-emerald-500/15 text-emerald-400"
            />
            <KpiCard
              label="Pending Verif."
              value={fmtNum(vendors.pendingVerification)}
              sub={vendors.pendingVerification > 0 ? 'Action required' : 'All verified'}
              icon={BadgeCheck}
              color="bg-amber-500/15 text-amber-400"
              href="/admin/verifications"
              urgent={vendors.pendingVerification > 0}
            />
          </div>

          {/* Chart row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* GMV 7-day */}
            <div className="lg:col-span-2 bg-white shadow-sm border border-neutral-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-neutral-900">7-Day GMV</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>Total: {fmtMoney(revenue.gmv30d)}</span>
                  <span className="text-amber-400 font-bold">Today live ↑</span>
                </div>
              </div>
              <GmvChart data={chart} liveRevenue={liveRevenueToday} />
            </div>

            {/* Platform health */}
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5 space-y-3">
              <SectionHeader title="Platform Health" icon={Activity} />
              {[
                { label: 'Vendor activation',  val: vendors.active,   total: vendors.total,              color: 'bg-emerald-500' },
                { label: 'Pro subscriptions',  val: subs.active,      total: vendors.active,             color: 'bg-amber-500'   },
                { label: 'Order fulfilment',   val: orders.pending,   total: Math.max(orders.total, 1),  color: 'bg-blue-500'    },
                { label: 'Content published',  val: content.products, total: Math.max(content.products, 1), color: 'bg-violet-500'  },
              ].map(r => {
                const pct = r.total > 0 ? Math.min(100, Math.round((r.val / r.total) * 100)) : 0
                return (
                  <div key={r.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">{r.label}</span>
                      <span className="text-neutral-900 font-bold tabular-nums">{fmtNum(r.val)}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-700', r.color)}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live activity feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Recent vendors */}
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5">
              <SectionHeader title="New Vendors" icon={Globe} href="/admin/vendors" />
              {recentVendors.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-8">No recent vendors</p>
              ) : (
                <div className="space-y-3">
                  {recentVendors.map(v => (
                    <Link key={v.id} href={`/admin/vendors/${v.id}`}
                      className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 overflow-hidden border border-neutral-300 shrink-0">
                        {v.store_logo_url
                          ? <img src={v.store_logo_url} alt={v.store_name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-bold">
                              {v.store_name?.charAt(0).toUpperCase()}
                            </div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-amber-300 transition-colors">
                          {v.store_name}
                        </p>
                        <p className="text-[10px] text-neutral-500">{v.business_country} · {timeAgo(v.created_at)}</p>
                      </div>
                      <StatusBadge status={v.verification_status ?? 'unverified'} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent orders */}
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5">
              <SectionHeader title="Recent Orders" icon={ShoppingBag} href="/admin/orders" />
              {recentOrders.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-8">No recent orders</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(o => (
                    <Link key={o.id} href={`/admin/orders/${o.id}`}
                      className="flex items-center gap-3 group">
                      <div className={cn(
                        'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0',
                        o.status === 'disputed'
                          ? 'bg-danger/10 border-danger/20'
                          : 'bg-neutral-800 border-neutral-300',
                      )}>
                        <ShoppingBag size={14} className={o.status === 'disputed' ? 'text-danger' : 'text-neutral-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-semibold text-neutral-700 group-hover:text-neutral-900 transition-colors">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">{o.vendor?.store_name} · {timeAgo(o.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-bold text-neutral-900">${o.total_amount?.toFixed(0)}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent sub payments */}
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5">
              <SectionHeader title="Subscription Payments" icon={Crown} href="/admin/subscriptions" />
              {recentPayments.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-8">No recent payments</p>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map(p => (
                    <Link key={p.id} href="/admin/subscriptions"
                      className="flex items-center gap-3 group">
                      <div className={cn(
                        'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0',
                        p.status === 'pending'
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/20',
                      )}>
                        {p.status === 'pending'
                          ? <Clock size={14} className="text-amber-400" />
                          : <CheckCircle2 size={14} className="text-emerald-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 truncate group-hover:text-amber-300 transition-colors">
                          {p.vendor?.store_name}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {p.plan === 'monthly' ? '1-month' : '6-month'} · {timeAgo(p.submitted_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right space-y-0.5">
                        <p className="text-xs font-bold text-neutral-900">{p.currency} {p.amount?.toFixed(0)}</p>
                        <StatusBadge status={p.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Verify Vendors',   sub: `${vendors.pendingVerification} waiting`, href: '/admin/verifications', Icon: BadgeCheck,    color: 'text-blue-400',    urgent: vendors.pendingVerification > 0    },
                { label: 'Approve Subs',     sub: `${subs.pending} pending`,               href: '/admin/subscriptions',  Icon: Crown,         color: 'text-amber-400',   urgent: subs.pending > 0                  },
                { label: 'Resolve Disputes', sub: `${orders.disputed} open`,               href: '/admin/disputes',       Icon: AlertTriangle, color: 'text-danger',      urgent: orders.disputed > 0               },
                { label: 'Hero Banners',     sub: 'Manage carousel',                        href: '/admin/hero',           Icon: Megaphone,     color: 'text-violet-400',  urgent: false                             },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className={cn(
                    'flex flex-col gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] group',
                    a.urgent
                      ? 'bg-white shadow-sm border-neutral-300 hover:border-amber-500/30'
                      : 'bg-white shadow-sm border-neutral-200 hover:border-neutral-300',
                  )}>
                  <a.Icon size={20} className={cn(a.color, 'transition-transform group-hover:scale-110')} />
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{a.label}</p>
                    <p className={cn('text-xs mt-0.5', a.urgent ? 'text-amber-400 font-semibold' : 'text-neutral-500')}>
                      {a.sub}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ REVENUE TAB ═══════════════════════════════════════════════════ */}
      {tab === 'revenue' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5">
              <p className="text-xs text-neutral-500 mb-1">GMV Last 30 Days</p>
              <p className="text-3xl font-bold text-neutral-900 tabular-nums">{fmtMoney(revenue.gmv30d)}</p>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">Gross merchandise value</p>
            </div>
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5">
              <p className="text-xs text-neutral-500 mb-1">Subscription Revenue 30d</p>
              <p className="text-3xl font-bold text-neutral-900 tabular-nums">{fmtMoney(revenue.subRev30d)}</p>
              {subStats && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-amber-400 font-semibold">{subStats.monthlyCount} monthly</span>
                  <span className="text-[10px] text-violet-400 font-semibold">{subStats.sixMonthCount} six-month</span>
                </div>
              )}
            </div>
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5">
              <p className="text-xs text-neutral-500 mb-1">Escrow Held</p>
              <p className="text-3xl font-bold text-neutral-900 tabular-nums">{fmtMoney(revenue.escrowTotal)}</p>
              <p className="text-xs text-blue-400 mt-1 font-semibold">Pending release</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue by country */}
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5 space-y-4">
              <SectionHeader title="Revenue by Country" sub="Last 30 days" icon={MapPin} />
              {byCountry.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-6">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {byCountry.map(c => (
                    <CountryRow key={c.country} country={c.country} revenue={c.revenue} max={maxCountryRev} />
                  ))}
                </div>
              )}
            </div>

            {/* Subscription breakdown */}
            {subStats && (
              <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5 space-y-4">
                <SectionHeader title="Subscription Breakdown" icon={Crown} href="/admin/subscriptions" />
                <div className="space-y-4">
                  {[
                    { label: 'Monthly Plan Revenue', val: subStats.monthlyRev,  count: subStats.monthlyCount,   color: 'bg-amber-500',  text: 'text-amber-400'  },
                    { label: '6-Month Plan Revenue', val: subStats.sixMonthRev, count: subStats.sixMonthCount,  color: 'bg-violet-500', text: 'text-violet-400' },
                  ].map(s => (
                    <div key={s.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-700 font-medium">{s.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-500">{s.count} payments</span>
                          <span className={cn('font-bold tabular-nums', s.text)}>{fmtMoney(s.val)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-700', s.color)}
                          style={{ width: `${Math.min(100, (s.val / Math.max(subStats.monthlyRev + subStats.sixMonthRev, 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}

                  <div className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl border mt-2',
                    subStats.expiringIn7d > 0
                      ? 'bg-amber-500/10 border-amber-500/20'
                      : 'bg-neutral-800/50 border-neutral-300',
                  )}>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className={subStats.expiringIn7d > 0 ? 'text-amber-400' : 'text-neutral-500'} />
                      <span className="text-xs font-semibold text-neutral-700">Expiring in 7 days</span>
                    </div>
                    <span className={cn(
                      'text-sm font-bold tabular-nums',
                      subStats.expiringIn7d > 0 ? 'text-amber-400' : 'text-neutral-500',
                    )}>
                      {subStats.expiringIn7d}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ VENDORS TAB ═══════════════════════════════════════════════════ */}
      {tab === 'vendors' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Vendors',    val: vendors.total,              color: 'text-neutral-700', bg: 'bg-neutral-800'           },
              { label: 'Active Stores',    val: vendors.active,             color: 'text-emerald-400', bg: 'bg-emerald-500/10'        },
              { label: 'New This Month',   val: vendors.new30d,             color: 'text-amber-400',   bg: 'bg-amber-500/10'          },
              { label: 'Pending Verif.',   val: vendors.pendingVerification, color: vendors.pendingVerification > 0 ? 'text-danger' : 'text-neutral-500', bg: vendors.pendingVerification > 0 ? 'bg-danger/10' : 'bg-neutral-800' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-2xl border border-neutral-200 p-5 space-y-1', s.bg)}>
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'white' }}>{fmtNum(s.val)}</p>
                <p className={cn('text-xs font-semibold', s.color)}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Top vendors table */}
          <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900">Top Vendors by Revenue</h3>
              </div>
              <Link href="/admin/vendors"
                className="text-xs font-semibold text-neutral-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                All vendors <ChevronRight size={12} />
              </Link>
            </div>

            {topVendors.length === 0 ? (
              <p className="text-xs text-neutral-600 text-center py-10">No vendor data yet</p>
            ) : (
              <div className="divide-y divide-neutral-800">
                {topVendors.map((v, i) => (
                  <Link key={v.vendor?.id ?? i} href={`/admin/vendors/${v.vendor?.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-800/50 transition-colors group">
                    <span className="text-sm font-bold text-neutral-600 w-5 tabular-nums shrink-0">{i + 1}</span>
                    <div className="w-9 h-9 rounded-xl bg-neutral-800 overflow-hidden border border-neutral-300 shrink-0">
                      {v.vendor?.store_logo_url
                        ? <img src={v.vendor.store_logo_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-bold">
                            {v.vendor?.store_name?.charAt(0).toUpperCase()}
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-amber-300 transition-colors">
                        {v.vendor?.store_name}
                      </p>
                      <p className="text-[10px] text-neutral-500">{v.vendor?.business_country} · {v.orders} orders</p>
                    </div>
                    {v.vendor?.verification_status === 'verified' && (
                      <BadgeCheck size={14} className="text-blue-400 shrink-0" />
                    )}
                    <span className="text-sm font-bold text-emerald-400 tabular-nums shrink-0">
                      {fmtMoney(v.revenue)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ GROWTH TAB ════════════════════════════════════════════════════ */}
      {tab === 'growth' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* 8-week growth chart */}
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5 space-y-4">
              <SectionHeader title="8-Week Platform Growth" sub="New vendors vs new buyers" icon={TrendingUp} />
              <GrowthChart data={growth} />
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-neutral-500">
                  <span className="w-3 h-3 rounded-sm bg-amber-500/70 inline-block" /> Vendors
                </span>
                <span className="flex items-center gap-1.5 text-neutral-500">
                  <span className="w-3 h-3 rounded-sm bg-blue-500/70 inline-block" /> Buyers
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                {growth.slice(-2).map((w, i) => (
                  <div key={w.label} className="bg-neutral-800 rounded-xl p-3">
                    <p className="text-[10px] text-neutral-500">{i === 0 ? 'Last week' : 'This week'}</p>
                    <p className="text-sm font-bold text-neutral-900 mt-0.5">+{w.vendors} vendors</p>
                    <p className="text-xs text-blue-400">+{w.users} buyers</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly order trend */}
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5 space-y-4">
              <SectionHeader
                title="Orders Last 12 Hours"
                sub="Hourly distribution"
                icon={Activity}
                action={(
                  <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    Live
                  </span>
                )}
              />
              <HourlyChart data={hourly} />

              {/* Today's order + revenue summary */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { label: 'Orders today',  val: fmtNum(liveNewOrders || orders.today),     color: 'text-amber-400'   },
                  { label: 'Revenue',       val: fmtMoney(liveRevenueToday || 0),            color: 'text-emerald-400' },
                  { label: 'In progress',   val: fmtNum(liveActiveOrders || orders.pending), color: 'text-blue-400'    },
                ].map(s => (
                  <div key={s.label} className="bg-neutral-800 rounded-xl p-3 text-center">
                    <p className={cn('text-base font-bold tabular-nums', s.color)}>{s.val}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content stats */}
          <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-5">
            <SectionHeader title="Content Overview" icon={Eye} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Active Products',    val: content.products, icon: Package, color: 'text-blue-400',    bg: 'bg-blue-500/10'   },
                { label: 'Published Videos',   val: content.videos,   icon: Video,   color: 'text-rose-400',    bg: 'bg-rose-500/10'   },
                { label: 'Active Subs',         val: subs.active,      icon: Crown,   color: 'text-amber-400',   bg: 'bg-amber-500/10'  },
                { label: 'Total Orders',        val: orders.total,     icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10'},
              ].map(s => (
                <div key={s.label} className={cn('rounded-xl p-4 border border-neutral-200 flex items-center gap-3', s.bg)}>
                  <s.icon size={20} className={cn(s.color, 'shrink-0')} strokeWidth={1.8} />
                  <div>
                    <p className="text-xl font-bold text-neutral-900 tabular-nums">{fmtNum(s.val)}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}