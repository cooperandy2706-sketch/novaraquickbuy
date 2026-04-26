'use client'
// FILE: src/components/video/FeedSearch.jsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [isSearching, setIsSearching] = useState(false)
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
    setIsSearching(false)
    onSearch?.(query.trim())
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleSelect = (item) => {
    saveRecent(item.label)
    setQuery(item.label)
    setFocused(false)
    setIsSearching(false)
    router.push(item.href)
  }

  const handleTrending = (term) => {
    setQuery(term)
    saveRecent(term)
    setFocused(false)
    setIsSearching(false)
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
        {!isSearching ? (
          <motion.div 
            layoutId="feed-search-bar"
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all duration-300',
              'bg-surface-2 border-2',
              focused
                ? 'border-brand shadow-brand bg-surface-1'
                : 'border-border hover:border-brand/40',
            )}
            onClick={() => setIsSearching(true)}
          >
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
              onFocus={() => setIsSearching(true)}
              placeholder="Search products, vendors, categories..."
              className="flex-1 bg-transparent text-sm outline-none text-primary placeholder:text-muted min-w-0 pointer-events-none lg:pointer-events-auto"
              autoComplete="off"
              readOnly={window.innerWidth < 1024}
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
            </div>
          </motion.div>
        ) : (
          <div className="h-[52px]" /> // Placeholder
        )}
      </form>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-surface flex flex-col h-dvh overflow-hidden"
          >
            <div className="p-4 border-b border-neutral-100 bg-white flex items-center gap-3">
              <motion.div 
                layoutId="feed-search-bar"
                className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-white border border-brand/30 rounded-[2rem] shadow-md"
              >
                <Search size={18} className="text-brand shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search products, vendors..."
                  className="flex-1 bg-transparent text-sm font-bold outline-none text-neutral-900"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="p-1">
                    <X size={14} className="text-neutral-400" />
                  </button>
                )}
              </motion.div>
              <button 
                onClick={() => { setIsSearching(false); setFocused(false) }}
                className="text-sm font-black uppercase tracking-widest text-neutral-500 active:scale-95 transition-transform shrink-0 pr-2"
              >
                Cancel
              </button>
            </div>

            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 25 }}
              className="flex-1 overflow-y-auto bg-surface"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                    {query.length >= 2 ? 'Matching Results' : 'Trending Guesses'}
                  </h3>
                  {loading ? (
                    <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TrendingUp size={12} className="text-neutral-300" />
                  )}
                </div>

                <div className="grid gap-3">
                  {query.length >= 2 ? (
                    suggestions.length > 0 ? (
                      suggestions.map((item, i) => (
                        <motion.button
                          key={`${item.type}-${item.id}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => { handleSelect(item); setIsSearching(false) }}
                          className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-neutral-100 shadow-sm active:scale-[0.98] transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-50 shrink-0 border border-neutral-100 flex items-center justify-center">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : item.type === 'product' ? (
                              <Package size={20} className="text-brand" />
                            ) : (
                              <Store size={20} className="text-brand" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-bold text-neutral-800 truncate">{item.label}</p>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                              {item.sub}
                            </p>
                          </div>
                          <ArrowUpRight size={14} className="text-neutral-300 group-hover:text-brand transition-colors" />
                        </motion.button>
                      ))
                    ) : !loading && (
                      <div className="py-10 text-center">
                        <p className="text-sm text-neutral-400">No matches found for "{query}"</p>
                      </div>
                    )
                  ) : (
                    <>
                      {recent.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 px-1">Recent Searches</p>
                          <div className="grid gap-2">
                            {recent.slice(0, 3).map(r => (
                              <button key={r} onClick={() => handleTrending(r)} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-100 text-sm font-bold text-neutral-600">
                                <Clock size={14} /> {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {TRENDING.map((term, i) => (
                          <motion.button
                            key={term}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => handleTrending(term)}
                            className="p-3 bg-white rounded-xl border border-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-600 hover:border-brand/30 transition-all text-center"
                          >
                            {term}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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