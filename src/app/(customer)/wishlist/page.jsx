'use client'
// FILE: src/app/(customer)/wishlist/page.jsx
// My Wishlists — grid of all the user's wishlist cards.
// Points badge, create button, type filters, stats strip, share prompt.

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMyWishlists, useWishlistPoints, LIST_TYPE_CONFIG } from '@/hooks/useWishlist'
import WishlistCard         from '@/components/wishlist/WishlistCard'
import WishlistCreateModal  from '@/components/wishlist/WishlistCreateModal'
import WishlistPointsBadge  from '@/components/wishlist/WishlistPointsBadge'
import { cn } from '@/utils/cn'
import {
  Plus, Sparkles, Gift, Share2,
  Heart, Star, TrendingUp, Loader2,
  Search, ChevronDown, Trophy,
  Zap, Eye, Package, Archive,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {/* Stacked cards illustration */}
      <div className="relative w-36 h-36 mb-8 mx-auto">
        {[
          { bg: 'rgba(234, 88, 12, 0.1)', emoji: '🎂', r: '-rotate-6', t: 0,  l: 0  },
          { bg: 'rgba(99, 102, 241, 0.1)', emoji: '💻', r: 'rotate-3',  t: 8,  l: 8  },
          { bg: 'rgba(22, 163, 74, 0.1)', emoji: '💍', r: '-rotate-2', t: 16, l: 16 },
        ].map((c, i) => (
          <div
            key={i}
            className={cn(
              'absolute w-24 h-28 rounded-3xl border border-border shadow-lg flex flex-col items-center justify-center gap-2',
              c.r,
            )}
            style={{ background: c.bg, top: c.t, left: c.l, zIndex: i + 1 }}
          >
            <span className="text-3xl">{c.emoji}</span>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black text-primary tracking-tight mb-2">
        Your wishlists live here
      </h2>
      <p className="text-sm text-secondary max-w-xs leading-relaxed mb-8">
        Create lists for any occasion — birthdays, weddings, home — and share with friends.
        Earn points when they vote, share, and buy gifts for you.
      </p>

      {/* Points preview */}
      <div className="flex items-center gap-4 mb-8 flex-wrap justify-center">
        {[
          { pts: '+10', label: 'Share a list' },
          { pts: '+5',  label: 'Friend votes' },
          { pts: '+50', label: 'Gift received' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 bg-brand/10 border border-brand/20 rounded-2xl px-3 py-2">
            <span className="text-xs font-black text-brand">{item.pts}</span>
            <span className="text-xs text-brand/80">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-6 py-3.5 text-white text-sm font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-brand/25"
          style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
        >
          <Plus size={15} /> Create first list
        </button>
        <Link
          href="/explore"
          className="flex items-center gap-2 px-6 py-3.5 bg-surface-2 text-primary text-sm font-bold rounded-2xl hover:bg-surface-3 transition-colors"
        >
          <Sparkles size={15} /> Browse products
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STATS STRIP
// ─────────────────────────────────────────────────────────────

function StatsStrip({ lists, points }) {
  const totalItems  = lists.reduce((s, l) => s + (l.item_count  ?? 0), 0)
  const totalVotes  = lists.reduce((s, l) => s + (l.vote_count  ?? 0), 0)
  const totalGifted = lists.reduce((s, l) => s + (l.gift_count  ?? 0), 0)
  const totalViews  = lists.reduce((s, l) => s + (l.view_count  ?? 0), 0)

  const stats = [
    { label: 'Lists',   value: lists.length, icon: Heart,       color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)' },
    { label: 'Items',   value: totalItems,   icon: Package,     color: '#16A34A', bg: 'rgba(22, 163, 74, 0.15)' },
    { label: 'Votes',   value: totalVotes,   icon: TrendingUp,  color: '#D97706', bg: 'rgba(217, 119, 6, 0.15)' },
    { label: 'Gifted',  value: totalGifted,  icon: Gift,        color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' },
    { label: 'Views',   value: totalViews,   icon: Eye,         color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.15)' },
    { label: 'Points',  value: points?.total_points ?? 0, icon: Star, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-6">
      {stats.map(s => (
        <div
          key={s.label}
          className="rounded-2xl p-3 text-center border border-border bg-surface-2"
          style={{ '--accent': s.color }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5"
            style={{ background: s.bg }}
          >
            <s.icon size={14} style={{ color: s.color }} />
          </div>
          <p className="text-base font-black text-primary leading-none">{s.value.toLocaleString()}</p>
          <p className="text-[10px] text-muted font-semibold mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SHARE PROMPT BANNER
// ─────────────────────────────────────────────────────────────

function ShareBanner({ list, onShare }) {
  const [dismissed, setDismissed] = useState(false)
  if (!list || list.share_count > 0 || dismissed) return null

  return (
    <div
      className="flex items-center gap-3 rounded-3xl p-4 mb-5 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
    >
      {/* Background sparkle */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-10 pointer-events-none select-none">
        ✨
      </div>

      <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
        <Share2 size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black leading-tight">
          Share <span className="text-green-300">"{list.name}"</span> · earn 10 points
        </p>
        <p className="text-[11px] text-green-200 mt-0.5">
          Friends can vote on your favourites and buy gifts for you
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onShare(list)}
          className="px-3.5 py-2 bg-white text-brand text-xs font-black rounded-xl hover:bg-green-50 transition-colors"
        >
          Share →
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white/60 hover:bg-white/30 transition-colors text-xs font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LEVEL BADGE
// ─────────────────────────────────────────────────────────────

function LevelBadge({ points, onExpand }) {
  if (!points) return null
  return (
    <button
      onClick={onExpand}
      className="flex items-center gap-2 bg-surface-2 border border-border rounded-2xl px-3.5 py-2 hover:border-brand/40 transition-all"
    >
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
        style={{ background: 'linear-gradient(135deg,#052E16,#16A34A)' }}
      >
        {points.level ?? 1}
      </div>
      <div className="text-left">
        <p className="text-xs font-black text-primary leading-none">{points.total_points.toLocaleString()} pts</p>
        <p className="text-[9px] text-muted mt-0.5">Tap to see progress</p>
      </div>
      <Star size={12} className="text-amber-400 fill-amber-300 shrink-0" />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// TYPE FILTER PILLS
// ─────────────────────────────────────────────────────────────

function TypeFilters({ active, onChange, counts }) {
  const filters = [
    { id: 'all', label: 'All', emoji: '📋' },
    ...Object.entries(LIST_TYPE_CONFIG).map(([id, cfg]) => ({
      id,
      label: cfg.label,
      emoji: cfg.emoji,
    })),
  ].filter(f => f.id === 'all' || (counts[f.id] ?? 0) > 0)

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 mb-5"
      style={{ scrollbarWidth: 'none' }}
    >
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={cn(
            'flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap',
            active === f.id
              ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
              : 'bg-surface-2 text-secondary border-border hover:border-primary hover:text-primary',
          )}
        >
          <span>{f.emoji}</span>
          <span>{f.label}</span>
          {f.id !== 'all' && counts[f.id] > 0 && (
            <span className={cn(
              'text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center',
              active === f.id ? 'bg-white/30 text-white' : 'bg-surface-3 text-secondary',
            )}>
              {counts[f.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const {
    lists, points, loading,
    createList, updateList, deleteList, archiveList, recordShare
  } = useMyWishlists()

  const { events, levelProgress } = useWishlistPoints()

  const [createOpen,  setCreateOpen]  = useState(false)
  const [editingList, setEditingList] = useState(null)
  const [filterType,  setFilterType]  = useState('all')
  const [search,      setSearch]      = useState('')
  const [showPoints,  setShowPoints]  = useState(false)
  const [sort,        setSort]        = useState('updated')  // updated | votes | items | created

  // Open create modal if ?create=1 is in URL
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true)
    }
  }, [searchParams])

  const handleCreate = useCallback(async (data) => {
    const list = await createList(data)
    setCreateOpen(false)
    if (list) router.push(`/wishlist/${list.id}`)
  }, [createList, router])

  const handleEdit = useCallback(async (data) => {
    if (!editingList) return
    await updateList(editingList.id, data)
    setEditingList(null)
  }, [editingList, updateList])

  const handleShare = useCallback((list) => {
    recordShare(list.id)
  }, [recordShare])

  // Type counts for filter pills
  const typeCounts = lists.reduce((acc, l) => {
    acc[l.list_type] = (acc[l.list_type] ?? 0) + 1
    return acc
  }, {})

  // Filter + search + sort
  const filtered = lists
    .filter(l => filterType === 'all' || l.list_type === filterType)
    .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'votes')   return (b.vote_count  ?? 0) - (a.vote_count  ?? 0)
      if (sort === 'items')   return (b.item_count  ?? 0) - (a.item_count  ?? 0)
      if (sort === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  const unsharedList = lists.find(l => l.share_count === 0 && !l.is_completed)

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Wishlists
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            {lists.length} list{lists.length !== 1 ? 's' : ''} · Share to earn points
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LevelBadge points={points} onExpand={() => setShowPoints(p => !p)} />
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-white text-sm font-black rounded-2xl active:scale-95 transition-all shadow-md shadow-brand/20"
            style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
          >
            <Plus size={15} /> New list
          </button>
        </div>
      </div>

      {/* ── Points panel ── */}
      {showPoints && (
        <div className="mb-6">
          <WishlistPointsBadge
            points={points}
            events={events}
            levelProgress={levelProgress}
          />
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-brand animate-spin" />
        </div>
      ) : lists.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <>
          {/* Stats strip */}
          <StatsStrip lists={lists} points={points} />

          {/* Share prompt */}
          <ShareBanner list={unsharedList} onShare={handleShare} />

          {/* Controls row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-2xl px-3.5 py-2.5 flex-1 min-w-40">
              <Search size={13} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search lists…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none placeholder:text-muted text-primary bg-transparent"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-2xl p-1">
              {[
                { id: 'updated', label: 'Recent'  },
                { id: 'votes',   label: '♥ Votes'  },
                { id: 'items',   label: 'Items'   },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all',
                    sort === s.id ? 'bg-brand text-white shadow-sm' : 'text-secondary hover:text-primary',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type filter pills */}
          <TypeFilters
            active={filterType}
            onChange={setFilterType}
            counts={typeCounts}
          />

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(list => (
                <WishlistCard
                  key={list.id}
                  list={list}
                  onEdit={setEditingList}
                  onShare={handleShare}
                  onArchive={archiveList}
                  onDelete={deleteList}
                />
              ))}

              {/* New list tile */}
              <button
                onClick={() => setCreateOpen(true)}
                className="group flex flex-col items-center justify-center h-56 rounded-3xl border border-dashed border-border text-muted hover:border-brand hover:text-brand hover:bg-brand/10 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-3 group-hover:bg-brand/20 flex items-center justify-center mb-3 transition-colors">
                  <Plus size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm font-bold">New wishlist</span>
                <span className="text-[10px] mt-1 font-medium opacity-60">Earn points by sharing</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <Search size={24} className="text-muted mb-3" />
              <p className="text-sm font-bold text-primary">No lists match "{search}"</p>
              <button onClick={() => setSearch('')} className="text-xs text-brand font-semibold mt-2 hover:underline">
                Clear search
              </button>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      <WishlistCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />

      {/* Edit modal */}
      <WishlistCreateModal
        open={!!editingList}
        onClose={() => setEditingList(null)}
        onSave={handleEdit}
        initial={editingList}
      />
    </div>
  )
}