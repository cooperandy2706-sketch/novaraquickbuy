'use client'
// FILE: src/components/wishlist/WishlistQuickAdd.jsx
// Drop-in "Add to Wishlist" button for product pages.
// Shows a dropdown of existing lists + create new option.
// Fully animated, optimistic UI, works with any product shape.

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useWishlistQuickAdd } from '@/hooks/useWishlist'
import { LIST_TYPE_CONFIG }    from '@/hooks/useWishlist'
import { cn } from '@/utils/cn'
import {
  Heart, Plus, Check, Loader2,
  Sparkles, ChevronDown,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// LIST ROW
// ─────────────────────────────────────────────────────────────

function ListRow({ list, isSaving, isSuccess, onAdd }) {
  const cfg = LIST_TYPE_CONFIG[list.list_type] ?? LIST_TYPE_CONFIG.general
  return (
    <button
      onClick={() => onAdd(list.id)}
      disabled={isSaving || isSuccess}
      className={cn(
        'w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all',
        isSuccess
          ? 'bg-brand/10'
          : 'hover:bg-surface-3',
      )}
    >
      {/* Emoji */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ background: cfg.bg ?? 'rgba(22, 163, 74, 0.15)' }}
      >
        {list.emoji ?? cfg.emoji}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold truncate', isSuccess ? 'text-brand' : 'text-primary')}>
          {list.name}
        </p>
        <p className="text-[10px] text-secondary mt-0.5">
          {list.item_count} item{list.item_count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* State */}
      <div className="shrink-0">
        {isSaving ? (
          <Loader2 size={14} className="text-brand animate-spin" />
        ) : isSuccess ? (
          <Check size={14} className="text-brand" />
        ) : (
          <Plus size={14} className="text-muted" />
        )}
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

/**
 * WishlistQuickAdd
 *
 * Props:
 *   product     object   — { id, name, price, currency, image_url, vendor_id, vendor_name, ... }
 *   size        'sm' | 'md' | 'icon'
 *   className   string
 */
export default function WishlistQuickAdd({ product, size = 'md', className, customTrigger, popoverClassName = 'right-0 top-12' }) {
  const dropRef = useRef(null)
  const {
    open, setOpen,
    lists, loading,
    saving, success,
    addToList,
    alreadyAdded,
    isAuthenticated,
  } = useWishlistQuickAdd(product)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const sizeClasses = {
    icon: 'w-9 h-9 rounded-xl',
    sm:   'px-3 py-2 rounded-xl text-xs gap-1.5',
    md:   'px-4 py-2.5 rounded-2xl text-sm gap-2',
    lg:   'px-6 py-3 rounded-2xl text-sm gap-2 w-full',
  }

  return (
    <div ref={dropRef} className={cn('relative', className)}>

      {/* Trigger button */}
      {customTrigger ? customTrigger({ onClick: () => setOpen(p => !p), alreadyAdded }) : (
        <button
          onClick={() => setOpen(p => !p)}
          className={cn(
            'flex items-center justify-center font-bold transition-all active:scale-95',
            sizeClasses[size],
            alreadyAdded
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
              : 'bg-surface-3 text-secondary border border-border hover:border-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10',
          )}
        >
          <Heart
            size={size === 'icon' ? 15 : 14}
            className={cn('transition-all', alreadyAdded && 'fill-rose-500')}
          />
          {size !== 'icon' && (
            <>
              <span>{alreadyAdded ? 'Saved' : 'Save'}</span>
              {(size === 'md' || size === 'lg') && <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />}
            </>
          )}
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className={cn("absolute z-50 w-64 bg-surface-2 rounded-3xl shadow-2xl border border-border overflow-hidden", popoverClassName)}>

          <div className="px-3.5 py-3 border-b border-border">
            <p className="text-[10px] font-black text-muted uppercase tracking-wider">
              Add to wishlist
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="px-4 py-5 text-center">
              <Heart size={22} className="text-rose-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-primary mb-1">Sign in to save items</p>
              <p className="text-[10px] text-secondary mb-3">
                Create wishlists and share them with friends
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-black rounded-xl"
                style={{ background: 'linear-gradient(135deg,#052E16,#16A34A)' }}
                onClick={() => setOpen(false)}
              >
                Sign in <Sparkles size={11} />
              </Link>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-brand animate-spin" />
            </div>
          ) : lists.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-xs font-bold text-primary mb-1">No lists yet</p>
              <p className="text-[10px] text-secondary mb-3">Create one to start saving items</p>
              <Link
                href="/wishlist?create=1"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-black rounded-xl"
                style={{ background: 'linear-gradient(135deg,#052E16,#16A34A)' }}
                onClick={() => setOpen(false)}
              >
                <Plus size={12} /> Create list
              </Link>
            </div>
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto divide-y divide-border">
                {lists.map(list => (
                  <ListRow
                    key={list.id}
                    list={list}
                    isSaving={saving === list.id}
                    isSuccess={success === list.id}
                    onAdd={addToList}
                  />
                ))}
              </div>

              {/* Create new */}
              <div className="border-t border-border p-1.5">
                <Link
                  href="/wishlist?create=1"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-brand hover:bg-brand/10 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Plus size={13} className="text-brand" />
                  </div>
                  Create new list
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}