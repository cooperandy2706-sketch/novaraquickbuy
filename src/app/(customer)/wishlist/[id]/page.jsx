'use client'
// FILE: src/app/(customer)/wishlist/[id]/page.jsx
// Owner's detailed view of a single wishlist.
// Shows all items in a responsive grid.
// Owner can: add items, reorder, edit notes, move, remove, share.

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useWishlistDetail, LIST_TYPE_CONFIG } from '@/hooks/useWishlist'
import WishlistCreateModal from '@/components/wishlist/WishlistCreateModal'
import WishlistShareModal from '@/components/wishlist/WishlistShareModal'
import { cn } from '@/utils/cn'
import {
  ArrowLeft, Share2, Plus, Edit2, Trash2,
  Package, Heart, Gift, Star, Globe, Lock,
  Users, MoreHorizontal, X, Check, Loader2,
  Sparkles, Copy, ExternalLink, MessageSquare,
  TrendingUp,
} from 'lucide-react'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

// ─────────────────────────────────────────────────────────────
// ITEM CARD (owner view)
// ─────────────────────────────────────────────────────────────

function OwnerItemCard({ item, onRemove, onUpdateNote, onTogglePriority, lists, onMove }) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [editNote,   setEditNote]   = useState(false)
  const [noteValue,  setNoteValue]  = useState(item.note ?? '')
  const [removing,   setRemoving]   = useState(false)

  const handleRemove = async () => {
    setRemoving(true)
    await onRemove(item.id)
  }

  const handleSaveNote = async () => {
    await onUpdateNote(item.id, { note: noteValue })
    setEditNote(false)
  }

  return (
    <div className={cn(
      'group relative bg-surface-2 rounded-3xl border overflow-hidden transition-all duration-300',
      removing ? 'opacity-0 scale-95 pointer-events-none' : '',
      item.is_purchased ? 'border-brand/30 bg-brand/5' : 'border-border hover:border-brand/30 hover:shadow-lg hover:-translate-y-0.5',
    )}>

      {/* Priority star */}
      <button
        onClick={() => onTogglePriority(item.id, item.priority > 0 ? 0 : 1)}
        className="absolute top-3 left-3 z-10 w-7 h-7 rounded-xl bg-surface-3/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface-3 transition-colors"
      >
        <Star
          size={13}
          className={cn('transition-all', item.priority > 0 ? 'text-amber-400 fill-amber-400 scale-110' : 'text-muted/50')}
        />
      </button>

      {/* Context menu */}
      <div className="absolute top-3 right-3 z-10" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="w-7 h-7 rounded-xl bg-surface-3/80 backdrop-blur-sm flex items-center justify-center text-secondary hover:bg-surface-3 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal size={13} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-9 z-30 bg-surface-3 rounded-2xl shadow-2xl border border-border py-1.5 w-44 overflow-hidden">
              {[
                { icon: MessageSquare, label: 'Add note',      action: () => { setEditNote(true);  setMenuOpen(false) } },
                { icon: Copy,          label: 'Move to list',  action: () => { setMenuOpen(false) }, sub: true },
                { icon: Trash2,        label: 'Remove',        action: () => { handleRemove(); setMenuOpen(false) }, warn: true },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
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
          </>
        )}
      </div>

      {/* Purchased badge */}
      {item.is_purchased && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-brand text-white text-[9px] font-black px-2.5 py-1 rounded-full">
          <Gift size={9} /> Gifted!
        </div>
      )}

      {/* Image */}
      <div className="h-44 overflow-hidden bg-surface-3 relative">
        {item.product_image ? (
          <img
            src={item.product_image}
            alt={item.product_name}
            className={cn(
              'w-full h-full object-cover transition-transform duration-400 group-hover:scale-105',
              item.is_purchased && 'opacity-50',
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} className="text-muted/30" />
          </div>
        )}

        {item.is_purchased && (
          <div className="absolute inset-0 bg-brand/10 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#052E16,#16A34A)' }}>
              <Gift size={22} className="text-white" />
            </div>
          </div>
        )}

        {/* Vote count */}
        {item.vote_count > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-surface-3/90 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Heart size={9} className="text-rose-400 fill-rose-400" />
            <span className="text-[10px] font-black text-primary">{item.vote_count} votes</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-bold text-primary line-clamp-2 leading-snug">
          {item.product_name}
        </h3>

        {item.variant_label && (
          <span className="inline-block text-[10px] font-medium text-secondary bg-surface-3 rounded-lg px-2 py-0.5">
            {item.variant_label}
          </span>
        )}

        <p className="text-base font-black text-primary tabular-nums">
          {fmt(item.product_price, item.currency)}
        </p>

        {/* Note */}
        {editNote ? (
          <div className="space-y-1.5">
            <textarea
              value={noteValue}
              onChange={e => setNoteValue(e.target.value)}
              placeholder='Add a hint for your friends, e.g. "I love the blue one"'
              rows={2}
              autoFocus
              className="w-full text-[11px] text-primary border border-brand/40 rounded-xl px-2.5 py-2 outline-none resize-none bg-brand/5 placeholder:text-muted"
            />
            <div className="flex gap-1.5">
              <button onClick={handleSaveNote} className="flex-1 py-1.5 bg-brand text-white text-[11px] font-black rounded-xl hover:bg-brand-600 transition-colors">Save</button>
              <button onClick={() => { setEditNote(false); setNoteValue(item.note ?? '') }} className="py-1.5 px-3 bg-surface-3 text-secondary text-[11px] font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        ) : item.note ? (
          <p
            onClick={() => setEditNote(true)}
            className="text-[11px] text-secondary italic leading-relaxed cursor-pointer hover:text-primary transition-colors"
          >
            "{item.note}"
          </p>
        ) : (
          <button
            onClick={() => setEditNote(true)}
            className="text-[10px] text-muted hover:text-brand transition-colors font-medium"
          >
            + Add a hint for friends
          </button>
        )}

        {/* Vendor + link */}
        {item.vendor_name && (
          <p className="text-[10px] text-muted truncate">{item.vendor_name}</p>
        )}

        {item.product_url && (
          <a
            href={item.product_url}
            className="flex items-center gap-1 text-[10px] text-brand hover:underline font-medium"
          >
            <ExternalLink size={9} /> View product
          </a>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function WishlistDetailPage() {
  const { id }  = useParams()
  const router  = useRouter()

  const {
    list, items, loading, error,
    addItem, removeItem, updateItem, moveItem, shareList,
    refetch, isOwner,
  } = useWishlistDetail(id)

  const [editOpen,  setEditOpen]  = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const cfg     = LIST_TYPE_CONFIG[list?.list_type] ?? LIST_TYPE_CONFIG.general
  const privacy = { public: Globe, friends_only: Users, private: Lock }[list?.privacy ?? 'public']
  const PrivacyIcon = privacy

  const totalValue  = items.reduce((s, i) => s + (i.product_price ?? 0), 0)
  const giftedCount = items.filter(i => i.is_purchased).length
  const topItem     = [...items].sort((a,b) => (b.vote_count??0) - (a.vote_count??0))[0]

  const handleShare = useCallback((platform = 'copy_link') => {
    shareList(platform)
  }, [shareList])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={28} className="text-brand animate-spin" />
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 text-center">
        <p className="text-neutral-500 mb-4">List not found.</p>
        <Link href="/wishlist" className="text-brand font-semibold hover:underline text-sm">
          ← Back to wishlists
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">

      {/* ── Back + header ── */}
      <div className="flex items-start gap-3 mb-6">
        <Link href="/wishlist" className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition-colors pt-1.5 shrink-0">
          <ArrowLeft size={13} /> My Lists
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{list.emoji}</span>
            <h1 className="text-xl font-black text-primary tracking-tight truncate">
              {list.name}
            </h1>
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full text-white"
              style={{ background: cfg.gradient.includes('emerald') ? '#16A34A' : cfg.accent }}
            >
              {cfg.label}
            </span>
          </div>
          {list.event_title && (
            <p className="text-xs text-secondary mt-0.5">{list.event_title}
              {list.event_date && (
                <span className="ml-2 text-muted">
                  · {new Date(list.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditOpen(true)}
            className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center text-muted hover:text-brand hover:bg-brand/10 transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-white text-xs font-black rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#052E16,#16A34A)' }}
          >
            <Share2 size={13} /> Share · +10 pts
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {[
          { label: 'Items',     value: items.length,  icon: Package,    color: '#16A34A' },
          { label: 'Votes',     value: list.vote_count ?? 0,  icon: Heart, color: '#F43F5E' },
          { label: 'Gifted',    value: giftedCount,   icon: Gift,       color: '#A855F7' },
          { label: 'Value',     value: fmt(totalValue), icon: TrendingUp, color: '#D97706' },
        ].map(s => (
          <div key={s.label} className="bg-surface-2 rounded-2xl border border-border p-3 text-center">
            <s.icon size={13} className="mx-auto mb-1" style={{ color: s.color }} />
            <p className="text-sm font-black text-primary leading-none truncate">{s.value}</p>
            <p className="text-[9px] text-muted font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Public link banner ── */}
      {list.privacy === 'public' && (
        <div className="flex items-center gap-3 bg-surface-2 border border-border rounded-2xl px-4 py-3 mb-6">
          <Globe size={14} className="text-brand shrink-0" />
          <p className="text-xs text-primary flex-1">
            <span className="font-bold">Shareable link:</span>{' '}
            <span className="font-mono text-secondary text-[11px]">
              {typeof window !== 'undefined' ? `${window.location.origin}/w/${list.share_code}` : `/w/${list.share_code}`}
            </span>
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText(
              `${window.location.origin}/w/${list.share_code}`
            )}
            className="text-[11px] text-brand font-black hover:underline shrink-0"
          >
            Copy
          </button>
        </div>
      )}

      {/* ── Items grid ── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5"
            style={{ background: cfg.bg }}
          >
            {list.emoji}
          </div>
          <h3 className="text-base font-black text-primary mb-2">No items yet</h3>
          <p className="text-xs text-secondary max-w-xs leading-relaxed mb-6">
            Browse products and tap the heart icon to add them here. Then share with friends and earn points.
          </p>
          <Link
            href="/explore"
            className="flex items-center gap-2 px-6 py-3 text-white text-sm font-black rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#052E16,#16A34A)' }}
          >
            <Sparkles size={14} /> Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(item => (
            <OwnerItemCard
              key={item.id}
              item={item}
              lists={[]}
              onRemove={removeItem}
              onUpdateNote={updateItem}
              onTogglePriority={(id, priority) => updateItem(id, { priority })}
              onMove={moveItem}
            />
          ))}

          {/* Add more tile */}
          <Link
            href="/explore"
            className="group flex flex-col items-center justify-center h-56 rounded-3xl border border-dashed border-border text-muted hover:border-brand hover:text-brand hover:bg-brand/10 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-surface-3 group-hover:bg-brand/20 flex items-center justify-center mb-3 transition-colors">
              <Plus size={22} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-bold">Add items</span>
            <span className="text-[10px] mt-1 opacity-60">Browse products</span>
          </Link>
        </div>
      )}

      {/* Edit modal */}
      <WishlistCreateModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => { await updateItem(list.id, data).catch(() => {}); setEditOpen(false) }}
        initial={list}
      />

      {/* Share sheet */}
      <WishlistShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        list={{ ...list, items }}
        onShareRecorded={handleShare}
      />
    </div>
  )
}