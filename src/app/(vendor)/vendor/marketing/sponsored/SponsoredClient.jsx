'use client'
// FILE: src/app/(vendor)/vendor/marketing/sponsored/SponsoredClient.jsx

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import Link                        from 'next/link'
import {
  Star, Plus, Eye, TrendingUp, DollarSign,
  Play, Pause, Trash2, ChevronRight,
  Crown, Clock, BarChart2, Zap, Info,
  ShoppingCart, RefreshCw, ExternalLink,
  CheckCircle2, AlertCircle,
} from 'lucide-react'
import {
  deleteCampaign,
  toggleSponsoredStatus,
} from '@/lib/actions/campaigns'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

// ── Status pill ───────────────────────────────────────────────────────────────
const STATUS = {
  draft:     { label: 'Draft',     dot: 'bg-neutral-400', color: 'bg-neutral-100 text-neutral-500'  },
  scheduled: { label: 'Scheduled', dot: 'bg-amber-500',   color: 'bg-amber-50 text-amber-700'       },
  active:    { label: 'Live',      dot: 'bg-emerald-500', color: 'bg-emerald-50 text-emerald-700'   },
  ended:     { label: 'Ended',     dot: 'bg-neutral-300', color: 'bg-neutral-100 text-neutral-400'  },
  paused:    { label: 'Paused',    dot: 'bg-orange-400',  color: 'bg-orange-50 text-orange-700'     },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     color: 'bg-red-50 text-red-600'           },
}

function fmtDuration(s) {
  if (!s) return ''
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function fmtNum(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n ?? 0)
}

function timeLeft(endsAt) {
  if (!endsAt) return null
  const diff = new Date(endsAt) - Date.now()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  if (d > 0) return `${d}d ${h}h left`
  return `${h}h left`
}

