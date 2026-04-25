'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { X, Link2, Copy, Check, Share2 } from 'lucide-react'
import { LIST_TYPE_CONFIG } from '@/hooks/useWishlist'
import { formatCurrency } from '@/utils/formatCurrency'

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

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
    name: 'X (Twitter)',
    color: '#000000',
    slug: 'x',
    getIntent: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'messenger',
    name: 'Messenger',
    color: '#0084FF',
    slug: 'messenger',
    getIntent: (text, url) =>
      `fb-messenger://share/?link=${encodeURIComponent(url)}`,
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
  const cfg = LIST_TYPE_CONFIG[list.list_type] ?? LIST_TYPE_CONFIG.general

  const items = list.items ?? []
  const topItem = [...items].sort(
    (a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)
  )[0]
  const gridItems = items.slice(0, 3)
  const overflowCount = items.length - 3
  const totalValue = items.reduce((s, i) => s + (i.product_price ?? 0), 0)
  const giftedCount = items.filter((i) => i.is_purchased).length

  const handleShare = (brand) => {
    onShareRecorded?.(list, brand.id)
    if (brand.isCopyOnly) {
      brand.action(url)
      return
    }
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
        'fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4 sm:p-6 transition-all duration-300',
        isOpen
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-md bg-white dark:bg-[#0f0f11] rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300',
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-6 scale-95'
        )}
      >
        {/* ── HERO ── */}
        <div className="relative bg-[#1a1035] text-white overflow-hidden px-6 pt-6 pb-6">
          {/* Orbs */}
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-violet-600 opacity-30 pointer-events-none" />
          <div className="absolute bottom-0 left-4 w-28 h-28 rounded-full bg-blue-600 opacity-20 pointer-events-none" />

          {/* Top row */}
          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
              {list.owner?.avatar_url ? (
                <img
                  src={list.owner.avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-[11px] font-medium text-white">
                  {list.owner?.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="text-[12px] font-medium text-white/90">
                {list.owner?.full_name
                  ? `${list.owner.full_name}'s wishlist`
                  : 'My wishlist'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* List identity */}
          <div className="relative">
            <p className="text-4xl mb-2">{list.emoji ?? cfg.emoji ?? '🎁'}</p>
            <h2 className="text-[22px] font-medium text-white leading-snug mb-1.5">
              {list.name}
            </h2>
            {list.description && (
              <p className="text-[13px] text-white/60 leading-relaxed mb-4 max-w-xs">
                {list.description}
              </p>
            )}

            {/* Stat chips */}
            <div className="flex flex-wrap gap-2">
              {items.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1 text-[11px] font-medium text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                  {items.length} items
                </div>
              )}
              {list.vote_count > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1 text-[11px] font-medium text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                  {list.vote_count} votes
                </div>
              )}
              {giftedCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1 text-[11px] font-medium text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {giftedCount} gifted
                </div>
              )}
              {totalValue > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1 text-[11px] font-medium text-white/80">
                  💰 {fmt(totalValue)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Top item feature strip */}
          {topItem && (
            <div className="px-5 pt-5">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">
                Most wanted
              </p>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0 text-2xl">
                  {topItem.product_image ? (
                    <img
                      src={topItem.product_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '✨'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md px-1.5 py-0.5 text-[10px] font-medium mb-1">
                    ⭐ Top pick
                    {topItem.vote_count > 0 && ` · ${topItem.vote_count} votes`}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {topItem.product_name}
                  </p>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                    {fmt(topItem.product_price, topItem.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items grid */}
          {gridItems.length > 0 && (
            <div className="px-5 pt-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">
                All items
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {gridItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-white/10 flex items-center justify-center text-2xl overflow-hidden">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        '📦'
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate leading-tight mb-0.5">
                        {item.product_name}
                      </p>
                      <p className="text-[12px] font-medium text-violet-600 dark:text-violet-400">
                        {fmt(item.product_price, item.currency)}
                      </p>
                      {item.vote_count > 0 && (
                        <p className="text-[10px] text-rose-500 mt-0.5">
                          ♥ {item.vote_count}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {overflowCount > 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 aspect-square flex flex-col items-center justify-center gap-0.5">
                    <span className="text-lg font-medium text-gray-700 dark:text-white">
                      +{overflowCount}
                    </span>
                    <span className="text-[10px] text-gray-400">more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URL bar */}
          <div className="px-5 pt-5">
            <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-3.5 py-2.5">
              <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
              <span className="flex-1 text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                {url}
              </span>
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all',
                  copied
                    ? 'bg-violet-600 text-white'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                )}
              >
                {copied ? (
                  <>
                    <Check size={11} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={11} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 pt-4 pb-1 flex gap-3">
            <button
              onClick={() => { }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-[13px] font-medium transition-all active:scale-[0.98]"
            >
              <Share2 size={14} /> Share wishlist
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 rounded-2xl text-[13px] font-medium transition-all active:scale-[0.98] border border-gray-200 dark:border-white/10">
              <Copy size={14} /> Copy to mine
            </button>
          </div>

          {/* Social row */}
          <div className="px-5 pt-4 pb-6">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">
              Share via
            </p>
            <div className="flex gap-2.5">
              {SOCIAL_BRANDS.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleShare(brand)}
                  className="flex-1 flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className="w-full py-3 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 shadow-sm"
                    style={{ backgroundColor: brand.color }}
                  >
                    <img
                      src={`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${brand.slug}.svg`}
                      alt={brand.name}
                      className="w-4 h-4"
                      style={{ filter: 'invert(1) brightness(0) invert(1)' }}
                    />
                  </div>
                  <span className="text-[9px] font-medium text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors truncate w-full text-center">
                    {brand.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Native share footer */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <div className="border-t border-gray-100 dark:border-white/10 px-5 py-4 bg-gray-50 dark:bg-white/5">
            <button
              onClick={handleNativeShare}
              className="w-full py-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15 transition-all active:scale-[0.98]"
            >
              <Share2 size={15} /> Open share sheet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}