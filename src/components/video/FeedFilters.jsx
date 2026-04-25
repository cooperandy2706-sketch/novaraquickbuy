'use client'
// FILE: src/components/video/FeedFilters.jsx

import { useState } from 'react'
import {
  SlidersHorizontal, X, ChevronDown,
  Flame, Clock, TrendingUp, Star, BadgeCheck,
} from 'lucide-react'
import { cn } from '@/utils/cn'

export const CATEGORIES = [
  { id: 'all',     label: 'For You',  emoji: '✨' },
  { id: 'fashion', label: 'Fashion',  emoji: '👗' },
  { id: 'tech',    label: 'Tech',     emoji: '📱' },
  { id: 'beauty',  label: 'Beauty',   emoji: '💄' },
  { id: 'food',    label: 'Food',     emoji: '🍔' },
  { id: 'home',    label: 'Home',     emoji: '🏠' },
  { id: 'health',  label: 'Health',   emoji: '💪' },
  { id: 'sports',  label: 'Sports',   emoji: '⚽' },
  { id: 'kids',    label: 'Kids',     emoji: '🧸' },
  { id: 'art',     label: 'Art',      emoji: '🎨' },
  { id: 'music',   label: 'Music',    emoji: '🎵' },
  { id: 'travel',  label: 'Travel',   emoji: '✈️' },
]

export const SORT_OPTIONS = [
  { id: 'latest',    label: 'Latest',       icon: <Clock size={13} />        },
  { id: 'trending',  label: 'Trending',     icon: <TrendingUp size={13} />   },
  { id: 'popular',   label: 'Most Liked',   icon: <Flame size={13} />        },
  { id: 'top_rated', label: 'Top Rated',    icon: <Star size={13} />         },
  { id: 'verified',  label: 'Verified Only',icon: <BadgeCheck size={13} />   },
]

export default function FeedFilters({
  category,
  onCategoryChange,
  sort,
  onSortChange,
  onlyVerified,
  onVerifiedToggle,
  activeFiltersCount = 0,
  onClearFilters,
}) {
  const [showSortMenu, setShowSortMenu] = useState(false)
  const activeSort = SORT_OPTIONS.find(s => s.id === sort) ?? SORT_OPTIONS[0]

  return (
    <div>

      {/* Category tabs */}
      <div className="relative">
        <div
          className="flex items-center gap-2 overflow-x-auto py-3 px-4 sm:px-6 pr-20"
          style={{ scrollbarWidth: 'none' }}
        >
          {CATEGORIES.map(cat => {
            const active = category === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold',
                  'whitespace-nowrap transition-all duration-200 shrink-0 border',
                  active
                    ? 'bg-brand text-white border-brand shadow-brand'
                    : 'bg-surface-2 border-border text-muted hover:border-brand/40 hover:text-primary hover:bg-surface-3'
                )}
              >
                <span className="text-sm leading-none">{cat.emoji}</span>
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Sort button — sticky right */}
        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2">
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(s => !s)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold',
                'bg-surface-2 border border-border shadow-sm',
                'hover:border-brand/40 hover:bg-surface-3 transition-all duration-200',
                showSortMenu && 'border-brand bg-brand/10 text-brand'
              )}
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">{activeSort.label}</span>
              <ChevronDown
                size={11}
                className={cn('transition-transform duration-200', showSortMenu && 'rotate-180')}
              />
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showSortMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowSortMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-surface-2 rounded-2xl border border-border overflow-hidden z-30 animate-scale-in shadow-2xl"
                >
                  <div className="p-1.5">
                    {SORT_OPTIONS.map(opt => {
                      const isActive =
                        opt.id === 'verified'
                          ? onlyVerified
                          : opt.id === sort

                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (opt.id === 'verified') onVerifiedToggle?.()
                            else onSortChange?.(opt.id)
                            setShowSortMenu(false)
                          }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm',
                            'transition-all duration-150 text-left',
                            isActive
                              ? 'bg-brand/10 text-brand font-bold'
                              : 'text-secondary hover:bg-surface-3'
                          )}
                        >
                          <span className={isActive ? 'text-brand' : 'text-neutral-400'}>
                            {opt.icon}
                          </span>
                          {opt.label}
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 px-4 sm:px-6 pb-3 flex-wrap">
          <span className="text-xs text-neutral-400 font-medium">Filters:</span>

          {category !== 'all' && (
            <span className="flex items-center gap-1 bg-brand/10 text-brand text-xs font-bold px-2.5 py-1 rounded-full border border-brand/20">
              {CATEGORIES.find(c => c.id === category)?.emoji}{' '}
              {CATEGORIES.find(c => c.id === category)?.label}
              <button onClick={() => onCategoryChange('all')}>
                <X size={11} className="hover:text-danger ml-0.5" />
              </button>
            </span>
          )}

          {sort !== 'latest' && (
            <span className="flex items-center gap-1 bg-brand/10 text-brand text-xs font-bold px-2.5 py-1 rounded-full border border-brand/20">
              {activeSort.label}
              <button onClick={() => onSortChange?.('latest')}>
                <X size={11} className="hover:text-danger ml-0.5" />
              </button>
            </span>
          )}

          {onlyVerified && (
            <span className="flex items-center gap-1 bg-brand/10 text-brand text-xs font-bold px-2.5 py-1 rounded-full border border-brand/20">
              <BadgeCheck size={11} /> Verified only
              <button onClick={onVerifiedToggle}>
                <X size={11} className="hover:text-danger ml-0.5" />
              </button>
            </span>
          )}

          <button
            onClick={onClearFilters}
            className="text-xs text-neutral-400 hover:text-danger font-medium ml-1 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}