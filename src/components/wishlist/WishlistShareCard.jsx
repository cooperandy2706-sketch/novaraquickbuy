'use client'
// FILE: src/components/wishlist/WishlistShareCard.jsx

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/utils/cn'
import { LIST_TYPE_CONFIG } from '@/hooks/useWishlist'
import {
  Heart, Gift, Share2, Copy, Check,
  ExternalLink, Star, Package, Sparkles,
  Award, Globe, UserPlus, X,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import WishlistShareModal from './WishlistShareModal'

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

function timeToEvent(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  if (diff < 0) return null
  const days = Math.ceil(diff / 86400000)
  if (days === 0) return 'Today! 🎉'
  if (days === 1) return 'Tomorrow!'
  if (days <= 30) return `${days} days away`
  const months = Math.round(days / 30)
  return `${months} month${months !== 1 ? 's' : ''} away`
}

// ─────────────────────────────────────────────────────────────
// USER AVATAR
// ─────────────────────────────────────────────────────────────

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

function UserAvatar({ user, size = 44, ringClass = 'ring-2 ring-white/30' }) {
  const [imgError, setImgError] = useState(false)
  const name = user?.full_name ?? user?.name ?? ''
  const [bg, fg] = getAvatarColor(name)
  const initials = getInitials(name)
  const fontSize = Math.max(12, Math.round(size * 0.38))

  if (user?.avatar_url && !imgError) {
    return (
      <img
        src={user.avatar_url}
        alt={name || 'User'}
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
        className={cn('rounded-full object-cover shrink-0', ringClass)}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, background: bg, fontSize }}
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 font-semibold select-none',
        ringClass
      )}
    >
      <span style={{ color: fg, lineHeight: 1 }}>{initials}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VOTE BUTTON
// ─────────────────────────────────────────────────────────────

