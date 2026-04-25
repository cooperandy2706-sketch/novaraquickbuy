'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { X, Copy, Check, Share2, Link } from 'lucide-react'
import { LIST_TYPE_CONFIG } from '@/hooks/useWishlist'
import { formatCurrency } from '@/utils/formatCurrency'

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

// ─── UserAvatar ───────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#4f46e5', '#c7d2fe'],
  ['#7c3aed', '#ede9fe'],
  ['#0891b2', '#cffafe'],
  ['#059669', '#d1fae5'],
  ['#d97706', '#fef3c7'],
  ['#db2777', '#fce7f3'],
  ['#dc2626', '#fee2e2'],
]
function getAvatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
function UserAvatar({ user, size = 40 }) {
  const [imgError, setImgError] = useState(false)
  const name = user?.full_name ?? user?.name ?? ''
  const [bg, fg] = getAvatarColor(name)
  const initials = getInitials(name)
  const fontSize = Math.max(11, Math.round(size * 0.38))
  if (user?.avatar_url && !imgError) {
    return (
      <img
        src={user.avatar_url}
        alt={name || 'User'}
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 ring-2 ring-white/30"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, background: bg, fontSize }}
      className="rounded-full flex items-center justify-center shrink-0 ring-2 ring-white/20 font-semibold select-none"
    >
      <span style={{ color: fg, lineHeight: 1 }}>{initials}</span>
    </div>
  )
}

// ─── Social brands ────────────────────────────────────────────
const SOCIAL_BRANDS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    slug: 'whatsapp',
    getIntent: (text, url) =>
      `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    slug: 'facebook',
    getIntent: (text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'x',
    name: 'X',
    color: '#000000',
    slug: 'x',
    getIntent: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    slug: 'instagram',
    isCopyOnly: true,
    action: (url) => {
      navigator.clipboard.writeText(url)
      window.open('https://instagram.com', '_blank')
    },
  },
]

// ─── Main ─────────────────────────────────────────────────────
export default function WishlistShareModal({
  isOpen,
  onClose,
  list,
  onShareRecorded,
}) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) setMounted(true)
  }, [isOpen])

  if (!mounted && !isOpen) return null
  if (!list) return null

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/w/${list.share_code}`
      : ''
  const shareText = `Check out my wishlist "${list.name}" on QuickBuy! 🎁`

  const items = list.items ?? []
  const topItem = [...items].sort(
    (a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)
  )[0]
  const gridItems = items.slice(0, 5)
  const overflowCount = Math.max(0, items.length - 5)
  const totalValue = items.reduce((s, i) => s + (i.product_price ?? 0), 0)
  const giftedCount = items.filter((i) => i.is_purchased).length

  const handleShare = (brand) => {
    onShareRecorded?.(list, brand.id)
    if (brand.isCopyOnly) { brand.action(url); return }
    window.open(brand.getIntent(shareText, url), '_blank')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    onShareRecorded?.(list, 'copy_link')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: list.name, text: shareText, url })
        onShareRecorded?.(list, 'native')
      } catch (_) { }
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-6 transition-all duration-300',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'relative w-full sm:max-w-md flex flex-col max-h-[94vh] sm:max-h-[92vh] transition-all duration-300 overflow-hidden',
          'rounded-t-[32px] sm:rounded-[32px]',
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-8 scale-[0.98]'
        )}
        style={{ background: '#f5f4f0' }}
      >

        {/* ── HERO ── */}
        <div
          className="relative px-6 pt-6 pb-16 overflow-hidden flex-shrink-0"
          style={{ background: '#1c1033' }}
        >
          {/* Orbs */}
          <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full bg-violet-600 opacity-35 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-blue-600 opacity-18 pointer-events-none" />
          <div className="absolute top-10 left-[45%] w-24 h-24 rounded-full bg-violet-500 opacity-12 pointer-events-none" />

          {/* Top bar */}
          <div className="relative flex items-center gap-3 mb-7">
            {/* Avatar + owner */}
            <div className="relative">
              <UserAvatar user={list.owner} size={44} />
              <div className="absolute inset-[-3px] rounded-full border border-white/15 pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/45 tracking-wide mb-0.5">Wishlist by</p>
              <p className="text-[15px] font-semibold text-white leading-none truncate">
                {list.owner?.full_name ?? 'Someone'}
              </p>
            </div>

            {/* Event badge */}
            {list.event_date && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span className="text-[11px] text-white/70 font-medium">
                  {list.event_title ?? 'Event'}
                </span>
              </div>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/60 hover:text-white hover:bg-white/20 transition-all ml-1 shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          {/* List identity */}
          <div className="relative">
            <p className="text-[42px] mb-2.5 leading-none">{list.emoji ?? '🎁'}</p>
            <h2 className="text-[26px] font-bold text-white leading-tight tracking-tight mb-1.5">
              {list.name}
            </h2>
            {list.description && (
              <p className="text-[13px] text-white/50 leading-relaxed mb-5 max-w-[280px]">
                {list.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-1.5">
              {items.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/9 border border-white/12 rounded-full px-2.5 py-1 text-[11px] text-white/70 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  {items.length} items
                </div>
              )}
              {(list.vote_count ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 bg-white/9 border border-white/12 rounded-full px-2.5 py-1 text-[11px] text-white/70 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {list.vote_count} votes
                </div>
              )}
              {giftedCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/9 border border-white/12 rounded-full px-2.5 py-1 text-[11px] text-white/70 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {giftedCount} gifted
                </div>
              )}
              {totalValue > 0 && (
                <div className="flex items-center gap-1.5 bg-white/9 border border-white/12 rounded-full px-2.5 py-1 text-[11px] text-white/70 font-medium">
                  💰 {fmt(totalValue)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: '#f5f4f0', marginTop: -24, borderRadius: '24px 24px 0 0' }}
        >
          <div className="px-5 pt-5 pb-8 space-y-5">

            {/* Coins nudge */}
            <div className="flex items-center gap-3 bg-white border border-violet-100 rounded-2xl px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-lg shrink-0">
                ✨
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-violet-800 mb-0.5">
                  Earn 10 coins for sharing
                </p>
                <p className="text-[11px] text-violet-500">
                  Share your list and get rewarded
                </p>
              </div>
            </div>

            {/* Top pick */}
            {topItem && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Most wanted
                </p>
                <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center text-2xl shrink-0">
                    {topItem.product_image ? (
                      <img
                        src={topItem.product_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : '🎁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 rounded-md px-1.5 py-0.5 text-[10px] font-semibold mb-1">
                      ⭐ Top pick{topItem.vote_count > 0 ? ` · ${topItem.vote_count} votes` : ''}
                    </div>
                    <p className="text-[14px] font-semibold text-gray-900 truncate">
                      {topItem.product_name}
                    </p>
                    <p className="text-[14px] font-bold text-violet-600">
                      {fmt(topItem.product_price, topItem.currency)}
                    </p>
                  </div>
                  <button className="px-3.5 py-2 bg-violet-600 text-white text-[12px] font-semibold rounded-xl shrink-0">
                    🎁 Gift
                  </button>
                </div>
              </div>
            )}

            {/* Items grid */}
            {gridItems.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  All items
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {gridItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-[18px] overflow-hidden border border-gray-100"
                    >
                      <div className="aspect-square bg-gray-50 flex items-center justify-center text-2xl overflow-hidden">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : '📦'}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-gray-900 truncate leading-tight mb-0.5">
                          {item.product_name}
                        </p>
                        <p className="text-[12px] font-bold text-violet-600">
                          {fmt(item.product_price, item.currency)}
                        </p>
                        {(item.vote_count ?? 0) > 0 && (
                          <p className="text-[10px] text-rose-500 font-medium mt-0.5">
                            ♥ {item.vote_count}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {overflowCount > 0 && (
                    <div className="rounded-[18px] border border-dashed border-gray-200 bg-gray-50 aspect-square flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[20px] font-bold text-gray-600">+{overflowCount}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-200" />

            {/* URL strip */}
            <div className="bg-white rounded-2xl border border-gray-100 px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <Link size={13} className="text-violet-600" />
              </div>
              <span className="flex-1 text-[11px] font-mono text-gray-500 truncate">
                {url}
              </span>
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0',
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                )}
              >
                {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98]"
                onClick={handleNativeShare}
              >
                <Share2 size={15} /> Share wishlist
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98]">
                <Copy size={14} /> Copy mine
              </button>
            </div>

            {/* Social row */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Share via
              </p>
              <div className="flex gap-2">
                {SOCIAL_BRANDS.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleShare(brand)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border-none text-white text-[11px] font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: brand.color }}
                  >
                    <img
                      src={`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${brand.slug}.svg`}
                      alt={brand.name}
                      className="w-3.5 h-3.5"
                      style={{ filter: 'invert(1) brightness(0) invert(1)' }}
                    />
                    <span className="hidden sm:inline">{brand.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}