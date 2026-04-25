'use client'
// FILE: src/components/video/FeedSearch.jsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, X, Clock, TrendingUp,
  Mic, ArrowUpRight, Store, Package,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const TRENDING = [
  'Ankara dress',   'Nike sneakers',  'iPhone cases',
  'Skincare',       'Leather bag',    'Home decor',
  'Kids clothing',  'Electronics',    'Food delivery',
]

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch { return defaultValue }
  })

  const set = useCallback((v) => {
    setValue(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  }, [key])

  return [value, set]
}

export default function FeedSearch({ onSearch, className }) {
  const router       = useRouter()
  const supabase     = createClient()
  const inputRef     = useRef(null)
  const containerRef = useRef(null)
  const debounceRef  = useRef(null)

  const [query,       setQuery]       = useState('')
  const [focused,     setFocused]     = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [recent,      setRecent]      = useLocalStorage('novara-searches', [])

  // ── Live Supabase suggestions ────────────────────────────────
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)

      const [productsRes, vendorsRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, category, images')
          .ilike('name', `%${query}%`)
          .eq('is_active', true)
          .limit(4),
        supabase
          .from('vendors')
          .select('id, store_name, logo_url, verified')
          .ilike('store_name', `%${query}%`)
          .eq('is_active', true)
          .limit(3),
      ])

      setSuggestions([
        ...(productsRes.data ?? []).map(p => ({
          type:  'product',
          id:    p.id,
          label: p.name,
          sub:   p.category,
          image: p.images?.[0],
          href:  `/product/${p.id}`,
        })),
        ...(vendorsRes.data ?? []).map(v => ({
          type:     'vendor',
          id:       v.id,
          label:    v.store_name,
          sub:      'Store',
          verified: v.verified,
          image:    v.logo_url,
          href:     `/store/${v.id}`,
        })),
      ])

      setLoading(false)
    }, 280)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // ── Click outside closes dropdown ───────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const saveRecent = (q) => {
    if (!q.trim()) return
    setRecent(prev => [q, ...prev.filter(r => r !== q)].slice(0, 6))
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    saveRecent(query.trim())
    setFocused(false)
    onSearch?.(query.trim())
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleSelect = (item) => {
    saveRecent(item.label)
    setQuery(item.label)
    setFocused(false)
    router.push(item.href)
  }

  const handleTrending = (term) => {
    setQuery(term)
    saveRecent(term)
    setFocused(false)
    onSearch?.(term)
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice search not supported in this browser'); return }
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      setQuery(e.results[0][0].transcript)
      inputRef.current?.focus()
    }
    recognition.start()
  }

  const clearRecent = (e, term) => {
    e.stopPropagation()
    setRecent(prev => prev.filter(r => r !== term))
  }

  const showDropdown = focused && (
    query.length === 0 || suggestions.length > 0 || loading
  )

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div className={cn(
          'flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all duration-300',
          'bg-surface-2 border-2',
          focused
            ? 'border-brand shadow-brand ring-4 ring-brand/10 bg-surface-1'
            : 'border-border hover:border-brand/40',
        )}>
          <Search
            size={18}
            className={cn(
              'shrink-0 transition-colors duration-200',
              focused ? 'text-brand' : 'text-muted'
            )}
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search products, vendors, categories..."
            className="flex-1 bg-transparent text-sm outline-none text-primary placeholder:text-muted min-w-0"
            autoComplete="off"
          />

          <div className="flex items-center gap-1 shrink-0">
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus() }}
                className="w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center hover:bg-surface-2 transition-colors border border-border"
              >
                <X size={11} className="text-muted" />
              </button>
            )}

            <button
              type="button"
              onClick={handleVoice}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-brand hover:bg-brand/10 transition-all"
              title="Voice search"
            >
              <Mic size={16} />
            </button>

            {query && (
              <button
                type="submit"
                className="btn btn-primary btn-sm px-3 py-1.5 text-xs"
              >
                Search
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface-2 rounded-2xl border border-border overflow-hidden animate-fade-up shadow-2xl"
        >

          {/* Live suggestions */}
          {query.length >= 2 && (
            <div className="p-2">
              {loading ? (
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted">Searching...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 pb-2">
                    Results
                  </p>
                  {suggestions.map(item => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand/10 transition-all text-left group border border-transparent hover:border-brand/20 mb-1"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-3 flex items-center justify-center shrink-0 border border-border">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : item.type === 'product' ? (
                          <Package size={16} className="text-brand" />
                        ) : (
                          <Store size={16} className="text-brand" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary truncate group-hover:text-brand">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-muted font-black uppercase tracking-wider opacity-60">{item.sub}</p>
                      </div>
                      <ArrowUpRight
                        size={14}
                        className="text-muted group-hover:text-brand shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                      />
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-3 py-5 text-center">
                  <p className="text-sm text-muted">
                    No results for <strong>"{query}"</strong>
                  </p>
                  <button
                    onClick={handleSubmit}
                    className="text-xs text-brand font-medium mt-1.5 hover:text-brand-600 transition-colors"
                  >
                    Search all results →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty state — recent + trending */}
          {query.length === 0 && (
            <div className="p-3 space-y-4">

              {/* Recent searches */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                      Recent
                    </p>
                    <button
                      onClick={() => setRecent([])}
                      className="text-[10px] text-muted hover:text-danger font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {recent.slice(0, 5).map(term => (
                      <button
                        key={term}
                        onClick={() => handleTrending(term)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-surface-3 transition-all text-left group border border-transparent hover:border-border"
                      >
                        <Clock size={14} className="text-muted shrink-0" />
                        <span className="flex-1 text-sm text-secondary font-medium truncate group-hover:text-primary">
                          {term}
                        </span>
                        <button
                          onClick={(e) => clearRecent(e, term)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-danger/10 rounded-lg text-muted hover:text-danger"
                        >
                          <X size={12} />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider px-1 mb-2.5">
                  Trending now
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((term, i) => (
                    <button
                      key={term}
                      onClick={() => handleTrending(term)}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider',
                        'transition-all duration-200 hover:scale-[1.05] active:scale-95 border shadow-sm',
                        i < 3
                          ? 'bg-brand/10 text-brand border-brand/20 hover:bg-brand hover:text-white'
                          : 'bg-surface-3 text-muted border-border hover:bg-surface-1 hover:text-primary hover:border-brand/40'
                      )}
                    >
                      <TrendingUp size={10} />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}