'use client'
// FILE: src/components/vendor/chat/ChatInbox.jsx

import { useState, useCallback } from 'react'
import { useRouter }             from 'next/navigation'
import { Search, MessageSquarePlus, X, Loader2 } from 'lucide-react'
import ChatThreadRow             from '@/components/vendor/chat/ChatThreadRow'
import { useRealtimeDMList }     from '@/hooks/useRealtimeDM'
import { useAuth }               from '@/hooks/useAuth'
import { searchDMThreads }       from '@/lib/actions/directMessages'
import { cn }                    from '@/utils/cn'

export default function ChatInbox({ initialThreads, activeThreadId }) {
  const { profile }    = useAuth()
  const currentUserId  = profile?.id ?? null
  const router         = useRouter()

  const { threads } = useRealtimeDMList(initialThreads, currentUserId)

  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState(null)  // null = not searched
  const [searching, setSearching] = useState(false)

  const handleSearch = useCallback(async (q) => {
    setQuery(q)
    if (!q.trim()) { setResults(null); return }
    setSearching(true)
    const res = await searchDMThreads(q)
    setResults(res)
    setSearching(false)
  }, [])

  const displayThreads = results ?? threads
  const totalUnread    = threads.reduce((s, t) => s + (t.unread ?? 0), 0)

  return (
    <div className="flex flex-col h-full bg-surface-2 border-r border-border">

      {/* Header */}
      <div className="px-4 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-primary text-base">Messages</h2>
            {totalUnread > 0 && (
              <p className="text-xs text-brand font-bold mt-0.5">
                {totalUnread} unread
              </p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-surface-3 border border-border text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-primary"
          />
          {query && (
            <button onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
              {searching ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {displayThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
              <MessageSquarePlus size={24} className="text-brand" />
            </div>
            <p className="text-sm font-bold text-primary">
              {query ? 'No conversations found' : 'No messages yet'}
            </p>
            <p className="text-xs text-muted mt-1">
              {query ? 'Try a different search' : 'Start a conversation from a circle or order'}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {displayThreads.map(thread => (
              <ChatThreadRow
                key={thread.id}
                thread={thread}
                active={thread.id === activeThreadId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}