function VoteButton({ itemId, voteCount, hasVoted, onVote, size = 'md' }) {
  const [optimistic, setOptimistic] = useState(null)
  const [busy, setBusy] = useState(false)

  const displayVoted = optimistic !== null ? optimistic : hasVoted
  const displayCount =
    optimistic !== null ? voteCount + (optimistic ? 1 : -1) : voteCount

  const handle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    setOptimistic(!displayVoted)
    const result = await onVote(itemId)
    if (result === null) setOptimistic(null)
    setBusy(false)
  }

  return (
    <button
      onClick={handle}
      className={cn(
        'flex items-center gap-1.5 rounded-2xl border font-medium transition-all duration-200',
        size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs',
        displayVoted
          ? 'bg-rose-50 border-rose-200 text-rose-500'
          : 'bg-white border-gray-200 text-gray-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500',
        busy && 'opacity-60 cursor-not-allowed'
      )}
    >
      <Heart
        size={size === 'sm' ? 11 : 13}
        className={cn('transition-all duration-200', displayVoted && 'fill-rose-500 scale-125')}
      />
      {displayCount > 0 ? displayCount : 'Love it'}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// GIFT MODAL
// ─────────────────────────────────────────────────────────────

function GiftModal({ item, ownerName, onClose, onBuy, isAuthenticated }) {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed z-[9999] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-4">
        <div
          className="w-full sm:max-w-md overflow-hidden shadow-2xl"
          style={{ background: '#f5f4f0', borderRadius: '32px 32px 0 0' }}
        >
          {/* Header */}
          <div className="relative px-5 py-5 text-white overflow-hidden" style={{ background: '#1c1033' }}>
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-violet-600 opacity-30 pointer-events-none" />
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0">
                  <Gift size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[11px] text-white/50 mb-0.5">Gifting to</p>
                  <p className="text-[15px] font-semibold text-white">{ownerName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="relative flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center text-2xl shrink-0">
                {item.product_image ? (
                  <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                ) : '📦'}
              </div>
              <div>
                <p className="text-[13px] font-medium text-white line-clamp-2 mb-1">
                  {item.product_name}
                </p>
                <p className="text-[18px] font-bold text-violet-300">
                  {fmt(item.product_price, item.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-4">
            {!isAuthenticated && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How should we sign the gift?"
                  className="w-full border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 transition-all"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Gift message <span className="text-gray-300 font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Write a sweet message for ${ownerName}…`}
                rows={3}
                className="w-full border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 resize-none transition-all"
              />
            </div>
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Sparkles size={14} className="text-violet-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-violet-700 leading-relaxed">
                <strong>NovaPay Escrow:</strong> Payment is held securely until delivery confirmed.
                The item will be marked as gifted on {ownerName}'s wishlist.
              </p>
            </div>
            <button
              onClick={() => onBuy({ message, gifterName: name })}
              disabled={!isAuthenticated && !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              <Gift size={15} /> Gift {fmt(item.product_price, item.currency)} · Checkout →
            </button>
            {!isAuthenticated && (
              <p className="text-center text-[11px] text-gray-400">
                <Link href="/login" className="text-violet-600 font-medium hover:underline">
                  Sign in
                </Link>{' '}
                for faster checkout and to track your gift
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// ITEM CARD (public view)
// ─────────────────────────────────────────────────────────────

function PublicItemCard({ item, hasVoted, onVote, onGift, isOwner }) {
  const isPurchased = item.is_purchased
  const isTopPick = item.priority > 0 && !isPurchased

  return (
    <div
      className={cn(
        'group relative rounded-3xl overflow-hidden transition-all duration-300',
        isPurchased
          ? 'border border-violet-200 bg-violet-50'
          : 'bg-white border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:-translate-y-0.5'
      )}
    >
      {isTopPick && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-amber-400 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">
          <Star size={8} className="fill-white" /> Top pick
        </div>
      )}
      {isPurchased && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-violet-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full">
          <Gift size={9} /> Gifted
        </div>
      )}

      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-50">
        {item.product_image ? (
          <img
            src={item.product_image}
            alt={item.product_name}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              !isPurchased && 'group-hover:scale-105',
              isPurchased && 'opacity-40'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📦
          </div>
        )}
        {isPurchased && (
          <div className="absolute inset-0 flex items-center justify-center bg-violet-500/10">
            <div className="w-14 h-14 rounded-full bg-violet-600 flex items-center justify-center shadow-xl">
              <Gift size={22} className="text-white" />
            </div>
          </div>
        )}
        {(item.vote_count ?? 0) > 0 && !isPurchased && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
            <Heart size={10} className="text-rose-500 fill-rose-400" />
            <span className="text-[10px] font-semibold text-gray-700">{item.vote_count}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {item.product_name}
        </h3>
        {item.vendor_name && (
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
            via {item.vendor_name}
          </p>
        )}
        {item.variant_label && (
          <span className="inline-block text-[10px] font-medium text-gray-500 bg-gray-100 rounded-lg px-2 py-0.5">
            {item.variant_label}
          </span>
        )}
        {item.note && (
          <p className="text-[11px] text-gray-400 italic line-clamp-2 leading-relaxed">
            "{item.note}"
          </p>
        )}
        <p className="text-base font-bold text-violet-600 tabular-nums">
          {fmt(item.product_price, item.currency)}
        </p>

        {isPurchased ? (
          <div className="flex items-center gap-2 text-[11px] text-violet-500 font-medium">
            <Check size={13} /> Already gifted
          </div>
        ) : isOwner ? (
          <VoteButton itemId={item.id} voteCount={item.vote_count} hasVoted={hasVoted} onVote={onVote} />
        ) : (
          <div className="flex gap-2">
            <VoteButton itemId={item.id} voteCount={item.vote_count} hasVoted={hasVoted} onVote={onVote} />
            <button
              onClick={() => onGift(item)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.97] transition-all"
            >
              <Gift size={12} /> Gift
            </button>
          </div>
        )}

        {item.product_url && !isPurchased && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-violet-500 transition-colors font-medium"
          >
            <ExternalLink size={10} /> View product
          </a>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SIGN-UP NUDGE
// ─────────────────────────────────────────────────────────────

function SignupNudge({ shareCode }) {
  return (
    <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="relative px-5 py-6 text-white overflow-hidden" style={{ background: '#1c1033' }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-600 opacity-25 pointer-events-none" />
        <p className="text-3xl mb-3 relative">🛍️</p>
        <h3 className="text-[18px] font-semibold text-white leading-tight mb-2 relative">
          Create your own wishlist
        </h3>
        <p className="text-[13px] text-white/55 leading-relaxed relative">
          Join free and let your friends buy gifts for you — powered by NovaPay Escrow.
        </p>
      </div>

      <div className="px-5 py-5 space-y-4" style={{ background: '#f5f4f0' }}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '⭐', label: 'Earn points for sharing' },
            { icon: '❤️', label: 'Friends vote on favourites' },
            { icon: '🎁', label: 'Get gifts from friends' },
            { icon: '🔒', label: 'NovaPay Escrow protected' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-base">{f.icon}</span>
              <span className="text-[11px] text-gray-500 font-medium leading-tight">{f.label}</span>
            </div>
          ))}
        </div>
        <Link
          href={`/register?ref=wishlist_${shareCode}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white text-sm font-semibold bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all"
        >
          <UserPlus size={15} /> Get started free
        </Link>
        <Link
          href="/login"
          className="block text-center text-[11px] text-gray-400 hover:text-violet-500 transition-colors"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function WishlistShareCard({
  list,
  items = [],
  owner,
  myVotes = new Set(),
  onVote,
  onShare,
  onCopyList,
  isAuthenticated,
  isOwner,
}) {
  const router = useRouter()
  const [giftItem, setGiftItem] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [sortBy, setSortBy] = useState('position')
  const [copyLoading, setCopyLoading] = useState(false)
  const [copiedList, setCopiedList] = useState(false)

  const eventText = timeToEvent(list?.event_date)

  const sorted = [...items].sort((a, b) => {
    if (sortBy === 'votes') return b.vote_count - a.vote_count
    if (sortBy === 'price') return b.product_price - a.product_price
    return (a.position ?? 0) - (b.position ?? 0)
  })

  const active = sorted.filter((i) => !i.is_purchased)
  const purchased = sorted.filter((i) => i.is_purchased)
  const displayed = [...active, ...purchased]

  const totalValue = items.reduce((s, i) => s + i.product_price, 0)
  const giftedCount = purchased.length
  const topVoted = [...items].sort((a, b) => b.vote_count - a.vote_count)[0]

  const handleAuthVote = useCallback(
    async (itemId) => {
      if (!isAuthenticated) {
        router.push(`/login?ref=wishlist_${list?.share_code ?? ''}`)
        return null
      }
      return onVote?.(itemId)
    },
    [isAuthenticated, list, onVote, router]
  )

  const handleGiftBuy = useCallback(
    ({ message, gifterName }) => {
      if (!giftItem) return
      const params = new URLSearchParams({
        product_id: giftItem.product_id ?? '',
        item_id: giftItem.id,
        list_id: list.id,
        owner_id: list.user_id,
        is_gift: 'true',
        gifter_name: gifterName || '',
        gift_message: message || '',
      })
      router.push(`/checkout?${params}`)
      setGiftItem(null)
    },
    [giftItem, list, router]
  )

  const handleCopyList = async () => {
    if (!isAuthenticated) {
      router.push(`/register?ref=wishlist_${list.share_code}&copy=1`)
      return
    }
    setCopyLoading(true)
    await onCopyList?.()
    setCopyLoading(false)
    setCopiedList(true)
    setTimeout(() => setCopiedList(false), 3000)
  }

  if (!list) return null

  return (
    <div className="min-h-screen" style={{ background: '#f5f4f0' }}>

      {/* ── HERO ── */}
      <div
        className="relative text-white overflow-hidden"
        style={{ background: '#1c1033', minHeight: 360 }}
      >
        {/* Orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-600 opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-blue-600 opacity-15 pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full bg-violet-800 opacity-20 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-5 pt-12 pb-28">

          {/* Owner row */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <UserAvatar user={owner} size={52} ringClass="ring-[2.5px] ring-white/25" />
              <div className="absolute inset-[-4px] rounded-full border border-white/12 pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/45 tracking-wide mb-0.5">Wishlist by</p>
              <p className="text-[16px] font-semibold text-white leading-none truncate">
                {isOwner ? 'You' : (owner?.full_name ?? 'Someone')}
              </p>
            </div>

            {eventText && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span className="text-[11px] text-white/70 font-medium">📅 {eventText}</span>
              </div>
            )}
          </div>

          {/* List identity */}
          <p className="text-[46px] mb-3 leading-none">{list.emoji ?? '🎁'}</p>
          <h1 className="text-[30px] sm:text-[34px] font-bold text-white leading-tight tracking-tight mb-2">
            {list.name}
          </h1>
          {list.event_title && (
            <p className="text-[13px] text-white/55 font-medium mb-1">{list.event_title}</p>
          )}
          {list.description && (
            <p className="text-[13px] text-white/50 max-w-sm leading-relaxed mb-5">
              {list.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-2 mb-7">
            {items.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/12 rounded-full px-3 py-1.5 text-[11px] text-white/75 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {items.length} items
              </div>
            )}
            {(list.vote_count ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/12 rounded-full px-3 py-1.5 text-[11px] text-white/75 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {list.vote_count} votes
              </div>
            )}
            {giftedCount > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/12 rounded-full px-3 py-1.5 text-[11px] text-white/75 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {giftedCount} gifted
              </div>
            )}
            {(list.view_count ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/12 rounded-full px-3 py-1.5 text-[11px] text-white/75 font-medium">
                <Globe size={10} className="opacity-70" />
                {list.view_count} views
              </div>
            )}
            {totalValue > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/12 rounded-full px-3 py-1.5 text-[11px] text-white/75 font-medium">
                💰 {fmt(totalValue)}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setShareOpen(true); onShare?.('open') }}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98]"
            >
              <Share2 size={14} /> Share
            </button>
            {!isOwner && (
              <button
                onClick={handleCopyList}
                disabled={copyLoading || copiedList}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {copiedList ? (
                  <><Check size={14} className="text-emerald-400" /> Copied!</>
                ) : copyLoading ? (
                  <Sparkles size={14} className="animate-pulse" />
                ) : (
                  <><Copy size={14} /> Copy to my list</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── FLOATED BODY ── */}
      <div
        className="relative z-10 -mt-6 rounded-t-[28px]"
        style={{ background: '#f5f4f0' }}
      >

        {/* Top voted callout */}
        {topVoted && topVoted.vote_count >= 2 && !topVoted.is_purchased && (
          <div className="max-w-2xl mx-auto px-4 pt-5 mb-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center text-2xl">
                {topVoted.product_image ? (
                  <img src={topVoted.product_image} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : '✨'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Award size={12} className="text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Most wanted</span>
                </div>
                <p className="text-[13px] font-semibold text-gray-900 truncate">{topVoted.product_name}</p>
                <p className="text-[13px] font-bold text-violet-600">
                  {fmt(topVoted.product_price, topVoted.currency)}
                </p>
              </div>
              <VoteButton
                itemId={topVoted.id}
                voteCount={topVoted.vote_count}
                hasVoted={myVotes.has(topVoted.id)}
                onVote={handleAuthVote}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Items section */}
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-24">

          {/* Sort bar */}
          {items.length > 1 && (
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] font-semibold text-gray-700">
                {active.length} item{active.length !== 1 ? 's' : ''}
                {giftedCount > 0 && (
                  <span className="text-violet-500 ml-1">· {giftedCount} gifted 🎁</span>
                )}
              </p>
              <div className="flex gap-0.5 bg-white rounded-xl border border-gray-100 p-0.5">
                {[
                  { id: 'position', label: 'Default' },
                  { id: 'votes', label: '♥ Votes' },
                  { id: 'price', label: 'Price' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                      sortBy === s.id
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid */}
          {displayed.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {displayed.map((item) => (
                <PublicItemCard
                  key={item.id}
                  item={item}
                  hasVoted={myVotes.has(item.id)}
                  onVote={handleAuthVote}
                  onGift={setGiftItem}
                  isOwner={isOwner}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-violet-500" />
              </div>
              <p className="text-[13px] font-semibold text-gray-700">This wishlist is empty</p>
              <p className="text-xs text-gray-400 mt-1">Items will appear here once added</p>
            </div>
          )}

          {!isAuthenticated && (
            <div className="mt-8">
              <SignupNudge shareCode={list.share_code} />
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <WishlistShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        list={list}
        onShareRecorded={onShare}
      />

      {/* Gift modal */}
      {giftItem && (
        <GiftModal
          item={giftItem}
          ownerName={owner?.full_name ?? 'them'}
          onClose={() => setGiftItem(null)}
          onBuy={handleGiftBuy}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  )
}