// ── Single sponsored campaign card ────────────────────────────────────────────
function SponsoredCard({ campaign, onRefresh }) {
  const currency = useLocaleStore(s => s.currency)
  const [loading, setLoad] = useState(false)
  const video   = campaign.video
  const status  = campaign.status
  const cfg     = STATUS[status] ?? STATUS.draft
  const isLive  = status === 'active'
  const spent   = campaign.spent ?? 0
  const budget  = campaign.budget
  const pct     = budget ? Math.min(100, Math.round((spent / budget) * 100)) : 0
  const tLeft   = timeLeft(campaign.ends_at)
  const ctr     = campaign.impressions > 0
    ? ((campaign.clicks / campaign.impressions) * 100).toFixed(1)
    : '0.0'

  const handleToggle = async () => {
    setLoad(true)
    await toggleSponsoredStatus(campaign.id, isLive ? 'paused' : 'active')
    setLoad(false)
    onRefresh()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${campaign.name}"?`)) return
    setLoad(true)
    await deleteCampaign(campaign.id)
    onRefresh()
  }

  return (
    <div className={cn(
      'bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md',
      isLive ? 'border-emerald-200' : 'border-neutral-200',
    )}>
      {/* Video preview + status */}
      <div className="relative">
        <div className="aspect-video bg-neutral-900 overflow-hidden">
          {video?.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600">
              <Play size={28} />
            </div>
          )}
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {video?.duration_seconds > 0 && (
            <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg font-mono">
              {fmtDuration(video.duration_seconds)}
            </div>
          )}
          {/* Sponsored badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            <Star size={10} fill="white" /> Sponsored
          </div>
          {/* Status pill */}
          <div className={cn(
            'absolute top-2.5 right-2.5 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full',
            cfg.color,
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot, isLive && 'animate-pulse')} />
            {cfg.label}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <p className="text-sm font-bold text-brand-800 truncate">{campaign.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5 truncate">{video?.title ?? 'No video selected'}</p>
        {tLeft && (
          <p className={cn('text-xs font-semibold mt-1 flex items-center gap-1',
            status === 'ended' ? 'text-neutral-400' : 'text-amber-600')}>
            <Clock size={11} /> {tLeft}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-neutral-100 border-b border-neutral-100">
        {[
          { icon: Eye,          val: fmtNum(campaign.impressions), label: 'Views'    },
          { icon: TrendingUp,   val: `${ctr}%`,                    label: 'CTR'      },
          { icon: ShoppingCart, val: fmtNum(campaign.conversions), label: 'Orders'   },
          { icon: DollarSign,   val: formatCurrency(campaign.revenue ?? 0, currency), label: 'Revenue' },
        ].map((s, idx) => (
          <div key={s.label} className={cn(
            "px-2 py-3 text-center",
            idx % 2 === 0 ? "border-l-0" : "sm:border-l"
          )}>
            <p className="text-base font-black text-brand-900 tabular-nums leading-none">{s.val}</p>
            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Budget progress */}
      {budget > 0 && (
        <div className="px-4 py-3 border-b border-neutral-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">Budget used</span>
            <span className="font-semibold text-brand-800 tabular-nums">
              {formatCurrency(spent, currency)} / {formatCurrency(budget, currency)}
            </span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500',
                pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-amber-500' : 'bg-brand')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-neutral-400 text-right">{pct}% used</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3">
        {(status === 'active' || status === 'paused' || status === 'draft') && (
          <button onClick={handleToggle} disabled={loading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50',
              isLive
                ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100',
            )}>
            {loading
              ? <RefreshCw size={12} className="animate-spin" />
              : isLive ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>
            }
          </button>
        )}
        <Link href={`/vendor/marketing/campaigns/${campaign.id}`}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:border-brand hover:text-brand transition-all">
          Edit <ChevronRight size={11} />
        </Link>
        <button onClick={handleDelete} disabled={loading}
          className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-danger hover:bg-danger/5 transition-all">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Video picker for new boost ────────────────────────────────────────────────
function VideoPickerSheet({ videos, onPick, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = videos.filter(v =>
    v.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <p className="font-black text-brand-900 text-lg uppercase tracking-tight">Boost a Video</p>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Select a video to sponsor</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-brand transition-colors">✕</button>
        </div>
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="relative">
            <input type="text" placeholder="Search your videos…" value={search}
              onChange={e => setSearch(e.target.value)} autoFocus
              className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all shadow-sm" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-2.5 no-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Play size={40} className="text-neutral-200 mx-auto mb-3" />
              <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">No videos found</p>
            </div>
          ) : filtered.map(v => (
            <button key={v.id} onClick={() => onPick(v)}
              className="w-full flex items-center gap-4 p-4 rounded-3xl border-2 border-neutral-100 hover:border-brand/40 hover:bg-brand-50/50 transition-all text-left group active:scale-[0.98]">
              <div className="w-16 h-24 rounded-2xl bg-neutral-900 overflow-hidden border border-neutral-200 shrink-0 shadow-sm relative">
                {v.thumbnail_url
                  ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-neutral-500"><Play size={20} /></div>
                }
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-brand-900 truncate uppercase tracking-tight group-hover:text-brand transition-colors">{v.title}</p>
                <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Eye size={12} className="text-neutral-300" /> {fmtNum(v.views)}</span>
                  <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-neutral-300" /> {fmtNum(v.likes)}</span>
                </div>
                {v.video_tags?.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 bg-brand/10 text-brand px-2 py-0.5 rounded-full mt-2 text-[9px] font-black uppercase tracking-wider">
                    {v.video_tags.length} TAGGED PRODUCTS
                  </div>
                )}
              </div>
              <div className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-300 group-hover:bg-brand group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SponsoredClient({ subscription, sponsored, videos }) {
  const currency                     = useLocaleStore(s => s.currency)
  const router                       = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter,    setFilter]       = useState('all')
  const [showPicker,setShowPicker]   = useState(false)

  const isActive = subscription?.isActive

  const filtered = filter === 'all'
    ? sponsored
    : sponsored.filter(c => c.status === filter)

  const stats = {
    live:        sponsored.filter(c => c.status === 'active').length,
    impressions: sponsored.reduce((s, c) => s + (c.impressions ?? 0), 0),
    clicks:      sponsored.reduce((s, c) => s + (c.clicks     ?? 0), 0),
    revenue:     sponsored.reduce((s, c) => s + (c.revenue    ?? 0), 0),
    spent:       sponsored.reduce((s, c) => s + (c.spent      ?? 0), 0),
  }

  const handleRefresh = () => startTransition(() => router.refresh())

  const handlePickVideo = (video) => {
    setShowPicker(false)
    router.push(`/vendor/marketing/campaigns/new?type=sponsored_video&video=${video.id}`)
  }

  // ── Not subscribed ─────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="max-w-xl space-y-6 pb-10">
        <div>
          <h1 className="text-xl font-bold text-brand-900">Sponsored Videos</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Boost your videos to reach more buyers in the feed</p>
        </div>
        <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-8 text-white space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center">
              <Star size={24} className="text-amber-400" fill="currentColor" />
            </div>
            <div>
              <p className="font-bold text-lg">Sponsored Videos</p>
              <p className="text-brand-300 text-sm mt-0.5">Pro feature — subscribe to unlock</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: TrendingUp, text: 'Your video appears at the top of the buyer feed'          },
              { icon: Eye,        text: 'Reach buyers beyond your existing followers'              },
              { icon: Zap,        text: 'Set a budget and duration — pause any time'               },
              { icon: BarChart2,  text: 'Track impressions, clicks, orders, and ROI in real time'  },
            ].map(f => (
              <div key={f.text} className="flex items-start gap-3">
                <f.icon size={15} className="text-brand-300 shrink-0 mt-0.5" />
                <p className="text-sm text-white/80">{f.text}</p>
              </div>
            ))}
          </div>
          <Link href="/vendor/marketing/subscribe"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white text-brand font-bold text-sm hover:bg-brand-50 transition-all active:scale-[0.98]">
            <Crown size={16} className="text-amber-500" /> Subscribe to Unlock
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-brand-900">Sponsored Videos</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {stats.live} live · {fmtNum(stats.impressions)} impressions total
          </p>
        </div>
        <button
          onClick={() => videos.length > 0 ? setShowPicker(true) : router.push('/vendor/videos')}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]">
          <Star size={15} fill="white" /> Boost a Video
        </button>
      </div>

      {/* How it works banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-bold">How Sponsored Videos Work</p>
          <p>Your boosted video appears between organic videos in the buyer feed with a <span className="font-semibold">★ Sponsored</span> badge. Higher budget = more frequent placement. You're charged per impression. Pause or cancel at any time.</p>
        </div>
      </div>

      {/* Stats row */}
      {sponsored.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Eye,          label: 'Impressions', val: fmtNum(stats.impressions), color: 'text-violet-600 bg-violet-50'   },
            { icon: TrendingUp,   label: 'Total Clicks',      val: fmtNum(stats.clicks),      color: 'text-blue-600 bg-blue-50'       },
            { icon: DollarSign,   label: 'Revenue',           val: formatCurrency(stats.revenue, currency), color: 'text-emerald-600 bg-emerald-50' },
            { icon: Star,         label: 'Total Spent',      val: formatCurrency(stats.spent, currency), color: 'text-amber-600 bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-3.5 sm:p-4 flex items-center gap-3 transition-all hover:shadow-md">
              <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}>
                <s.icon size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-black text-brand-900 tabular-nums leading-none truncate">{s.val}</p>
                <p className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {sponsored.length > 0 && (
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl p-1 shadow-sm w-fit min-w-full sm:min-w-0">
            {[
              { value: 'all',       label: 'All'      },
              { value: 'active',    label: 'Live'     },
              { value: 'paused',    label: 'Paused'   },
              { value: 'scheduled', label: 'Scheduled'},
              { value: 'ended',     label: 'Ended'    },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2',
                  filter === f.value ? 'bg-brand text-white shadow-sm' : 'text-neutral-400 hover:text-brand hover:bg-brand-50',
                )}>
                {f.label}
                <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded-md',
                  filter === f.value ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500')}>
                  {f.value === 'all' ? sponsored.length : sponsored.filter(c => c.status === f.value).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Star size={28} className="text-amber-400" />
          </div>
          <p className="text-sm font-semibold text-neutral-500">
            {sponsored.length === 0 ? 'No sponsored videos yet' : 'No campaigns match this filter'}
          </p>
          <p className="text-xs text-neutral-400 mt-1 mb-5">
            {sponsored.length === 0
              ? 'Boost a video to reach more buyers in the feed'
              : 'Try a different filter'
            }
          </p>
          {sponsored.length === 0 && (
            <button onClick={() => videos.length > 0 ? setShowPicker(true) : router.push('/vendor/videos')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all">
              <Star size={15} fill="white" />
              {videos.length > 0 ? 'Boost Your First Video' : 'Publish a Video First'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <SponsoredCard
              key={c.id}
              campaign={c}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* No videos warning */}
      {isActive && videos.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">No published videos yet</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You need at least one published video to run a sponsored campaign.
            </p>
            <Link href="/vendor/videos/new"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 underline mt-2">
              Upload your first video <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}

      {/* Video picker sheet */}
      {showPicker && (
        <VideoPickerSheet
          videos={videos}
          onPick={handlePickVideo}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}