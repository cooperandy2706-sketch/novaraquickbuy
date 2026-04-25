'use client'
// FILE: src/components/vendor/circles/PrivateDMDrawer.jsx
//
// A floating bottom-right drawer that opens when:
// - vendor taps a member's avatar/name → chat that person privately
// - member taps the vendor's message   → chat the vendor privately (buyer side)
//
// Used inside CircleRoomClient and CircleMessageBubble via the dmStore.

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Send, Loader2, MessageSquare,
  Minus, Maximize2, AlertCircle,
} from 'lucide-react'
import { useRealtimeDM }        from '@/hooks/useRealtimeDM'
import {
  getOrCreateDMThread,
  getDMMessages,
  sendDM,
  markDMRead,
} from '@/lib/actions/directMessages'
import { cn } from '@/utils/cn'

// ── Small typing indicator ────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0,1,2].map(i => (
        <div key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

// ── Single DM bubble ──────────────────────────────────────────────────────────
function DMBubble({ message, currentUserId }) {
  const isOwn    = message.sender_id === currentUserId
  const time     = new Date(message.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  const optimistic = message._optimistic

  return (
    <div className={cn('flex items-end gap-2 px-3 py-0.5', isOwn && 'flex-row-reverse')}>
      {!isOwn && (
        <div className="w-6 h-6 rounded-full bg-surface-3 overflow-hidden shrink-0 mb-0.5">
          {message.sender?.avatar_url
            ? <img src={message.sender.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted">
                {message.sender?.full_name?.charAt(0) ?? '?'}
              </div>
          }
        </div>
      )}
      <div className={cn('max-w-[78%] space-y-0.5', isOwn && 'items-end flex flex-col')}>
        <div className={cn(
          'rounded-2xl px-3 py-2 text-sm leading-relaxed break-words',
          isOwn
            ? 'bg-brand text-white rounded-br-sm'
            : 'bg-surface-3 text-primary rounded-bl-sm',
          optimistic && 'opacity-60',
        )}>
          {message.media_url && message.media_type?.startsWith('image') && (
            <img src={message.media_url} alt=""
              className="w-full max-h-40 object-cover rounded-xl mb-1.5 cursor-pointer"
              onClick={() => window.open(message.media_url, '_blank')} />
          )}
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
        </div>
        <span className="text-[10px] text-muted px-1">{time}</span>
      </div>
    </div>
  )
}

// ── Main drawer component ─────────────────────────────────────────────────────
export default function PrivateDMDrawer({ otherUser, currentUserId, onClose }) {
  const [thread,     setThread]    = useState(null)
  const [initMsgs,   setInitMsgs]  = useState([])
  const [loading,    setLoading]   = useState(true)
  const [sending,    setSending]   = useState(false)
  const [content,    setContent]   = useState('')
  const [error,      setError]     = useState(null)
  const [minimised,  setMinimised] = useState(false)

  const endRef  = useRef(null)
  const inputRef = useRef(null)

  // Bootstrap: get/create thread + load history
  useEffect(() => {
    if (!otherUser?.id) return
    getOrCreateDMThread(otherUser.id).then(async ({ thread: t, error: e }) => {
      if (e) { setError(e); setLoading(false); return }
      setThread(t)
      const msgs = await getDMMessages(t.id)
      setInitMsgs(msgs)
      setLoading(false)
      await markDMRead(t.id)
    })
  }, [otherUser?.id])

  const { messages, typing, append, sendTyping } = useRealtimeDM(initMsgs, thread?.id, currentUserId)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!minimised) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, minimised])

  useEffect(() => {
    if (!loading && !minimised) inputRef.current?.focus()
  }, [loading, minimised])

  const handleSend = useCallback(async () => {
    if (!content.trim() || sending || !thread) return
    setSending(true)
    setError(null)

    // Optimistic append
    const tempId = `opt-${Date.now()}`
    const optimistic = {
      id:         tempId,
      thread_id:  thread.id,
      sender_id:  currentUserId,
      content:    content.trim(),
      created_at: new Date().toISOString(),
      sender:     { id: currentUserId },
      _optimistic: true,
    }
    append(optimistic)
    const text = content.trim()
    setContent('')

    const res = await sendDM(thread.id, text)
    setSending(false)
    if (res?.error) {
      setError(res.error)
      // Remove optimistic on fail
      return
    }
  }, [content, sending, thread, currentUserId, append])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const name     = otherUser?.full_name ?? 'User'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-[999] flex flex-col bg-surface-2 rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-200',
      minimised ? 'w-72 h-14' : 'w-80 h-[480px] sm:w-96',
    )}>

      {/* Header */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-border shrink-0',
        minimised ? 'bg-brand cursor-pointer' : 'bg-white',
      )}
        onClick={minimised ? () => setMinimised(false) : undefined}
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand overflow-hidden">
            {otherUser?.avatar_url
              ? <img src={otherUser.avatar_url} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            }
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface-2" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold truncate', minimised ? 'text-white' : 'text-brand-800')}>{name}</p>
          {!minimised && (
            <p className="text-[10px] text-emerald-500 font-semibold">Online</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setMinimised(m => !m)}
            className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
              minimised ? 'text-white/70 hover:text-white' : 'text-muted hover:text-primary hover:bg-surface-3')}
          >
            {minimised ? <Maximize2 size={13} /> : <Minus size={13} />}
          </button>
          <button
            onClick={onClose}
            className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
              minimised ? 'text-white/70 hover:text-white' : 'text-muted hover:text-primary hover:bg-surface-3')}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {!minimised && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-3 space-y-0.5 scrollbar-none">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={20} className="text-muted animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <MessageSquare size={20} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-800">Private chat with {name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Messages are only visible to you and {name.split(' ')[0]}</p>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <DMBubble key={msg.id} message={msg} currentUserId={currentUserId} />
              ))
            )}

            {typing && <TypingDots />}
            <div ref={endRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-3 mb-1 flex items-center gap-2 text-xs text-danger bg-danger/5 border border-danger/20 rounded-xl px-3 py-2">
              <AlertCircle size={12} className="shrink-0" /> {error}
            </div>
          )}

          {/* Composer */}
          <div className="flex items-end gap-2 px-3 pb-3 pt-2 border-t border-border shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={content}
              onChange={e => { setContent(e.target.value); sendTyping() }}
              onKeyDown={handleKey}
              placeholder={`Message ${name.split(' ')[0]}…`}
              className="flex-1 rounded-2xl border border-border bg-surface-3 px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none max-h-24 overflow-y-auto scrollbar-none"
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="w-9 h-9 rounded-xl bg-brand hover:bg-brand-700 disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </>
      )}
    </div>
  )
}