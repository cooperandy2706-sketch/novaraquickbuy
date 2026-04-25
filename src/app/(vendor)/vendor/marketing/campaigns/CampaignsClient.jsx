'use client'
// FILE: src/app/(vendor)/vendor/marketing/campaigns/CampaignsClient.jsx

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import Link                        from 'next/link'
import {
  Plus, Crown, Clock, BarChart2,
  Zap, Tag, Megaphone, Star, Image as ImageIcon,
  ChevronRight, RefreshCw, Trash2,
  TrendingUp, Eye, ShoppingCart, DollarSign,
  Circle, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { deleteCampaign, publishCampaign } from '@/lib/actions/campaigns'
import { cn }                              from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

const TYPE_CONFIG = {
  promo_code:      { icon: Tag,       label: 'Promo Code',     color: 'bg-violet-50 text-violet-700 border-violet-200'  },
  flash_sale:      { icon: Zap,       label: 'Flash Sale',     color: 'bg-orange-50 text-orange-700 border-orange-200'  },
  hero_banner:     { icon: ImageIcon, label: 'Hero Banner',    color: 'bg-blue-50 text-blue-700 border-blue-200'        },
  broadcast:       { icon: Megaphone, label: 'Broadcast',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
  sponsored_video: { icon: Star,      label: 'Sponsored Video',color: 'bg-amber-50 text-amber-700 border-amber-200'    },
}

const STATUS_CONFIG = {
  draft:      { label: 'Draft',     color: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400' },
  scheduled:  { label: 'Scheduled', color: 'bg-amber-50 text-amber-700',      dot: 'bg-amber-500'   },
  active:     { label: 'Active',    color: 'bg-emerald-50 text-emerald-700',   dot: 'bg-emerald-500' },
  ended:      { label: 'Ended',     color: 'bg-neutral-100 text-neutral-400',  dot: 'bg-neutral-300' },
  cancelled:  { label: 'Cancelled', color: 'bg-red-50 text-red-600',           dot: 'bg-red-400'     },
}

function CampaignCard({ campaign, onRefresh }) {
  const currency = useLocaleStore(s => s.currency)
  const [loading, setLoad] = useState(false)
  const typeCfg   = TYPE_CONFIG[campaign.type]  ?? TYPE_CONFIG.promo_code
  const statusCfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft
  const Icon      = typeCfg.icon

  const now       = Date.now()
  const endsAt    = campaign.ends_at ? new Date(campaign.ends_at) : null
  const startsAt  = campaign.starts_at ? new Date(campaign.starts_at) : null
  const isLive    = campaign.status === 'active'
  const isExpired = endsAt && endsAt < now

  const handleDelete = async () => {
    if (!confirm(`Delete "${campaign.name}"?`)) return
    setLoad(true)
    await deleteCampaign(campaign.id)
    onRefresh()
  }

  const handlePublish = async () => {
    setLoad(true)
    await publishCampaign(campaign.id)
    setLoad(false)
    onRefresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-neutral-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', typeCfg.color)}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-800 truncate">{campaign.name}</p>
              <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5', typeCfg.color)}>
                {typeCfg.label}
              </span>
            </div>
          </div>
          <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0', statusCfg.color)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot, isLive && 'animate-pulse')} />
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-neutral-100 border-b border-neutral-100">
        {[
          { icon: Eye,          label: 'Views',       val: campaign.impressions ?? 0 },
          { icon: TrendingUp,   label: 'Clicks',      val: campaign.clicks      ?? 0 },
          { icon: ShoppingCart, label: 'Orders',      val: campaign.conversions ?? 0 },
          { icon: DollarSign,   label: 'Revenue',     val: formatCurrency(campaign.revenue ?? 0, currency) },
        ].map((s, idx) => (
          <div key={s.label} className={cn(
            "px-3 py-3 text-center",
            idx % 2 === 0 ? "border-l-0" : "sm:border-l"
          )}>
            <p className="text-lg sm:text-base font-black text-brand-900 tabular-nums leading-none">{s.val}</p>
            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="text-xs text-neutral-400">
          {startsAt && !isExpired && (
            <span>
              {isLive ? 'Ends' : 'Starts'}&nbsp;
              {(isLive ? endsAt : startsAt)?.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {isExpired && <span className="text-neutral-400">Ended {endsAt?.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {campaign.status === 'draft' && (
            <button onClick={handlePublish} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg bg-brand text-white text-[11px] sm:text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all disabled:opacity-50 active:scale-95">
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <><CheckCircle2 size={12} /> Publish</>}
            </button>
          )}
          <Link href={`/vendor/marketing/campaigns/${campaign.id}`}
            className="flex items-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg border border-neutral-200 text-[11px] sm:text-xs font-black uppercase tracking-widest text-neutral-600 hover:border-brand hover:text-brand transition-all active:scale-95">
            Edit <ChevronRight size={12} />
          </Link>
          <button onClick={handleDelete} disabled={loading}
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg flex items-center justify-center text-neutral-400 hover:text-danger hover:bg-danger/5 transition-all active:scale-95 border border-transparent sm:border-none">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

const CAMPAIGN_TYPES = [
  { type: 'promo_code',      icon: Tag,       label: 'Promo Code',     desc: 'Discount codes for buyers at checkout',        color: 'hover:border-violet-300 hover:bg-violet-50' },
  { type: 'flash_sale',      icon: Zap,       label: 'Flash Sale',     desc: 'Time-limited price drops with countdown',      color: 'hover:border-orange-300 hover:bg-orange-50' },
  { type: 'hero_banner',     icon: ImageIcon, label: 'Hero Banner',    desc: 'Feature your product on the explore carousel', color: 'hover:border-blue-300 hover:bg-blue-50'     },
  { type: 'broadcast',       icon: Megaphone, label: 'Broadcast',      desc: 'Send promos to all circle members at once',    color: 'hover:border-emerald-300 hover:bg-emerald-50'},
  { type: 'sponsored_video', icon: Star,      label: 'Sponsored Video',desc: 'Boost your video higher in the feed',          color: 'hover:border-amber-300 hover:bg-amber-50'   },
]

export default function CampaignsClient({ campaigns, subscription }) {
  const currency                     = useLocaleStore(s => s.currency)
  const router                       = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter,    setFilter]       = useState('all')
  const [showNew,   setShowNew]      = useState(false)

  const isActive  = subscription?.isActive
  const daysLeft  = subscription?.daysLeft ?? 0
  const pending   = subscription?.pendingPayment

  const filtered = filter === 'all'
    ? campaigns
    : campaigns.filter(c => c.type === filter || c.status === filter)

  const stats = {
    active:  campaigns.filter(c => c.status === 'active').length,
    total:   campaigns.length,
    views:   campaigns.reduce((s, c) => s + (c.impressions ?? 0), 0),
    revenue: campaigns.reduce((s, c) => s + (c.revenue ?? 0), 0),
  }

  const handleRefresh = () => startTransition(() => router.refresh())

  // ── Not subscribed gate ────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="max-w-2xl space-y-6 pb-10">
        <div>
          <h1 className="text-xl font-bold text-brand-900">Campaigns</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Unlock marketing tools with a Pro subscription</p>
        </div>

        {pending ? (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center mx-auto">
              <Clock size={28} className="text-amber-600" />
            </div>
            <p className="font-bold text-brand-800 text-lg">Payment Under Review</p>
            <p className="text-sm text-neutral-500 max-w-xs mx-auto">
              Our team verifies payments within <span className="font-semibold text-amber-700">24 hours</span>. You'll be notified when your subscription activates.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 text-left space-y-1">
              <p className="font-bold">What happens next:</p>
              <p>① Admin reviews your payment proof</p>
              <p>② Subscription activated within 24 hours</p>
              <p>③ You'll get a notification to start your first campaign</p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-8 text-white space-y-6">
            <div className="flex items-center gap-3">
              <Crown size={28} className="text-amber-400" />
              <div>
                <p className="font-bold text-xl">Upgrade to Pro</p>
                <p className="text-brand-300 text-sm mt-0.5">Unlock all 5 campaign types + hero banner placement</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAMPAIGN_TYPES.map(t => (
                <div key={t.type} className="flex items-start gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <t.icon size={15} className="text-brand-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-white/60 mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/vendor/marketing/subscribe"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white text-brand font-bold text-sm hover:bg-brand-50 transition-all active:scale-[0.98]">
              <Crown size={16} className="text-amber-500" /> Subscribe — from {formatCurrency(32, currency)}/month
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-brand-900">Campaigns</h1>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Crown size={11} className="text-amber-500" /> Pro · {daysLeft}d left
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">
            {stats.active} active · {stats.total} total · {stats.views.toLocaleString()} views
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all shadow-brand active:scale-[0.98]">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Active',   value: stats.active,                        icon: Circle,      color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Views',    value: stats.views.toLocaleString(),         icon: Eye,         color: 'text-violet-600 bg-violet-50'   },
          { label: 'Revenue',  value: formatCurrency(stats.revenue, currency), icon: DollarSign,  color: 'text-brand bg-brand-50'         },
          { label: 'Total',    value: stats.total,                          icon: BarChart2,   color: 'text-neutral-600 bg-neutral-100'},
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-3.5 sm:p-4 flex items-center gap-3 transition-all hover:shadow-md">
            <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}>
              <s.icon size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-black text-brand-900 tabular-nums leading-none truncate">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl p-1 shadow-sm w-fit min-w-full sm:min-w-0">
          {[
            { value: 'all',       label: 'All'      },
            { value: 'active',    label: 'Active'   },
            { value: 'scheduled', label: 'Scheduled'},
            { value: 'draft',     label: 'Drafts'   },
            { value: 'ended',     label: 'Ended'    },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap',
                filter === f.value ? 'bg-brand text-white shadow-sm' : 'text-neutral-400 hover:text-brand hover:bg-brand/5',
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200">
          <BarChart2 size={40} className="text-neutral-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-neutral-400">No campaigns yet</p>
          <p className="text-xs text-neutral-300 mt-1 mb-5">Create your first campaign to reach more buyers</p>
          <button onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white font-bold rounded-xl text-sm shadow-brand hover:bg-brand-700 transition-all">
            <Plus size={15} /> Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CampaignCard key={c.id} campaign={c} onRefresh={handleRefresh} />
          ))}
        </div>
      )}

      {/* New campaign type picker modal */}
      {showNew && (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
          onClick={() => setShowNew(false)}>
          <div 
            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg pb-safe overflow-hidden animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 sm:fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <p className="font-black text-brand-900 text-lg uppercase tracking-tight">New Campaign</p>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Select a strategy</p>
              </div>
              <button 
                onClick={() => setShowNew(false)}
                className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-brand transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-2.5 max-h-[70vh] overflow-y-auto no-scrollbar">
              {CAMPAIGN_TYPES.map(t => (
                <Link key={t.type}
                  href={`/vendor/marketing/campaigns/new?type=${t.type}`}
                  onClick={() => setShowNew(false)}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4 rounded-[1.5rem] border-2 border-neutral-100 transition-all active:scale-[0.98]',
                    t.color,
                  )}>
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-transform group-hover:scale-110',
                    TYPE_CONFIG[t.type]?.color.replace('border-', 'border-'))}>
                    <t.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-brand-900 uppercase tracking-tight">{t.label}</p>
                    <p className="text-[11px] text-neutral-500 font-medium leading-relaxed mt-0.5">{t.desc}</p>
                  </div>
                  <ChevronRight size={18} className="text-neutral-300 shrink-0" />
                </Link>
              ))}
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 hidden sm:block">
              <p className="text-[10px] text-center text-neutral-400 font-bold uppercase tracking-widest">
                Choose a type to customize your campaign settings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}