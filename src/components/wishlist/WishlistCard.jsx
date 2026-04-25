'use client'
// FILE: src/components/wishlist/WishlistCard.jsx
// Wishlist grid tile — product collage, type badge, social stats, actions.
// Design: editorial magazine aesthetic — asymmetric collage layouts,
// type-specific colour coding, confident typography.

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import { LIST_TYPE_CONFIG } from '@/hooks/useWishlist'
import {
  Heart, Share2, MoreHorizontal, Edit2,
  Trash2, Archive, Lock, Globe, Users,
  Gift, Star, Package, Sparkles, Copy,
  TrendingUp, Eye, ChevronRight, Check
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import WishlistShareModal from './WishlistShareModal'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

const PRIVACY_CONFIG = {
  public:       { Icon: Globe,  label: 'Public',        color: 'text-brand'     },
  friends_only: { Icon: Users,  label: 'Friends only',  color: 'text-amber-500' },
  private:      { Icon: Lock,   label: 'Private',       color: 'text-muted' },
}

// ─────────────────────────────────────────────────────────────
// COLLAGE GRID  (up to 4 product images in a mosaic)
// ─────────────────────────────────────────────────────────────

function CollageGrid({ items = [], color = '#F0FDF4', emoji = '✨' }) {
  const live = items.filter(i => i.product_image)

  if (live.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: color }}>
        <span className="text-5xl opacity-50">{emoji}</span>
      </div>
    )
  }

  if (live.length === 1) {
    return (
      <img src={live[0].product_image} alt="" className="w-full h-full object-cover" />
    )
  }

  if (live.length === 2) {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-px bg-black/10">
        {live.slice(0, 2).map((i, idx) => (
          <img key={idx} src={i.product_image} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    )
  }

  if (live.length === 3) {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-px bg-black/10">
        <img src={live[0].product_image} alt="" className="w-full h-full object-cover row-span-2" />
        <img src={live[1].product_image} alt="" className="w-full h-full object-cover" />
        <img src={live[2].product_image} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }

  // 4+
  return (
    <div className="w-full h-full grid grid-cols-2 gap-px bg-black/10">
      {live.slice(0, 4).map((i, idx) => (
        <img key={idx} src={i.product_image} alt="" className="w-full h-full object-cover" />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONTEXT MENU
// ─────────────────────────────────────────────────────────────

function ContextMenu({ list, onEdit, onShare, onArchive, onDelete, onClose }) {
  return (
    <div onClick={e => { e.preventDefault(); e.stopPropagation() }}>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute right-3 top-14 z-[9999] bg-surface-3 rounded-2xl shadow-2xl border border-border py-1.5 w-44 overflow-hidden">
        {[
          { icon: Edit2,   label: 'Edit list',    action: () => { onEdit(list); onClose() }   },
          { icon: Share2,  label: 'Share link',   action: () => { onShare(list); onClose() }  },
          { icon: Archive, label: 'Archive',      action: () => { onArchive(list.id); onClose() }, warn: false },
          { icon: Trash2,  label: 'Delete',       action: () => { onDelete(list.id); onClose() },  warn: true  },
        ].map(item => (
          <button
            key={item.label}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); item.action(); }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-surface-2',
              item.warn ? 'text-red-500 hover:bg-red-500/10' : 'text-primary',
            )}
          >
            <item.icon size={13} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function WishlistCard({ list, onEdit, onShare, onArchive, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const cfg     = LIST_TYPE_CONFIG[list.list_type] ?? LIST_TYPE_CONFIG.general
  const privacy = PRIVACY_CONFIG[list.privacy] ?? PRIVACY_CONFIG.public

  const totalValue = (list.items ?? []).reduce((s, i) => s + (i.product_price ?? 0), 0)
  const topItem    = (list.items ?? []).sort((a,b) => (b.vote_count??0) - (a.vote_count??0))[0]

  const handleShareClick = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    // Closes context menu if open
    setMenuOpen(false)
    setShareModalOpen(true)
  }

  return (
    <Link href={`/wishlist/${list.id}`} className={cn("block group relative", menuOpen && "z-50")}>
      <div className="relative bg-surface-2 rounded-3xl border border-border overflow-hidden hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

        {/* Collage image */}
        <div className="relative h-44 overflow-hidden" style={{ background: cfg.bg }}>
          <CollageGrid items={list.items ?? []} color={cfg.bg} emoji={list.emoji} />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Top bar: privacy + menu */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            {/* Type badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[10px] font-black backdrop-blur-sm bg-black/30 border border-white/20"
            >
              <span>{list.emoji ?? cfg.emoji}</span>
              <span>{cfg.label}</span>
            </div>

            {/* Menu button */}
            <div className="relative" onClick={e => { e.preventDefault(); e.stopPropagation() }}>
              <button
                onClick={() => setMenuOpen(p => !p)}
                className="w-8 h-8 rounded-xl bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Bottom: item count + price */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <p className="text-white font-black text-base leading-none">{list.name}</p>
              {list.event_title && (
                <p className="text-white/70 text-[10px] font-medium mt-0.5">{list.event_title}</p>
              )}
            </div>
            {totalValue > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-white/70 font-medium">Total value</p>
                <p className="text-white font-black text-sm">{fmt(totalValue)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            {/* Items */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
              <Package size={11} className="text-muted" />
              {list.item_count}
            </div>
            {/* Votes */}
            {list.vote_count > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500">
                <Heart size={11} className="fill-rose-400" />
                {list.vote_count}
              </div>
            )}
            {/* Gifts */}
            {list.gift_count > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-purple-500">
                <Gift size={11} />
                {list.gift_count}
              </div>
            )}
            {/* Views */}
            {list.view_count > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                <Eye size={10} />
                {list.view_count}
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className={cn('flex items-center gap-1 text-[10px] font-bold', privacy.color)}>
            <privacy.Icon size={10} />
            {privacy.label}
          </div>
        </div>

        {/* Top voted item callout */}
        {topItem && topItem.vote_count > 0 && (
          <div className="px-4 py-2.5 flex items-center gap-2.5 bg-amber-500/10 border-b border-amber-500/20">
            <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
            <p className="text-[10px] font-semibold text-amber-500 truncate flex-1">
              Most wanted: {topItem.product_name}
            </p>
            <span className="text-[10px] font-black text-amber-500 shrink-0">
              {topItem.vote_count} ♥
            </span>
          </div>
        )}

        {/* Footer CTA */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5" onClick={handleShareClick}>
            <button className="flex items-center gap-1.5 text-[11px] font-bold text-secondary hover:text-brand transition-colors">
              <Share2 size={12} /> Share · +10 pts
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-secondary group-hover:text-brand transition-colors">
            View list <ChevronRight size={12} />
          </div>
        </div>

      </div>
      {/* Context Menu rendered outside overflow-hidden div */}
      {menuOpen && (
        <ContextMenu
          list={list}
          onEdit={onEdit}
          onShare={() => handleShareClick()}
          onArchive={onArchive}
          onDelete={onDelete}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {/* Share Modal */}
      <WishlistShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        list={list}
        onShareRecorded={onShare}
      />
    </Link>
  )
}