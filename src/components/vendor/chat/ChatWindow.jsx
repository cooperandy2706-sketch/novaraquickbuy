'use client'
// FILE: src/components/vendor/chat/ChatWindow.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter }       from 'next/navigation'
import {
  ArrowLeft, MoreHorizontal, Trash2,
  Phone, Video as VideoIcon, Info,
} from 'lucide-react'
import { useRealtimeDM }     from '@/hooks/useRealtimeDM'
import { useAuth }           from '@/hooks/useAuth'
import ChatMessage           from '@/components/vendor/chat/ChatMessage'
import ChatComposer          from '@/components/vendor/chat/ChatComposer'
import {
  getDMMessages,
  markDMRead,
  deleteDMThread,
}                            from '@/lib/actions/directMessages'
import { cn }                from '@/utils/cn'

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-0.5">
        {[0,1,2].map(i => (
          <div key={i}
            className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p className="text-xs text-neutral-400">{name?.split(' ')[0]} is typing…</p>
    </div>
  )
}

// ── Date separator ────────────────────────────────────────────────────────────
function DateSep({ date }) {
  const d     = new Date(date)
  const today = new Date()
  const yest  = new Date(); yest.setDate(yest.getDate() - 1)
  const label = d.toDateString() === today.toDateString() ? 'Today'
    : d.toDateString() === yest.toDateString() ? 'Yesterday'
    : d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 h-px bg-neutral-100" />
      <span className="text-[10px] font-semibold text-neutral-400 bg-white px-2">{label}</span>
      <div className="flex-1 h-px bg-neutral-100" />
    </div>
  )
}

export default function ChatWindow({ thread, initialMessages }) {
  const router       = useRouter()
  const { profile }  = useAuth()
  const currentUserId = profile?.id ?? null

  const other = thread?.other
  const name  = other?.full_name ?? 'User'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore,     setHasMore]     = useState((initialMessages?.length ?? 0) === 50)
  const [page,        setPage]        = useState(0)
  const [showMenu,    setShowMenu]    = useState(false)

  const endRef       = useRef(null)
  const containerRef = useRef(null)

  const { messages, typing, append, remove, sendTyping } = useRealtimeDM(
    initialMessages, thread?.id, currentUserId
  )

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Mark as read on open
  useEffect(() => {
    if (thread?.id) markDMRead(thread.id)
  }, [thread?.id])

  // Load older messages
  const handleLoadMore = useCallback(async () => {
    if (!thread?.id || loadingMore) return
    setLoadingMore(true)
    const next  = page + 1
    const older = await getDMMessages(thread.id, next, 50)
    setLoadingMore(false)
    if (older.length < 50) setHasMore(false)
    if (older.length > 0) {
      // Preserve scroll position
      const container = containerRef.current
      const prevHeight = container?.scrollHeight ?? 0
      older.forEach(m => {
        if (!messages.some(x => x.id === m.id)) append(m)
      })
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight
      })
    }
    setPage(next)
  }, [thread?.id, page, loadingMore, messages, append])

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const d = new Date(msg.created_at).toDateString()
    if (!acc.length || acc[acc.length - 1].date !== d) acc.push({ date: d, messages: [] })
    acc[acc.length - 1].messages.push(msg)
    return acc
  }, [])

  const handleDeleteThread = async () => {
    if (!confirm('Delete this entire conversation?')) return
    await deleteDMThread(thread.id)
    router.push('/vendor/chat')
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-neutral-200 shadow-sm shrink-0">
        {/* Back (mobile) */}
        <button
          onClick={() => router.push('/vendor/chat')}
          className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-brand hover:bg-brand-50 transition-all shrink-0">
          <ArrowLeft size={18} />
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-brand">
            {other?.avatar_url
              ? <img src={other.avatar_url} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">{initials}</div>
            }
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-800 text-sm truncate">{name}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">Online</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative">
            <button onClick={() => setShowMenu(o => !o)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-brand hover:bg-brand-50 transition-all">
              <MoreHorizontal size={17} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-20 w-44 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 overflow-hidden">
                  <button onClick={() => { setShowMenu(false); handleDeleteThread() }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-danger hover:bg-danger/5 transition-colors">
                    <Trash2 size={13} /> Delete conversation
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-none py-2">
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center py-3">
            <button onClick={handleLoadMore} disabled={loadingMore}
              className="text-xs font-semibold text-brand hover:text-brand-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {loadingMore
                ? <><span className="w-3 h-3 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /> Loading…</>
                : '↑ Load older messages'
              }
            </button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-16 h-16 rounded-full bg-brand overflow-hidden mb-4 mx-auto">
              {other?.avatar_url
                ? <img src={other.avatar_url} alt={name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{initials}</div>
              }
            </div>
            <p className="font-bold text-brand-800">{name}</p>
            <p className="text-xs text-neutral-400 mt-1">
              This is the beginning of your private conversation.
            </p>
          </div>
        )}

        {/* Grouped messages */}
        {grouped.map(group => (
          <div key={group.date}>
            <DateSep date={group.messages[0].created_at} />
            {group.messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                currentUserId={currentUserId}
                onDelete={remove}
              />
            ))}
          </div>
        ))}

        {/* Typing */}
        {typing && <TypingIndicator name={name} />}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <ChatComposer
        threadId={thread?.id}
        onSent={append}
        onTyping={sendTyping}
        disabled={!thread?.id}
      />
    </div>
  )
}