'use client'
// FILE: src/components/vendor/analytics/AnalyticsOverviewCards.jsx

import { useRouter } from 'next/navigation'
import {
  DollarSign, ShoppingBag, Eye, Heart,
  Users, Star, MessageSquare, TrendingUp,
  BarChart3, UserPlus,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

function KpiCard({ label, value, growth, icon: Icon, iconBg, accent, sub, onClick }) {
  const g      = growth !== null && growth !== undefined ? parseFloat(growth) : null
  const isPos  = g > 0
  const isNeg  = g < 0

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'w-full text-left bg-white rounded-3xl border border-neutral-100 shadow-sm p-4 sm:p-5',
        'flex flex-col gap-4 transition-all duration-300 relative overflow-hidden group',
        onClick && 'hover:shadow-xl hover:shadow-neutral-200/50 hover:-translate-y-1 cursor-pointer active:scale-[0.98]',
        !onClick && 'cursor-default',
      )}
    >
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500', iconBg)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {g !== null && (
          <span className={cn(
            'text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm uppercase tracking-tight',
            isPos ? 'bg-emerald-500 text-white border-emerald-400' : 
            isNeg ? 'bg-rose-500 text-white border-rose-400' : 
                    'bg-neutral-100 text-neutral-400 border-neutral-200',
          )}>
            {isPos ? '↑' : isNeg ? '↓' : '—'} {Math.abs(g)}%
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-xl sm:text-2xl font-black text-brand-900 tabular-nums leading-none tracking-tight">{value}</p>
        <p className="text-[10px] text-neutral-400 font-black mt-2 uppercase tracking-[0.15em] opacity-80 leading-tight">{label}</p>
        {sub && <p className="text-[9px] text-neutral-400 mt-1.5 font-bold italic opacity-60 truncate">{sub}</p>}
      </div>

      {/* Premium accent bar at the bottom */}
      <div className={cn('absolute bottom-0 left-0 right-0 h-1 rounded-full opacity-30', accent.replace('border-l', 'bg'))} />
    </button>
  )
}

export default function AnalyticsOverviewCards({ overview, loading }) {
  const router = useRouter()
  const currency = useLocaleStore(s => s.currency)

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array(10).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-neutral-100 p-6 space-y-4 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-neutral-50" />
            <div className="space-y-2">
              <div className="h-8 w-24 bg-neutral-50 rounded-lg" />
              <div className="h-3 w-16 bg-neutral-50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const o = overview ?? {}

  const fmt  = (n) => formatCurrency(n ?? 0, currency)
  const num  = (n) => (n ?? 0).toLocaleString()
  const rate = (n) => n !== null && n !== undefined ? `${n}%` : '—'

  const cards = [
    {
      label:  'Revenue',
      value:  fmt(o.revenue),
      growth: o.revenueGrowth,
      icon:   DollarSign,
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      accent: 'border-l-emerald-500',
      sub:    `Avg order ${fmt(o.avgOrderValue)}`,
      onClick:() => router.push('#revenue'),
    },
    {
      label:  'Orders',
      value:  num(o.orders),
      growth: o.ordersGrowth,
      icon:   ShoppingBag,
      iconBg: 'bg-blue-500/10 text-blue-600',
      accent: 'border-l-blue-500',
      onClick:() => router.push('#orders'),
    },
    {
      label:  'Video Views',
      value:  num(o.totalViews),
      growth: null,
      icon:   Eye,
      iconBg: 'bg-violet-500/10 text-violet-600',
      accent: 'border-l-violet-500',
      sub:    `${num(o.totalLikes)} likes`,
      onClick:() => router.push('#videos'),
    },
    {
      label:  'Followers',
      value:  num(o.followers),
      growth: o.followersGrowth,
      icon:   UserPlus,
      iconBg: 'bg-pink-500/10 text-pink-600',
      accent: 'border-l-pink-500',
      onClick:() => router.push('#followers'),
    },
    {
      label:  'Avg Rating',
      value:  o.avgRating ? `${o.avgRating} ★` : '—',
      growth: null,
      icon:   Star,
      iconBg: 'bg-amber-500/10 text-amber-500',
      accent: 'border-l-amber-400',
      sub:    `${num(o.totalReviews)} reviews`,
      onClick:() => router.push('#reviews'),
    },
    {
      label:  'Store Views',
      value:  num(o.storeViews),
      growth: null,
      icon:   BarChart3,
      iconBg: 'bg-sky-500/10 text-sky-600',
      accent: 'border-l-sky-500',
      sub:    o.conversionRate !== null ? `${o.conversionRate}% conversion` : null,
    },
    {
      label:  'Circle Members',
      value:  num(o.circleMembers),
      growth: null,
      icon:   Users,
      iconBg: 'bg-indigo-500/10 text-indigo-600',
      accent: 'border-l-indigo-500',
      onClick:() => router.push('/vendor/circles'),
    },
    {
      label:  'Messages',
      value:  num(o.totalMessages),
      growth: null,
      icon:   MessageSquare,
      iconBg: 'bg-teal-500/10 text-teal-600',
      accent: 'border-l-teal-500',
      onClick:() => router.push('/vendor/chat'),
    },
    {
      label:  'Products Listed',
      value:  num(o.totalProducts),
      growth: null,
      icon:   TrendingUp,
      iconBg: 'bg-orange-500/10 text-orange-500',
      accent: 'border-l-orange-400',
      onClick:() => router.push('/vendor/products'),
    },
    {
      label:  'Conversion Rate',
      value:  rate(o.conversionRate),
      growth: null,
      icon:   Heart,
      iconBg: 'bg-rose-500/10 text-rose-500',
      accent: 'border-l-rose-400',
      sub:    'Orders ÷ store views',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((c, i) => <KpiCard key={i} {...c} />)}
    </div>
  )
}